'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import styles from './ToastContainer.module.css';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast} role="status">
          <div className={styles.iconSlot}>
            {toast.variant === 'success' && (
              <CheckCircle2 size={16} className={styles.successIcon} />
            )}
            {toast.variant === 'error' && (
              <AlertCircle size={16} className={styles.errorIcon} />
            )}
            {toast.variant === 'info' && (
              <Info size={16} className={styles.infoIcon} />
            )}
          </div>

          <div className={styles.content}>
            <div className={styles.title}>{toast.title}</div>
            {toast.description && (
              <div className={styles.description}>{toast.description}</div>
            )}
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
