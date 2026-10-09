'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();
  
  // Safe SSR default until mounted
  const isDark = mounted ? theme === 'dark' : true;

  return (
    <button
      className={styles.toggleContainer}
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      suppressHydrationWarning
    >
      {/* Sliding indicator pill */}
      <div
        className={`${styles.indicator} ${
          isDark ? styles.indicatorDark : styles.indicatorLight
        }`}
      />

      {/* Moon icon slot */}
      <div className={`${styles.iconSlot} ${isDark ? styles.activeIcon : ''}`}>
        <div className={styles.moonIcon}>
          <Moon size={13} />
        </div>
      </div>

      {/* Sun icon slot */}
      <div className={`${styles.iconSlot} ${!isDark ? styles.activeIcon : ''}`}>
        <div className={styles.sunIcon}>
          <Sun size={13} />
        </div>
      </div>
    </button>
  );
};
