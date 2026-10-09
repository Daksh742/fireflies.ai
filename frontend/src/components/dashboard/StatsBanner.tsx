import React from 'react';
import { Video, Clock, CheckSquare } from 'lucide-react';
import styles from './StatsBanner.module.css';

export interface StatsBannerProps {
  totalMeetings: number;
  totalDurationSeconds: number;
  pendingActionItems: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  totalMeetings,
  totalDurationSeconds,
  pendingActionItems,
}) => {
  const formatDurationHours = (seconds: number) => {
    if (seconds <= 0) return '0m';
    const hours = (seconds / 3600).toFixed(1);
    return `${hours}h`;
  };

  return (
    <div className={styles.strip}>
      <div className={styles.statItem}>
        <Video size={14} style={{ color: 'var(--text-muted)' }} />
        <span>Meetings: <strong className={styles.statValue}>{totalMeetings}</strong></span>
      </div>

      <div className={styles.divider} />

      <div className={styles.statItem}>
        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
        <span>Audio Transcribed: <strong className={styles.statValue}>{formatDurationHours(totalDurationSeconds)}</strong></span>
      </div>

      <div className={styles.divider} />

      <div className={styles.statItem}>
        <CheckSquare size={14} style={{ color: 'var(--text-muted)' }} />
        <span>Pending Tasks: <strong className={styles.statValue}>{pendingActionItems}</strong></span>
      </div>
    </div>
  );
};
