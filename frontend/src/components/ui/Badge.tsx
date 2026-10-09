import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  variant?: 'brand' | 'slate' | 'success' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  className = '',
}) => {
  const combinedClassName = [
    styles.badge,
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  return <span className={combinedClassName}>{children}</span>;
};
