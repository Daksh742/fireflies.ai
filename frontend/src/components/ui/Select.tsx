import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ options, className = '', onChange, value, ...props }) => {
  const hasValue = Boolean(value && value !== '');

  return (
    <div className={styles.selectWrapper}>
      <select
        className={`${styles.select} ${hasValue ? styles.hasValue : ''} ${className}`}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          e.currentTarget.blur();
        }}
        onMouseLeave={(e) => e.currentTarget.blur()}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className={styles.chevron}>
        <ChevronDown size={14} />
      </div>
    </div>
  );
};
