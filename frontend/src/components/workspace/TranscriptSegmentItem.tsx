'use client';

import React, { useEffect, useRef } from 'react';
import { Play, MessageSquare } from 'lucide-react';
import { TranscriptSegment, CommentHighlight } from '@/types/meeting';
import { Avatar } from '@/components/ui/Avatar';
import styles from './TranscriptPanel.module.css';

interface TranscriptSegmentItemProps {
  segment: TranscriptSegment;
  isActive: boolean;
  searchQuery: string;
  annotations: CommentHighlight[];
  onSeek: (seconds: number) => void;
  onTextSelected: (selection: {
    segmentId: string;
    selectedText: string;
    startOffset: number;
    endOffset: number;
    rect: { top: number; left: number; width: number };
  }) => void;
  onViewAnnotation: (annotation: CommentHighlight, rect: { top: number; left: number }) => void;
}

const PALETTE_MAP: Record<string, { code: string; bg: string }> = {
  '#f59e0b': { code: '#F59E0B', bg: 'rgba(245, 158, 11, 0.25)' },
  '#3b82f6': { code: '#3B82F6', bg: 'rgba(59, 130, 246, 0.25)' },
  '#10b981': { code: '#10B981', bg: 'rgba(16, 185, 129, 0.25)' },
  '#ec4899': { code: '#EC4899', bg: 'rgba(236, 72, 153, 0.25)' },
  'yellow': { code: '#F59E0B', bg: 'rgba(245, 158, 11, 0.25)' },
  'blue': { code: '#3B82F6', bg: 'rgba(59, 130, 246, 0.25)' },
  'green': { code: '#10B981', bg: 'rgba(16, 185, 129, 0.25)' },
  'pink': { code: '#EC4899', bg: 'rgba(236, 72, 153, 0.25)' },
};

function getAnnotationColorStyle(colorCode?: string) {
  const key = (colorCode || '#F59E0B').toLowerCase();
  if (PALETTE_MAP[key]) return PALETTE_MAP[key];
  return {
    code: colorCode || '#F59E0B',
    bg: `${colorCode || '#F59E0B'}40`,
  };
}

