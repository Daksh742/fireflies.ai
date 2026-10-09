'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Bell, Settings, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationPopover } from '@/components/notifications/NotificationPopover';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { useNotifications } from '@/context/NotificationContext';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [shortcutText, setShortcutText] = useState('⌘ K');
  const [isMac, setIsMac] = useState(true);

  const { unreadCount, markAllAsRead } = useNotifications();
  const popoverRef = useRef<HTMLDivElement>(null);

  // OS Platform Detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userAgent = navigator.userAgent || '';
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
    const mac = /mac/i.test(platform) || /mac/i.test(userAgent);
    setIsMac(mac);
    setShortcutText(mac ? '⌘ K' : 'Ctrl K');
  }, []);

  // Global Cmd+K (Mac) / Ctrl+K (Win/Linux) listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTargetShortcut = isMac ? e.metaKey : e.ctrlKey;
      if (isTargetShortcut && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMac]);

  const handleTogglePopover = () => {
    if (!isPopoverOpen) {
      markAllAsRead();
    }
    setIsPopoverOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.leftSection}>
          <Link href="/meetings" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.brandLogo}>
              <div className={styles.logoIcon}>
                <Flame size={18} />
              </div>
              <span>Fireflies.ai</span>
            </div>
          </Link>

          {/* Global Search Trigger Bar */}
          <button
            type="button"
            className={styles.searchBar}
            onClick={() => setIsSearchOpen(true)}
            title={`Global Search (${shortcutText})`}
          >
            <Search size={14} />
            <span>Search meetings, transcripts...</span>
            <span className={styles.shortcut}>{shortcutText}</span>
          </button>
        </div>

        <div className={styles.rightSection}>
          {/* Refined Sliding Theme Toggle */}
          <ThemeToggle />

          {/* Settings Visual Placeholder */}
          <div className={styles.iconBtn} aria-hidden="true" title="Settings (Placeholder)">
            <Settings size={18} />
          </div>

          <div className={styles.notifWrapper} ref={popoverRef}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
              onClick={handleTogglePopover}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isPopoverOpen && <NotificationPopover />}
          </div>

          <div className={styles.userProfile} onClick={() => setIsProfileModalOpen(true)}>
            <Avatar name="Daksh Sachdeva" size="md" />
            <div className={styles.userInfo}>
              <span className={styles.userName}>Daksh Sachdeva</span>
              <span className={styles.userRole}>Product Lead</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* User Profile Placeholder Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="User Profile (Placeholder)"
        footer={
          <Button variant="secondary" onClick={() => setIsProfileModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
          <Avatar name="Daksh Sachdeva" size="xl" />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Daksh Sachdeva</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>daksh.sachdeva630@gmail.com • Product Lead</p>
          </div>
          <Badge variant="brand">Default Active User Context</Badge>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
            Multi-tenant authentication and user profile management are mocked according to assignment scope rules.
          </p>
        </div>
      </Modal>
    </>
  );
};
