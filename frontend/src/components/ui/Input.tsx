import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  icon,
  wrapperClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.inputWrapper} ${wrapperClassName}`}>
      {icon && <div className={styles.inputIcon}>{icon}</div>}
      <input className={`${styles.input} ${className}`} {...props} />
    </div>
  );
};
