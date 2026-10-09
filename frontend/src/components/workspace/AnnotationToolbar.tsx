'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Highlighter, MessageSquarePlus } from 'lucide-react';
import styles from './AnnotationToolbar.module.css';

export const HIGHLIGHT_PALETTE = [
  { id: 'yellow', name: 'Yellow', code: '#F59E0B', bg: 'rgba(245, 158, 11, 0.25)' },
  { id: 'blue', name: 'Blue', code: '#3B82F6', bg: 'rgba(59, 130, 246, 0.25)' },
  { id: 'green', name: 'Green', code: '#10B981', bg: 'rgba(16, 185, 129, 0.25)' },
  { id: 'pink', name: 'Pink', code: '#EC4899', bg: 'rgba(236, 72, 153, 0.25)' },
];

interface AnnotationToolbarProps {
  position: { top: number; left: number };
  onHighlight: (color: string) => void;
  onOpenCommentForm: (color: string) => void;
  onClose: () => void;
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  position,
  onHighlight,
  onOpenCommentForm,
  onClose,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('#F59E0B');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close toolbar on click outside
  useEffect(() => {
    const handleMouseDownOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDownOutside);
    return () => {
      document.removeEventListener('mousedown', handleMouseDownOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={toolbarRef}
      className={styles.toolbar}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.colorPalette} role="radiogroup" aria-label="Highlight color selection">
        {HIGHLIGHT_PALETTE.map((c) => {
          const isSelected = selectedColor.toLowerCase() === c.code.toLowerCase();
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Highlight color ${c.name}`}
              className={`${styles.colorDot} ${isSelected ? styles.colorDotActive : ''}`}
              style={{ backgroundColor: c.code }}
              title={`Highlight color: ${c.name}`}
              onClick={() => setSelectedColor(c.code)}
            />
          );
        })}
      </div>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.actionBtn}
        onClick={() => onHighlight(selectedColor)}
        title="Highlight selected text"
      >
        <Highlighter size={13} style={{ color: selectedColor }} />
        <span>Highlight</span>
      </button>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.actionBtn}
        onClick={() => onOpenCommentForm(selectedColor)}
        title="Add comment to selected text"
      >
        <MessageSquarePlus size={13} style={{ color: '#A1A1AA' }} />
        <span>Comment</span>
      </button>
    </div>
  );
};
