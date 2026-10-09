import React from 'react';
import Link from 'next/link';
import { Calendar, Clock, FileText, CheckSquare, MoreHorizontal } from 'lucide-react';
import { Meeting } from '@/types/meeting';
import { AvatarGroup } from '@/components/ui/Avatar';
import styles from './MeetingCard.module.css';

export interface MeetingCardProps {
  meeting: Meeting;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <Link href={`/meetings/${meeting.id}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{meeting.title}</h3>
          <div className={styles.subMeta}>
            <Calendar size={12} />
            <span>{formatDate(meeting.date)}</span>
          </div>
        </div>

        <span className={styles.durationBadge}>
          <Clock size={12} />
          {formatDuration(meeting.durationSeconds)}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <AvatarGroup participants={meeting.participants || []} max={3} />

        <div className={styles.metaCounts}>
          <div className={styles.metaItem} title="Transcript Segments">
            <FileText size={13} />
            <span>{meeting.segmentsCount || 0}</span>
          </div>

          <div className={styles.metaItem} title="Action Items">
            <CheckSquare size={13} />
            <span>{meeting.actionItemsCount || 0}</span>
          </div>

          <button
            className={styles.contextBtn}
            title="Meeting Actions"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>
    </Link>
  );
};