export const TranscriptSegmentItem: React.FC<TranscriptSegmentItemProps> = ({
  segment,
  isActive,
  searchQuery,
  annotations,
  onSeek,
  onTextSelected,
  onViewAnnotation,
}) => {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll into view when segment becomes active
  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActive]);

  const formatTimestamp = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${padMins}:${padSecs}`;
  };

  // Handle text selection in segment text
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) return;

    // Verify selection is within textRef
    if (textRef.current && textRef.current.contains(selection.anchorNode)) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const fullText = segment.text;
        const startOffset = fullText.indexOf(selectedText);
        const endOffset = startOffset >= 0 ? startOffset + selectedText.length : selectedText.length;

        onTextSelected({
          segmentId: segment.id,
          selectedText,
          startOffset: startOffset >= 0 ? startOffset : 0,
          endOffset,
          rect: {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
          },
        });
      } catch (err) {
        console.error('Error getting selection range:', err);
      }
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // If text was selected, do NOT seek audio
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }
    onSeek(segment.startTime);
  };

  // Render search highlights on unannotated text
  const renderSearchHighlight = (text: string, query: string, keyPrefix: string = 'search') => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={`${keyPrefix}-${i}`} className={styles.highlight}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Render annotated segment text
  const renderAnnotatedText = () => {
    const text = segment.text;

    // Filter annotations valid for this text
    const validAnnotations = annotations
      .map((ann) => {
        let start = ann.startOffset ?? 0;
        let end = ann.endOffset ?? 0;
        if (ann.selectedText && (start === 0 && end === 0 || text.substring(start, end) !== ann.selectedText)) {
          const idx = text.indexOf(ann.selectedText);
          if (idx >= 0) {
            start = idx;
            end = idx + ann.selectedText.length;
          }
        }
        return { ...ann, _start: start, _end: end };
      })
      .filter((ann) => ann._end > ann._start && ann._start < text.length)
      .sort((a, b) => a._start - b._start);

    if (validAnnotations.length === 0) {
      return renderSearchHighlight(text, searchQuery);
    }

    const elements: React.ReactNode[] = [];
    let currentIdx = 0;

    validAnnotations.forEach((ann, idx) => {
      // Unannotated segment prior to this annotation
      if (ann._start > currentIdx) {
        const unannotatedText = text.substring(currentIdx, ann._start);
        elements.push(
          <span key={`plain-${currentIdx}`}>
            {renderSearchHighlight(unannotatedText, searchQuery, `plain-${currentIdx}`)}
          </span>
        );
      }

      // Annotated text segment
      const targetStart = Math.max(currentIdx, ann._start);
      const targetEnd = Math.min(text.length, ann._end);
      const annText = text.substring(targetStart, targetEnd);

      const colorStyle = getAnnotationColorStyle(ann.colorCode);
      const colorHex = colorStyle.code;
      const isComment = ann.annotationType === 'comment' || Boolean(ann.commentText);

      elements.push(
        <span key={`ann-wrapper-${ann.id}-${idx}`}>
          <mark
            className={styles.userHighlightMark}
            style={{
              backgroundColor: colorStyle.bg,
              color: '#FFFFFF',
              borderBottom: `2px solid ${colorHex}`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onViewAnnotation(ann, {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX + rect.width / 2,
              });
            }}
            title={isComment ? `Comment by ${ann.authorName}: "${ann.commentText}"` : `Highlighted by ${ann.authorName}`}
          >
            {renderSearchHighlight(annText, searchQuery, `ann-${ann.id}`)}
          </mark>

          {isComment && (
            <button
              type="button"
              className={styles.commentBadge}
              onClick={(e) => {
                e.stopPropagation();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onViewAnnotation(ann, {
                  top: rect.top + window.scrollY,
                  left: rect.left + window.scrollX + rect.width / 2,
                });
              }}
              title={`View comment: "${ann.commentText}"`}
            >
              <MessageSquare size={11} style={{ color: colorHex }} />
            </button>
          )}
        </span>
      );

      currentIdx = Math.max(currentIdx, targetEnd);
    });

    // Trailing unannotated text
    if (currentIdx < text.length) {
      const trailingText = text.substring(currentIdx);
      elements.push(
        <span key={`trailing-${currentIdx}`}>
          {renderSearchHighlight(trailingText, searchQuery, `trailing-${currentIdx}`)}
        </span>
      );
    }

    return elements;
  };

  const commentCount = annotations.filter((a) => a.commentText || a.annotationType === 'comment').length;
  const highlightCount = annotations.filter((a) => a.annotationType === 'highlight' && !a.commentText).length;

  return (
    <div
      ref={rowRef}
      className={`${styles.segmentRow} ${isActive ? styles.activeSegment : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSeek(segment.startTime);
        }
      }}
    >
      <div className={styles.speakerHeader}>
        <div className={styles.speakerIdentity}>
          <Avatar name={segment.speakerName} size="sm" />
          <span className={styles.speakerName}>{segment.speakerName}</span>

          {(commentCount > 0 || highlightCount > 0) && (
            <span className={styles.hasCommentsBadge}>
              <MessageSquare size={10} />
              <span>
                {commentCount > 0 ? `${commentCount} comment${commentCount > 1 ? 's' : ''}` : ''}
                {commentCount > 0 && highlightCount > 0 ? ' • ' : ''}
                {highlightCount > 0 ? `${highlightCount} highlight${highlightCount > 1 ? 's' : ''}` : ''}
              </span>
            </span>
          )}
        </div>

        <button
          className={styles.timeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onSeek(segment.startTime);
          }}
          title={`Seek audio to ${formatTimestamp(segment.startTime)}`}
        >
          <Play size={10} />
          <span>{formatTimestamp(segment.startTime)}</span>
        </button>
      </div>

      <div ref={textRef} className={styles.segmentText} onMouseUp={handleMouseUp}>
        {renderAnnotatedText()}
      </div>
    </div>
  );
};
