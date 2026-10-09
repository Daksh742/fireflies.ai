'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NotificationItem, NotificationType, ToastMessage, ToastVariant } from '@/types/notification';

interface NotificationContextType {
  notifications: NotificationItem[];
  toasts: ToastMessage[];
  unreadCount: number;
  notifySuccess: (title: string, description?: string, type?: NotificationType) => void;
  notifyError: (title: string, description?: string) => void;
  notifyToastOnly: (title: string, description?: string, variant?: ToastVariant) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAllAsRead: () => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'fireflies_notification_history';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  // Safe SSR / Hydration load from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load notifications from localStorage:', e);
    }
  }, []);

  // Sync to localStorage whenever notifications change after client mount
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications to localStorage:', e);
    }
  }, [notifications, mounted]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, description?: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastMessage = { id, title, description, variant };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const notifySuccess = useCallback(
    (title: string, description?: string, type: NotificationType = 'changes_saved') => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newNotif: NotificationItem = {
        id,
        type,
        title,
        description,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      addToast(title, description, 'success');
    },
    [addToast]
  );

  const notifyError = useCallback(
    (title: string, description?: string) => {
      addToast(title, description, 'error');
    },
    [addToast]
  );

  const notifyToastOnly = useCallback(
    (title: string, description?: string, variant: ToastVariant = 'info') => {
      addToast(title, description, variant);
    },
    [addToast]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      if (!prev.some((n) => !n.read)) return prev;
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        notifySuccess,
        notifyError,
        notifyToastOnly,
        removeNotification,
        clearAllNotifications,
        markAllAsRead,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
