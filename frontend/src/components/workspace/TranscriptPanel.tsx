'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Highlighter } from 'lucide-react';
import { MeetingDetail, TranscriptSegment, CommentHighlight } from '@/types/meeting';
import { TranscriptSegmentItem } from './TranscriptSegmentItem';
import { AnnotationToolbar } from './AnnotationToolbar';
import { CommentPopover } from './CommentPopover';
import { api } from '@/lib/api';
import styles from './TranscriptPanel.module.css';

interface TranscriptPanelProps {
  meeting?: MeetingDetail;
  segments: TranscriptSegment[];
  currentTime: number;
  isPlaying?: boolean;
  onSeek: (seconds: number) => void;
  onAnnotationUpdated?: () => void;
}

interface SelectionState {
  segmentId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  position: { top: number; left: number };
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  meeting,
  segments,
  currentTime,
  isPlaying = false,
  onSeek,
  onAnnotationUpdated,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('all');
  const [commentsState, setCommentsState] = useState<CommentHighlight[]>(meeting?.comments || []);
  const [showHint, setShowHint] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('fireflies_dismiss_transcript_hint');
      if (dismissed === 'true') {
        setShowHint(false);
      }
    }
  }, []);

  const handleDismissHint = () => {
    setShowHint(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('fireflies_dismiss_transcript_hint', 'true');
    }
  };

  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [activePopover, setActivePopover] = useState<{
    mode: 'create' | 'view';
    position: { top: number; left: number };
    colorCode?: string;
    annotation?: CommentHighlight;
  } | null>(null);

  // Sync state if meeting prop updates
  useEffect(() => {
    if (meeting?.comments) {
      setCommentsState(meeting.comments);
    }
  }, [meeting?.comments]);

  // Unique speakers list
  const speakers = useMemo(() => {
    const set = new Set<string>();
    segments.forEach((s) => {
      if (s.speakerName) set.add(s.speakerName);
    });
    return Array.from(set);
  }, [segments]);

  // Filtered segments based on search query & speaker selection
  const filteredSegments = useMemo(() => {
    return segments.filter((segment) => {
      const matchesSpeaker =
        selectedSpeaker === 'all' ||
        segment.speakerName.toLowerCase() === selectedSpeaker.toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        segment.speakerName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSpeaker && matchesSearch;
    });
  }, [segments, searchQuery, selectedSpeaker]);

  // Match counter for active search
  const totalMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return filteredSegments.length;
  }, [filteredSegments, searchQuery]);

  // Handle text selection from TranscriptSegmentItem with clamped positioning
  const handleTextSelected = (sel: {
    segmentId: string;
    selectedText: string;
    startOffset: number;
    endOffset: number;
    rect: { top: number; left: number; width: number };
  }) => {
    setActivePopover(null);

    const minLeft = 140;
    const maxLeft = typeof window !== 'undefined' ? Math.max(140, window.innerWidth - 140) : sel.rect.left;
    const clampedLeft = Math.max(minLeft, Math.min(sel.rect.left + sel.rect.width / 2, maxLeft));

    setSelection({
      segmentId: sel.segmentId,
      selectedText: sel.selectedText,
      startOffset: sel.startOffset,
      endOffset: sel.endOffset,
      position: {
        top: sel.rect.top,
        left: clampedLeft,
      },
    });
  };

  // Create highlight annotation
  const handleHighlight = async (colorCode: string) => {
    if (!meeting || !selection) return;
    try {
      const newAnn = await api.createAnnotation(meeting.id, {
        segmentId: selection.segmentId,
        selectedText: selection.selectedText,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        annotationType: 'highlight',
        colorCode,
        authorName: 'Alex Rivers',
      });

      setCommentsState((prev) => [...prev, newAnn]);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      onAnnotationUpdated?.();
    } catch (err) {
      console.error('Failed to create highlight annotation:', err);
    }
  };

  // Open comment creation popover
  const handleOpenCommentForm = (colorCode: string) => {
    if (!selection) return;
    const pos = { ...selection.position };
    setActivePopover({
      mode: 'create',
      position: pos,
      colorCode,
    });
  };

  // Save created comment
  const handleSaveComment = async (commentText: string) => {
    if (!meeting || !selection) return;
    try {
      const newAnn = await api.createAnnotation(meeting.id, {
        segmentId: selection.segmentId,
        selectedText: selection.selectedText,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        commentText,
        annotationType: 'comment',
        colorCode: activePopover?.colorCode || '#6366F1',
        authorName: 'Alex Rivers',
      });

      setCommentsState((prev) => [...prev, newAnn]);
      setActivePopover(null);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
      onAnnotationUpdated?.();
    } catch (err) {
      console.error('Failed to save comment annotation:', err);
    }
  };

  // View existing annotation
  const handleViewAnnotation = (annotation: CommentHighlight, pos: { top: number; left: number }) => {
    setSelection(null);
    setActivePopover({
      mode: 'view',
      position: pos,
      annotation,
    });
  };

  // Update existing annotation color in place
  const handleUpdateAnnotationColor = async (annotationId: string, newColorCode: string) => {
    if (!meeting) return;

    const targetAnn = commentsState.find((a) => a.id === annotationId);
    if (!targetAnn) return;

    const previousColor = targetAnn.colorCode;

    // Live optimistic update for rendered transcript and active popover
    setCommentsState((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, colorCode: newColorCode } : a))
    );

    if (activePopover?.annotation?.id === annotationId) {
      setActivePopover((prev) =>
        prev && prev.annotation
          ? { ...prev, annotation: { ...prev.annotation, colorCode: newColorCode } }
          : prev
      );
    }

    try {
      await api.updateAnnotation(meeting.id, annotationId, { colorCode: newColorCode });
      onAnnotationUpdated?.();
    } catch (err) {
      console.error('Failed to update annotation color:', err);
      // Revert to previous color on failure
      setCommentsState((prev) =>
        prev.map((a) => (a.id === annotationId ? { ...a, colorCode: previousColor } : a))
      );
      if (activePopover?.annotation?.id === annotationId) {
        setActivePopover((prev) =>
          prev && prev.annotation
            ? { ...prev, annotation: { ...prev.annotation, colorCode: previousColor } }
            : prev
        );
      }
    }
  };

  // Update existing annotation comment text in place
  const handleUpdateAnnotationComment = async (annotationId: string, newCommentText: string) => {
    if (!meeting) return;

    const targetAnn = commentsState.find((a) => a.id === annotationId);
    if (!targetAnn) return;

    const previousCommentText = targetAnn.commentText || '';

    // Live optimistic update for rendered transcript and active popover
    setCommentsState((prev) =>
      prev.map((a) =>
        a.id === annotationId
          ? { ...a, commentText: newCommentText, annotationType: newCommentText ? 'comment' : 'highlight' }
          : a
      )
    );

    if (activePopover?.annotation?.id === annotationId) {
      setActivePopover((prev) =>
        prev && prev.annotation
          ? {
              ...prev,
              annotation: {
                ...prev.annotation,
                commentText: newCommentText,
                annotationType: newCommentText ? 'comment' : 'highlight',
              },
            }
          : prev
      );
    }

    try {
      await api.updateAnnotation(meeting.id, annotationId, { commentText: newCommentText });
      onAnnotationUpdated?.();
    } catch (err) {
      console.error('Failed to update annotation comment:', err);
      // Revert to previous comment text on failure
      setCommentsState((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? { ...a, commentText: previousCommentText, annotationType: previousCommentText ? 'comment' : 'highlight' }
            : a
        )
      );
      if (activePopover?.annotation?.id === annotationId) {
        setActivePopover((prev) =>
          prev && prev.annotation
            ? {
                ...prev,
                annotation: {
                  ...prev.annotation,
                  commentText: previousCommentText,
                  annotationType: previousCommentText ? 'comment' : 'highlight',
                },
              }
            : prev
        );
      }
    }
  };

  // Delete annotation
  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!meeting) return;
    try {
      await api.deleteAnnotation(meeting.id, annotationId);
      setCommentsState((prev) => prev.filter((a) => a.id !== annotationId));
      setActivePopover(null);
      onAnnotationUpdated?.();
    } catch (err) {
      console.error('Failed to delete annotation:', err);
    }
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.controlsBar}>
        {showHint && (
          <div className={styles.hintBanner}>
            <div className={styles.hintContent}>
              <Highlighter size={13} className={styles.hintIcon} />
              <span>Select any text to highlight it or add a comment.</span>
            </div>
            <button
              type="button"
              className={styles.dismissBtn}
              onClick={handleDismissHint}
              title="Dismiss hint"
              aria-label="Dismiss transcript highlight instructions"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className={styles.searchAndFilterRow}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {speakers.length > 0 && (
            <select
              className={styles.speakerSelect}
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              title="Filter by speaker"
            >
              <option value="all">All Speakers ({speakers.length})</option>
              {speakers.map((spk) => (
                <option key={spk} value={spk}>
                  {spk}
                </option>
              ))}
            </select>
          )}
        </div>

        {searchQuery.trim() && (
          <div className={styles.matchInfo}>
            <span>
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} found for &quot;{searchQuery}&quot;
            </span>
          </div>
        )}
      </div>

      <div className={styles.segmentList}>
        {filteredSegments.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery || selectedSpeaker !== 'all'
              ? 'No transcript segments match your search or filter.'
              : 'No transcript segments available for this meeting.'}
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isAudioActive = isPlaying || currentTime > 0;
            const isActive =
              isAudioActive &&
              currentTime >= segment.startTime &&
              currentTime < segment.endTime;
            const segmentAnnotations = commentsState.filter(
              (c) => c.segmentId === segment.id
            );

            return (
              <TranscriptSegmentItem
                key={segment.id}
                segment={segment}
                isActive={isActive}
                searchQuery={searchQuery}
                annotations={segmentAnnotations}
                onSeek={onSeek}
                onTextSelected={handleTextSelected}
                onViewAnnotation={handleViewAnnotation}
              />
            );
          })
        )}
      </div>

      {/* Floating Toolbar when text is selected */}
      {selection && !activePopover && (
        <AnnotationToolbar
          position={selection.position}
          onHighlight={handleHighlight}
          onOpenCommentForm={handleOpenCommentForm}
          onClose={() => setSelection(null)}
        />
      )}

      {/* Comment Popover (Create or View mode) */}
      {activePopover && (
        <CommentPopover
          mode={activePopover.mode}
          position={activePopover.position}
          selectedText={selection?.selectedText}
          annotation={activePopover.annotation}
          colorCode={activePopover.colorCode}
          onSaveComment={handleSaveComment}
          onUpdateColor={handleUpdateAnnotationColor}
          onUpdateComment={handleUpdateAnnotationComment}
          onDeleteAnnotation={handleDeleteAnnotation}
          onClose={() => {
            setActivePopover(null);
            setSelection(null);
          }}
        />
      )}
    </div>
  );
};
