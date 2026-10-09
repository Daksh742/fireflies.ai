'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import styles from './NotificationPopover.module.css';

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
}

export const NotificationPopover: React.FC = () => {
  const { notifications, clearAllNotifications, removeNotification } = useNotifications();

  return (
    <div
      className={styles.popover}
      role="region"
      aria-label="Notifications panel"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.header}>
        <span className={styles.headerTitle}>Notifications</span>
        {notifications.length > 0 && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={clearAllNotifications}
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>No notifications yet</div>
      ) : (
        <div className={styles.list}>
          {notifications.map((item) => (
            <div key={item.id} className={styles.notifItem}>
              {!item.read ? (
                <div className={styles.unreadDot} title="Unread notification" />
              ) : (
                <div className={styles.readSpacer} />
              )}

              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>{item.title}</div>
                {item.description && (
                  <div className={styles.itemDesc} title={item.description}>
                    {item.description}
                  </div>
                )}
                <div className={styles.itemTime}>{formatRelativeTime(item.timestamp)}</div>
              </div>

              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(item.id);
                }}
                aria-label={`Remove notification: ${item.title}`}
                title="Remove notification"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
