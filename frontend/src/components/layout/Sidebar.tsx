import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Radio, Sliders, Users, Sparkles, FolderSync } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>Workspace</div>
        <Link href="/meetings" className={`${styles.navItem} ${styles.active}`}>
          <LayoutDashboard size={18} />
          <span>Meetings Library</span>
        </Link>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionTitle}>Integrations & Bot</div>
        <div className={styles.navItem}>
          <Radio size={18} />
          <span>Auto-Join Bot</span>
          <span className={styles.placeholderBadge}>Soon</span>
        </div>
        <div className={styles.navItem}>
          <FolderSync size={18} />
          <span>Integrations</span>
          <span className={styles.placeholderBadge}>Soon</span>
        </div>
        <div className={styles.navItem}>
          <Users size={18} />
          <span>Team Workspace</span>
          <span className={styles.placeholderBadge}>Soon</span>
        </div>
        <div className={styles.navItem}>
          <Sliders size={18} />
          <span>Settings</span>
          <span className={styles.placeholderBadge}>Soon</span>
        </div>
      </div>

      <div className={styles.statsBox}>
        <div className={styles.statsTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Sparkles size={14} />
          <span>Fireflies Intelligence</span>
        </div>
        <div className={styles.statsText}>
          Real-time audio sync, interactive transcripts & persistent task management active.
        </div>
      </div>
    </aside>
  );
};
