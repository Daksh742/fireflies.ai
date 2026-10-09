import React from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
  const getInitials = (str: string) => {
    const cleanStr = str.trim();
    if (!cleanStr) return '??';
    const parts = cleanStr.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return cleanStr.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export const AvatarGroup: React.FC<{ participants: { name: string }[]; max?: number }> = ({
  participants,
  max = 3,
}) => {
  const visible = participants.slice(0, max);
  const remaining = participants.length - max;

  return (
    <div className={styles.avatarGroup}>
      {visible.map((p, idx) => (
        <Avatar key={idx} name={p.name} size="sm" />
      ))}
      {remaining > 0 && <span className={styles.moreCount}>+{remaining}</span>}
    </div>
  );
};
