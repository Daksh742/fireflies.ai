'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MeetingDetail } from '@/types/meeting';
import { SummaryTab } from './SummaryTab';
import { ActionItemsTab } from './ActionItemsTab';
import { ChaptersTab } from './ChaptersTab';
import { AskAiTab } from './AskAiTab';
import styles from './SmartNotesPanel.module.css';

interface SmartNotesPanelProps {
  meeting: MeetingDetail;
  onSeek: (seconds: number) => void;
}

export const SmartNotesPanel: React.FC<SmartNotesPanelProps> = ({
  meeting,
  onSeek,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'chapters' | 'ask'>('summary');

  const actionItemsCount = meeting.actionItems ? meeting.actionItems.length : 0;
  const chaptersCount = meeting.chapters ? meeting.chapters.length : 0;

  return (
    <div className={styles.panelContainer}>
      <div className={styles.tabHeader}>
        <button
          className={`${styles.tabBtn} ${
            activeTab === 'summary' ? styles.activeTab : ''
          }`}
          onClick={() => setActiveTab('summary')}
        >
          <span>Summary</span>
        </button>

        <button
          className={`${styles.tabBtn} ${
            activeTab === 'actions' ? styles.activeTab : ''
          }`}
          onClick={() => setActiveTab('actions')}
        >
          <span>Action Items</span>
          {actionItemsCount > 0 && (
            <span className={styles.badgeCount}>{actionItemsCount}</span>
          )}
        </button>

        <button
          className={`${styles.tabBtn} ${
            activeTab === 'chapters' ? styles.activeTab : ''
          }`}
          onClick={() => setActiveTab('chapters')}
        >
          <span>Chapters</span>
          {chaptersCount > 0 && (
            <span className={styles.badgeCount}>{chaptersCount}</span>
          )}
        </button>

        <button
          className={`${styles.tabBtn} ${
            activeTab === 'ask' ? styles.activeTab : ''
          }`}
          onClick={() => setActiveTab('ask')}
        >
          <Sparkles size={13} />
          <span>Ask AI</span>
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'summary' && <SummaryTab summary={meeting.summary} />}
        {activeTab === 'actions' && (
          <ActionItemsTab
            initialActionItems={meeting.actionItems || []}
            meetingId={meeting.id}
          />
        )}
        {activeTab === 'chapters' && (
          <ChaptersTab chapters={meeting.chapters || []} onSeek={onSeek} />
        )}
        {activeTab === 'ask' && (
          <AskAiTab meeting={meeting} onSeek={onSeek} />
        )}
      </div>
    </div>
  );
};
