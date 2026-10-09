'use client';

import React, { useEffect, useState } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { MeetingHeader } from '@/components/workspace/MeetingHeader';
import { TranscriptPanel } from '@/components/workspace/TranscriptPanel';
import { SmartNotesPanel } from '@/components/workspace/SmartNotesPanel';
import { MediaPlayerBar } from '@/components/workspace/MediaPlayerBar';
import { LoadingGrid } from '@/components/ui/LoadingState';
import { Button } from '@/components/ui/Button';
import { MeetingDetail } from '@/types/meeting';
import { api } from '@/lib/api';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from './workspace.module.css';

export default function MeetingWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const meetingId = params?.id as string;
  const timeParam = searchParams.get('time');

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFoundState, setNotFoundState] = useState<boolean>(false);

  // Fetch meeting detail from FastAPI backend
  useEffect(() => {
    if (!meetingId) return;

    let isMounted = true;

    async function loadMeeting() {
      try {
        setLoading(true);
        setError(null);
        setNotFoundState(false);

        const data = await api.getMeetingById(meetingId);
        if (isMounted) {
          setMeeting(data);
        }
      } catch (err: any) {
        if (isMounted) {
          if (err?.status === 404) {
            setNotFoundState(true);
          } else {
            setError(err?.message || 'Failed to load meeting details.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMeeting();

    return () => {
      isMounted = false;
    };
  }, [meetingId]);

  // Audio URL resolution
  const audioSrc = meeting?.audioUrl
    ? meeting.audioUrl.startsWith('http') || meeting.audioUrl.startsWith('/')
      ? meeting.audioUrl
      : `http://127.0.0.1:8000/static/audio/${meeting.audioUrl}`
    : '/audio/sample_meeting_1.wav';

  const audioPlayer = useAudioPlayer(audioSrc, meeting?.durationSeconds);

  // Auto-seek audio player when deep-linked with time parameter
  useEffect(() => {
    if (meeting && timeParam) {
      const targetTime = parseFloat(timeParam);
      if (!isNaN(targetTime) && targetTime >= 0) {
        audioPlayer.seekTo(targetTime);
      }
    }
  }, [meeting, timeParam]);

  if (notFoundState) {
    notFound();
  }

  return (
    <div className={styles.workspaceWrapper}>
      {loading ? (
        <div className={styles.loadingContainer}>
          <LoadingGrid count={3} />
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <AlertCircle size={32} color="var(--danger-text, #ef4444)" />
          <h2 className={styles.errorTitle}>Error Loading Meeting</h2>
          <p className={styles.errorText}>{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              api.getMeetingById(meetingId).then(setMeeting).catch((e) => setError(e.message)).finally(() => setLoading(false));
            }}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </Button>
        </div>
      ) : meeting ? (
        <>
          <MeetingHeader
            meeting={meeting}
            onMeetingUpdated={() => api.getMeetingById(meetingId).then(setMeeting)}
          />

          <div className={styles.workspaceMain}>
            {/* Left Column: Smart Notes (Summary, Tasks, Chapters) */}
            <SmartNotesPanel
              meeting={meeting}
              onSeek={audioPlayer.seekTo}
            />

            {/* Right Column: Editorial Transcript Panel */}
            <TranscriptPanel
              meeting={meeting}
              segments={meeting.segments || []}
              currentTime={audioPlayer.currentTime}
              isPlaying={audioPlayer.isPlaying}
              onSeek={audioPlayer.seekTo}
              onAnnotationUpdated={() => api.getMeetingById(meetingId).then(setMeeting)}
            />
          </div>

          {/* Bottom Dock: Integrated Audio Player Bar */}
          <MediaPlayerBar player={audioPlayer} />
        </>
      ) : null}
    </div>
  );
}
