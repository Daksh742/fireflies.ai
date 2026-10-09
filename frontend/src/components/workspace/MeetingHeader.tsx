'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { MeetingDetail } from '@/types/meeting';
import { AvatarGroup } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import { ExportMenu } from '@/components/workspace/ExportMenu';
import styles from './MeetingHeader.module.css';

interface MeetingHeaderProps {
  meeting: MeetingDetail;
  onMeetingUpdated?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  meeting,
  onMeetingUpdated,
}) => {
  const router = useRouter();
  const { notifySuccess, notifyError } = useNotifications();

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editParticipants, setEditParticipants] = useState(
    (meeting.participants || []).map((p) => p.name).join(', ')
  );
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }

    try {
      setSavingEdit(true);
      setEditError(null);

      const participants = editParticipants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await api.updateMeeting(meeting.id, {
        title: editTitle.trim(),
        participants,
      });

      notifySuccess('Meeting updated', editTitle.trim(), 'meeting_updated');

      setIsEditOpen(false);
      if (onMeetingUpdated) {
        onMeetingUpdated();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      notifyError('Couldn\'t update meeting. Please try again.');
      setEditError(err.message || 'Failed to update meeting metadata');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMeeting = async () => {
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.deleteMeeting(meeting.id);
      notifySuccess('Meeting deleted', meeting.title, 'meeting_deleted');
      setIsDeleteOpen(false);
      router.push('/meetings');
    } catch (err: any) {
      notifyError('Couldn\'t delete meeting. Please try again.');
      setDeleteError(err.message || 'Failed to delete meeting');
      setDeleting(false);
    }
  };

  return (
    <>
      <header className={styles.headerContainer}>
        <div className={styles.topRow}>
          <Link href="/meetings" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to Meetings</span>
          </Link>

          <div className={styles.actionsGroup}>
            <ExportMenu meeting={meeting} />

            <button
              onClick={() => {
                setEditTitle(meeting.title);
                setEditParticipants(
                  (meeting.participants || []).map((p) => p.name).join(', ')
                );
                setIsEditOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title="Edit Title & Participants"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.6rem',
                fontSize: '0.78rem',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger-text, #ef4444)',
                cursor: 'pointer',
              }}
              title="Delete Meeting"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{meeting.title}</h1>
            <span className={styles.durationBadge}>
              <Clock size={12} />
              <span>{formatDuration(meeting.durationSeconds)}</span>
            </span>
          </div>

          <div className={styles.metaStrip}>
            <div className={styles.metaItem}>
              <Calendar size={13} />
              <span>{formatDate(meeting.date)}</span>
            </div>
            <span>•</span>
            <div className={styles.metaItem}>
              <AvatarGroup participants={meeting.participants || []} max={4} />
            </div>
          </div>
        </div>
      </header>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Meeting Details"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {editError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              {editError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Meeting Title *
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Participants (comma-separated)
            </label>
            <Input
              value={editParticipants}
              onChange={(e) => setEditParticipants(e.target.value)}
              placeholder="e.g. Alex Rivers, Sarah Chen"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Meeting Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Meeting Confirmation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteMeeting}
              disabled={deleting}
              style={{ backgroundColor: 'var(--danger-text, #ef4444)', borderColor: 'var(--danger-text, #ef4444)' }}
            >
              {deleting ? 'Deleting...' : 'Delete Meeting'}
            </Button>
          </>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          {deleteError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {deleteError}
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Are you sure you want to delete <strong>&quot;{meeting.title}&quot;</strong>?
          </p>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            This action cannot be undone. All associated transcript segments, AI summaries, action items, and outline topics will be permanently removed from SQLite.
          </p>
        </div>
      </Modal>
    </>
  );
};
