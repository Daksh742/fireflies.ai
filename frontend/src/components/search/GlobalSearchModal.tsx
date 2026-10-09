'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, X, Video, MessageSquare, Sparkles, CheckSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { GlobalSearchResult } from '@/types/meeting';
import { formatDurationSeconds } from '@/lib/exportUtils';
import styles from './GlobalSearchModal.module.css';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HighlightTextProps {
  text: string;
  query: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text, query }) => {
  if (!text) return null;
  if (!query || !query.trim()) return <>{text}</>;

  const trimmedQuery = query.trim();
  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();
        return isMatch ? (
          <mark key={index} className={styles.searchHighlight}>
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </>
  );
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and focus input when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Debounced Search API Call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await api.searchGlobal(query.trim());
        setResults(response?.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    if (categoryFilter === 'all') return results;
    return results.filter((r) => r.type === categoryFilter);
  }, [results, categoryFilter]);

  // Reset keyboard selection index when results change
  useEffect(() => {
    setFocusedIndex(0);
  }, [filteredResults]);

  // Keyboard navigation inside modal (Arrow keys + Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetItem = filteredResults[focusedIndex];
      if (targetItem) {
        handleSelectResult(targetItem);
      }
    }
  };

  const handleSelectResult = (item: GlobalSearchResult) => {
    onClose();
    if (item.type === 'transcript' && typeof item.startTime === 'number') {
      router.push(`/meetings/${item.meetingId}?time=${item.startTime}`);
    } else if (item.type === 'action_item') {
      router.push(`/meetings/${item.meetingId}?tab=action-items`);
    } else {
      router.push(`/meetings/${item.meetingId}`);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'transcript':
        return <MessageSquare size={16} className={styles.typeIcon} />;
      case 'summary':
        return <Sparkles size={16} className={styles.typeIcon} />;
      case 'action_item':
        return <CheckSquare size={16} className={styles.typeIcon} />;
      default:
        return <Video size={16} className={styles.typeIcon} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transcript':
        return 'Transcript';
      case 'summary':
        return 'Summary';
      case 'action_item':
        return 'Task';
      default:
        return 'Meeting';
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Header */}
        <div className={styles.searchHeader}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search meetings, transcripts, summaries, action items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              title="Clear search query"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close search"
            title="Close search"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className={styles.categoryBar}>
          {[
            { id: 'all', label: 'All Results' },
            { id: 'meeting', label: 'Meetings' },
            { id: 'transcript', label: 'Transcripts' },
            { id: 'summary', label: 'Summaries' },
            { id: 'action_item', label: 'Action Items' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.categoryBtn} ${
                categoryFilter === cat.id ? styles.activeCategoryBtn : ''
              }`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className={styles.resultsList}>
          {loading ? (
            <div className={styles.loadingBox}>Searching database...</div>
          ) : query.trim() && filteredResults.length === 0 ? (
            <div className={styles.emptyState}>
              No search results found for &quot;{query}&quot;.
            </div>
          ) : !query.trim() ? (
            <div className={styles.emptyState}>
              Type keywords to search across titles, transcripts, AI summaries, and action items.
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isFocused = index === focusedIndex;
              return (
                <div
                  key={item.id}
                  className={`${styles.resultItem} ${
                    isFocused ? styles.focusedResultItem : ''
                  }`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {getItemIcon(item.type)}

                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={styles.meetingTitle}>
                        <HighlightText text={item.meetingTitle} query={query} />
                      </span>
                      <div className={styles.itemMeta}>
                        {item.type === 'transcript' && typeof item.startTime === 'number' && (
                          <span className={styles.timeBadge}>
                            [{formatDurationSeconds(item.startTime)}]
                          </span>
                        )}
                        <span className={styles.typeBadge}>
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                    </div>

                    <p className={styles.snippet}>
                      {item.speakerName && (
                        <span className={styles.speakerLabel}>
                          <HighlightText text={`${item.speakerName}:`} query={query} />
                        </span>
                      )}
                      <HighlightText text={item.snippet} query={query} />
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard Navigation Footer */}
        <div className={styles.footerHint}>
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate, <strong>↵</strong> to jump</span>
          <span><strong>Esc</strong> to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
