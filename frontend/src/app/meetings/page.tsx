'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StatsBanner } from '@/components/dashboard/StatsBanner';
import { MeetingFilterBar } from '@/components/dashboard/MeetingFilterBar';
import { MeetingCard } from '@/components/dashboard/MeetingCard';
import { MeetingRow } from '@/components/dashboard/MeetingRow';
import { NewMeetingModal } from '@/components/dashboard/NewMeetingModal';
import { LoadingGrid } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Meeting, CreateMeetingPayload } from '@/types/meeting';
import { api } from '@/lib/api';
import { RefreshCw, Video } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import styles from './page.module.css';

export default function MeetingsPage() {
  const { notifySuccess, notifyError } = useNotifications();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter, Sort & View Mode State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>('grid'); // Safe SSR default
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Load persisted viewMode safely after client mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedView = localStorage.getItem('fireflies_view_mode') as 'grid' | 'list' | null;
      if (savedView === 'list' || savedView === 'grid') {
        setViewModeState(savedView);
      }
    } catch {}
  }, []);

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode);
    try {
      localStorage.setItem('fireflies_view_mode', mode);
    } catch {}
  };

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMeetings({
        query: searchQuery || undefined,
        participant: selectedParticipant || undefined,
        dateRange: selectedDateRange || undefined,
        sortBy: sortBy as any,
      });
      setMeetings(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load meetings library');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedParticipant, selectedDateRange, sortBy]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Safe Array Reference
  const safeMeetings = useMemo(() => (Array.isArray(meetings) ? meetings : []), [meetings]);

  // Aggregate Stats
  const totalDurationSeconds = useMemo(() => {
    return safeMeetings.reduce((acc, m) => acc + (m?.durationSeconds || 0), 0);
  }, [safeMeetings]);

  const pendingActionItemsCount = useMemo(() => {
    return safeMeetings.reduce((acc, m) => acc + (m?.pendingActionItemsCount || 0), 0);
  }, [safeMeetings]);

  // Extract unique participants list across loaded meetings
  const participantsList = useMemo(() => {
    const set = new Set<string>();
    safeMeetings.forEach((m) => {
      (m?.participants || []).forEach((p) => {
        if (p?.name) set.add(p.name);
      });
    });
    return Array.from(set);
  }, [safeMeetings]);

  const handleCreateMeeting = async (payload: CreateMeetingPayload) => {
    try {
      await api.createMeeting(payload);
      notifySuccess('Meeting created', payload.title, 'meeting_created');
      await fetchMeetings();
    } catch (err: any) {
      notifyError('Couldn\'t create meeting. Please try again.');
      throw err;
    }
  };

  // Determine active layout mode safely
  const activeViewMode = mounted ? viewMode : 'grid';

  return (
    <div className={styles.pageContainer}>
      {/* Workspace Title Header */}
        <div className={styles.headerBanner}>
          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>Meetings Library</h1>
            <p className={styles.pageSubtitle}>
              Browse recorded meetings, interactive transcripts, and AI notes.
            </p>
          </div>
        </div>

        {/* Quiet Workspace Metadata Strip */}
        <StatsBanner
          totalMeetings={total}
          totalDurationSeconds={totalDurationSeconds}
          pendingActionItems={pendingActionItemsCount}
        />

        {/* Filter & View Switcher Bar */}
        <MeetingFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedParticipant={selectedParticipant}
          onParticipantChange={setSelectedParticipant}
          selectedDateRange={selectedDateRange}
          onDateRangeChange={setSelectedDateRange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={activeViewMode}
          onViewModeChange={setViewMode}
          onNewMeetingClick={() => setIsModalOpen(true)}
          participantsList={participantsList}
        />

        {/* Content Section */}
        {loading ? (
          <LoadingGrid count={6} />
        ) : error ? (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <Button variant="secondary" onClick={fetchMeetings}>
              <RefreshCw size={14} />
              <span>Retry Request</span>
            </Button>
          </div>
        ) : safeMeetings.length === 0 ? (
          <EmptyState
            icon={<Video size={24} />}
            title="No meetings found"
            description={
              searchQuery || selectedParticipant || selectedDateRange
                ? "No recordings match your current filters."
                : "You don't have any meeting transcripts yet."
            }
            action={
              searchQuery || selectedParticipant || selectedDateRange ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedParticipant('');
                    setSelectedDateRange('');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Create / Import Meeting
                </Button>
              )
            }
          />
        ) : activeViewMode === 'list' ? (
          <div className={styles.listContainer}>
            {safeMeetings.map((meeting) => (
              <MeetingRow key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {safeMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}

        {/* Create / Import Meeting Modal */}
        <NewMeetingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateMeeting}
        />
      </div>
  );
}
