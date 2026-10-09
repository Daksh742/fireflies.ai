import React from 'react';
import styles from './LoadingState.module.css';

export const MeetingCardSkeleton: React.FC = () => {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.metaRow}>
        <div className={styles.line} style={{ width: '30%' }} />
        <div className={styles.line} style={{ width: '20%' }} />
      </div>
      <div className={styles.titleLine} />
      <div className={styles.line} style={{ width: '90%' }} />
      <div className={styles.metaRow} style={{ marginTop: '0.5rem' }}>
        <div className={styles.line} style={{ width: '40%' }} />
        <div className={styles.line} style={{ width: '25%' }} />
      </div>
    </div>
  );
};

export const LoadingGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, idx) => (
        <MeetingCardSkeleton key={idx} />
      ))}
    </div>
  );
};
