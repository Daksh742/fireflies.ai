'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { ChapterTopic } from '@/types/meeting';
import styles from './SmartNotesPanel.module.css';

interface ChaptersTabProps {
  chapters: ChapterTopic[];
  onSeek: (seconds: number) => void;
}

export const ChaptersTab: React.FC<ChaptersTabProps> = ({ chapters, onSeek }) => {
  if (!chapters || chapters.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        No outline chapters available for this meeting.
      </div>
    );
  }

  const formatTimestamp = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${padMins}:${padSecs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {chapters.map((chapter) => (
        <div key={chapter.id} className={styles.chapterCard}>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterTitle}>{chapter.title}</span>
            <button
              className={styles.chapterTimeBtn}
              onClick={() => onSeek(chapter.startTime)}
              title={`Jump to ${formatTimestamp(chapter.startTime)}`}
            >
              <Play size={10} />
              <span>{formatTimestamp(chapter.startTime)}</span>
            </button>
          </div>
          {chapter.summarySnippet && (
            <p className={styles.chapterSnippet}>{chapter.summarySnippet}</p>
          )}
        </div>
      ))}
    </div>
  );
};
