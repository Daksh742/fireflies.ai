import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  onClick,
}) => {
  const combinedClassName = [
    styles.card,
    hoverable ? styles.hoverable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.cardHeader} ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`${styles.cardTitle} ${className}`}>{children}</h3>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.cardBody} ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.cardFooter} ${className}`}>{children}</div>
);
