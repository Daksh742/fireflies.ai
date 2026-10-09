import React from 'react';
import { Sparkles, CheckCircle2, MessageSquareText } from 'lucide-react';
import { Summary } from '@/types/meeting';
import styles from './SmartNotesPanel.module.css';

interface SummaryTabProps {
  summary?: Summary;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ summary }) => {
  if (!summary) {
    return (
      <div className={styles.emptyTabState}>
        No AI summary available for this meeting.
      </div>
    );
  }

  return (
    <>
      {summary.overview && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <Sparkles size={16} />
            <span>Executive Overview</span>
          </h3>
          <p className={styles.overviewText}>{summary.overview}</p>
        </div>
      )}

      {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <CheckCircle2 size={16} />
            <span>Key Takeaways</span>
          </h3>
          <ul className={styles.bulletList}>
            {summary.keyTakeaways.map((item, idx) => (
              <li key={idx} className={styles.bulletItem}>
                <span className={styles.bulletIcon}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.discussionBullets && summary.discussionBullets.length > 0 && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <MessageSquareText size={16} />
            <span>Discussion Points</span>
          </h3>
          <ul className={styles.bulletList}>
            {summary.discussionBullets.map((item, idx) => (
              <li key={idx} className={styles.bulletItem}>
                <span className={styles.bulletIcon}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
