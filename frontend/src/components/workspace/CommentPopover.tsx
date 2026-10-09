'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, MessageSquarePlus, Edit3, Check } from 'lucide-react';
import { CommentHighlight } from '@/types/meeting';
import { Avatar } from '@/components/ui/Avatar';
import styles from './CommentPopover.module.css';

export const HIGHLIGHT_PALETTE = [
  { id: 'yellow', name: 'Yellow', code: '#F59E0B' },
  { id: 'blue', name: 'Blue', code: '#3B82F6' },
  { id: 'green', name: 'Green', code: '#10B981' },
  { id: 'pink', name: 'Pink', code: '#EC4899' },
];

interface CommentPopoverProps {
  mode: 'create' | 'view';
  position: { top: number; left: number };
  selectedText?: string;
  annotation?: CommentHighlight;
  colorCode?: string;
  onSaveComment?: (text: string) => void;
  onUpdateColor?: (annotationId: string, colorCode: string) => void;
  onUpdateComment?: (annotationId: string, commentText: string) => Promise<void> | void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onClose: () => void;
}

export const CommentPopover: React.FC<CommentPopoverProps> = ({
  mode,
  position,
  selectedText,
  annotation,
  colorCode = '#F59E0B',
  onSaveComment,
  onUpdateColor,
  onUpdateComment,
  onDeleteAnnotation,
  onClose,
}) => {
  const [commentText, setCommentText] = useState<string>('');
  const [isEditingComment, setIsEditingComment] = useState<boolean>(false);
  const [editingText, setEditingText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when in create mode or edit mode
  useEffect(() => {
    if (mode === 'create' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (isEditingComment && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [isEditingComment]);

  // Handle click outside to close
  useEffect(() => {
    const handleMouseDownOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDownOutside);
    return () => {
      document.removeEventListener('mousedown', handleMouseDownOutside);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onSaveComment) return;
    setIsSubmitting(true);
    onSaveComment(commentText.trim());
  };

  const handleUpdateCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annotation || !onUpdateComment) return;
    try {
      setIsSubmitting(true);
      await onUpdateComment(annotation.id, editingText.trim());
      setIsEditingComment(false);
    } catch (err) {
      console.error('Failed to save updated comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const currentColor = annotation?.colorCode || colorCode;

  return (
    <div
      ref={popoverRef}
      className={styles.popover}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.header}>
        <div className={styles.authorMeta}>
          <Avatar name={annotation?.authorName || 'Daksh Sachdeva'} size="sm" />
          <span className={styles.authorName}>
            {annotation?.authorName || 'Daksh Sachdeva'}
          </span>
          {mode === 'view' && (
            <span className={styles.timestamp}>
              {formattedDate(annotation?.createdAt)}
            </span>
          )}
        </div>

        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          title="Close popover"
        >
          <X size={14} />
        </button>
      </div>

      {(selectedText || annotation?.selectedText) && (
        <div
          className={styles.quotedText}
          style={{ borderLeftColor: currentColor }}
        >
          &ldquo;{annotation?.selectedText || selectedText}&rdquo;
        </div>
      )}

      {mode === 'create' ? (
        <form onSubmit={handleSubmit} className={styles.formGroup}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Add a comment or note..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e);
              }
            }}
          />

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          {/* Change Color Swatches */}
          {annotation && onUpdateColor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#a1a1aa', fontWeight: 500 }}>Color:</span>
              <div role="radiogroup" aria-label="Edit highlight color" style={{ display: 'flex', gap: 6 }}>
                {HIGHLIGHT_PALETTE.map((c) => {
                  const isSelected = currentColor.toLowerCase() === c.code.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Change highlight color to ${c.name}`}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: c.code,
                        border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                        boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none',
                        cursor: 'pointer',
                        padding: 0,
                        outline: 'none',
                      }}
                      title={`Change color to ${c.name}`}
                      onClick={() => onUpdateColor(annotation.id, c.code)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment Body or Inline Editor */}
          {isEditingComment ? (
            <form onSubmit={handleUpdateCommentSubmit} className={styles.formGroup} style={{ marginBottom: 10 }}>
              <textarea
                ref={editTextareaRef}
                className={styles.textarea}
                placeholder="Enter comment text..."
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleUpdateCommentSubmit(e);
                  }
                }}
              />
              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEditingComment(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Comment'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {annotation?.commentText ? (
                <div className={styles.commentBody}>{annotation.commentText}</div>
              ) : (
                <div className={styles.commentBody} style={{ color: '#71717a', fontStyle: 'italic' }}>
                  Highlighted text annotation
                </div>
              )}

              <div className={styles.actionsRow} style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {onUpdateComment && annotation && (
                    <button
                      type="button"
                      className={styles.editCommentBtn}
                      onClick={() => {
                        setEditingText(annotation.commentText || '');
                        setIsEditingComment(true);
                      }}
                      title={annotation.commentText ? 'Edit comment' : 'Add comment to highlight'}
                    >
                      {annotation.commentText ? <Edit3 size={12} /> : <MessageSquarePlus size={12} />}
                      <span>{annotation.commentText ? 'Edit Comment' : 'Add Comment'}</span>
                    </button>
                  )}

                  {onDeleteAnnotation && annotation && (
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => onDeleteAnnotation(annotation.id)}
                      title="Remove annotation"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
