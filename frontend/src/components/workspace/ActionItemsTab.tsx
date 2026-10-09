'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { ActionItem } from '@/types/meeting';
import { api } from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';
import styles from './SmartNotesPanel.module.css';

interface ActionItemsTabProps {
  initialActionItems: ActionItem[];
  meetingId: string;
}

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({
  initialActionItems,
  meetingId,
}) => {
  const { notifySuccess, notifyError } = useNotifications();
  const [items, setItems] = useState<ActionItem[]>(initialActionItems || []);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New action item state
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);

  // Editing action item state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editAssignee, setEditAssignee] = useState('');

  const handleToggleComplete = async (item: ActionItem) => {
    const nextCompleted = !item.completed;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: nextCompleted } : i))
    );

    try {
      setUpdatingId(item.id);
      await api.updateActionItem(item.id, { completed: nextCompleted });
      if (nextCompleted) {
        notifySuccess('Action item completed', item.text, 'action_item_completed');
      } else {
        notifySuccess('Action item reopened', item.text, 'action_item_reopened');
      }
    } catch (err) {
      notifyError('Couldn\'t update action item. Please try again.');
      // Rollback on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, completed: item.completed } : i))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      setAddingLoading(true);
      const newItem = await api.addActionItem(
        meetingId,
        newText.trim(),
        newAssignee.trim() || undefined
      );
      notifySuccess('Action item added', newItem.text, 'action_item_added');
      setItems((prev) => [...prev, newItem]);
      setNewText('');
      setNewAssignee('');
      setIsAdding(false);
    } catch (err: any) {
      notifyError('Couldn\'t add action item. Please try again.');
    } finally {
      setAddingLoading(false);
    }
  };

  const startEditing = (item: ActionItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditAssignee(item.assigneeName || '');
  };

  const handleSaveEdit = async (item: ActionItem) => {
    if (!editText.trim()) return;

    try {
      setUpdatingId(item.id);
      const updated = await api.updateActionItem(item.id, {
        text: editText.trim(),
        assigneeName: editAssignee.trim() || undefined,
      });
      notifySuccess('Action item updated', updated.text, 'action_item_updated');
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      setEditingId(null);
    } catch (err: any) {
      notifyError('Couldn\'t update action item. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteActionItem = async (item: ActionItem) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;

    try {
      setUpdatingId(item.id);
      await api.deleteActionItem(item.id);
      notifySuccess('Action item deleted', item.text, 'action_item_deleted');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      notifyError('Couldn\'t delete action item. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Top Add Action Item Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 500,
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          <Plus size={14} />
          <span>Add Action Item</span>
        </button>
      )}

      {/* Add Action Item Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleAddActionItem}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: 'var(--bg-base)',
            border: '1px solid var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <input
            type="text"
            placeholder="Action item task description..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              fontSize: '0.84rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="Assignee name (optional)..."
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            style={{
              padding: '0.4rem 0.6rem',
              fontSize: '0.84rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              disabled={addingLoading}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingLoading}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                backgroundColor: 'var(--brand-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              {addingLoading ? 'Adding...' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List Items */}
      {items.length === 0 && !isAdding ? (
        <div className={styles.emptyTabState}>
          No action items extracted for this meeting.
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className={styles.taskItem}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => handleToggleComplete(item)}
              disabled={updatingId === item.id}
              className={styles.checkbox}
              title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
            />

            {editingId === item.id ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.84rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--brand-primary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Assignee..."
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  style={{
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <button
                    onClick={() => handleSaveEdit(item)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.7rem',
                      backgroundColor: 'var(--brand-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={12} /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.7rem',
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.taskContent}>
                <span
                  className={`${styles.taskText} ${
                    item.completed ? styles.completedText : ''
                  }`}
                >
                  {item.text}
                </span>
                {item.assigneeName && (
                  <span className={styles.assigneeBadge}>
                    Assignee: {item.assigneeName}
                  </span>
                )}
              </div>
            )}

            {editingId !== item.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  onClick={() => startEditing(item)}
                  title="Edit task"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                  }}
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDeleteActionItem(item)}
                  title="Delete task"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
