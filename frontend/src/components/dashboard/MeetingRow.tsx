import React from 'react';
import Link from 'next/link';
import { Video, MoreHorizontal } from 'lucide-react';
import { Meeting } from '@/types/meeting';
import { AvatarGroup } from '@/components/ui/Avatar';
import styles from './MeetingRow.module.css';

export interface MeetingRowProps {
  meeting: Meeting;
}

export const MeetingRow: React.FC<MeetingRowProps> = ({ meeting }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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
    <Link href={`/meetings/${meeting.id}`} className={styles.row}>
      <div className={styles.leftSection}>
        <div className={styles.videoIcon}>
          <Video size={16} />
        </div>

        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{meeting.title}</h3>
          <div className={styles.subMeta}>
            <span>{formatDate(meeting.date)}</span>
            <span>•</span>
            <span>{formatDuration(meeting.durationSeconds)}</span>
            <span>•</span>
            <span>{meeting.segmentsCount || 0} transcript segments</span>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <AvatarGroup participants={meeting.participants || []} max={3} />

        {/* Contextual ⋯ Action Menu button visible on hover */}
        <button
          className={styles.contextBtn}
          title="Meeting Actions"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </Link>
  );
};
