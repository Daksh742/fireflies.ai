import React from 'react';
import { SearchX } from 'lucide-react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <SearchX size={24} />,
  title,
  description,
  action,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconBox}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
