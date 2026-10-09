import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CreateMeetingPayload } from '@/types/meeting';
import styles from './NewMeetingModal.module.css';

export interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateMeetingPayload) => Promise<void>;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [participantsText, setParticipantsText] = useState('Alex Rivers, Sarah Chen');
  const [transcriptText, setTranscriptText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const participants = participantsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      await onSubmit({
        title: title.trim(),
        participants,
        rawTranscriptText: transcriptText.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setTranscriptText('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create / Import Meeting"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Generating Notes...' : 'Import & Transcribe'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Meeting Title *</label>
          <Input
            placeholder="e.g. Q4 Strategy & Roadmap Alignment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Participants (comma-separated)</label>
          <Input
            placeholder="e.g. Alex Rivers, Sarah Chen, Marcus Vance"
            value={participantsText}
            onChange={(e) => setParticipantsText(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Paste Transcript Text</label>
          <textarea
            className={styles.textarea}
            placeholder="Paste raw conversation lines or VTT format here..."
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
          />
          <span className={styles.helpText}>
            Our engine will automatically split transcript lines into speaker segments with timestamps.
          </span>
        </div>
      </form>
    </Modal>
  );
};
