'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Send, RefreshCw, AlertCircle, Play } from 'lucide-react';
import { MeetingDetail, AskQuestionResponse } from '@/types/meeting';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import styles from './AskAiTab.module.css';

interface AskAiTabProps {
  meeting: MeetingDetail;
  onSeek: (seconds: number) => void;
}

interface QAMessage {
  id: string;
  question: string;
  answerResponse: AskQuestionResponse;
}

/**
 * Validates whether a candidate question can be answered from the meeting's real data.
 */
function isQuestionAnswerable(question: string, meeting: MeetingDetail): boolean {
  if (!question || !meeting) return false;
  const qLower = question.toLowerCase();

  // Rule 1: Summary / Takeaways check
  if (/\b(summary|overview|takeaway|key takeaway|highlight)\b/i.test(qLower)) {
    return Boolean(
      meeting.summary &&
        ((meeting.summary.overview && meeting.summary.overview.trim().length > 0) ||
          (meeting.summary.keyTakeaways && meeting.summary.keyTakeaways.length > 0))
    );
  }

  // Rule 2: Action items check
  if (/\b(action item|task|todo|to-do|assigned)\b/i.test(qLower)) {
    return Boolean(meeting.actionItems && meeting.actionItems.length > 0);
  }

  // Rule 3: Keyword validation in segments, summary, or action items
  const stopWords = new Set([
    'what', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were',
    'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'about', 'did', 'does', 'do', 'tell', 'me', 'discuss', 'discussed', 'regarding',
    'during', 'this', 'meeting', 'key', 'decisions', 'say', 'said'
  ]);
  const words = qLower.match(/\w+/g) || [];
  const keywords = words.filter((w) => w.length > 2 && !stopWords.has(w));

  if (keywords.length === 0) return false;

  const hasSegmentMatch = Boolean(
    meeting.segments?.some((seg) => {
      const textLower = seg.text.toLowerCase();
      const speakerLower = seg.speakerName.toLowerCase();
      return keywords.some((kw) => textLower.includes(kw) || speakerLower.includes(kw));
    })
  );

  const hasSummaryMatch = Boolean(
    meeting.summary &&
      ((meeting.summary.overview && keywords.some((kw) => meeting.summary!.overview.toLowerCase().includes(kw))) ||
        (meeting.summary.keyTakeaways && keywords.some((kw) => meeting.summary!.keyTakeaways.some((t) => t.toLowerCase().includes(kw)))))
  );

  const hasActionMatch = Boolean(
    meeting.actionItems?.some((ai) => keywords.some((kw) => ai.text.toLowerCase().includes(kw)))
  );

  return hasSegmentMatch || hasSummaryMatch || hasActionMatch;
}

/**
 * Dynamically derives grounded and answerable candidate questions from the meeting's real data.
 */
export function generateGroundedSuggestions(meeting: MeetingDetail): string[] {
  if (!meeting) return [];

  const candidates: string[] = [];

  const hasSummary = Boolean(
    meeting.summary &&
      ((meeting.summary.overview && meeting.summary.overview.trim().length > 0) ||
        (meeting.summary.keyTakeaways && meeting.summary.keyTakeaways.length > 0))
  );
  const hasActionItems = Boolean(meeting.actionItems && meeting.actionItems.length > 0);
  const hasChapters = Boolean(meeting.chapters && meeting.chapters.length > 0);
  const hasSegments = Boolean(meeting.segments && meeting.segments.length > 0);

  // 1. Summary / Key Takeaways candidate
  if (hasSummary) {
    candidates.push('What were the key takeaways from this meeting?');
  }

  // 2. Action Items candidate
  if (hasActionItems) {
    candidates.push('What action items were assigned in this meeting?');
  }

  // 3. Chapter Topics candidates
  if (hasChapters) {
    for (const chapter of meeting.chapters) {
      if (chapter.title) {
        const title = chapter.title.trim();
        const q = `What was discussed regarding ${title}?`;
        if (!candidates.includes(q)) {
          candidates.push(q);
        }
      }
    }
  }

  // 4. Discussion points from summary if present
  if (meeting.summary?.discussionBullets) {
    for (const bullet of meeting.summary.discussionBullets) {
      const cleaned = bullet.split('.')[0].replace(/^[-•*]\s*/, '').trim();
      if (cleaned.length > 5 && cleaned.length < 60) {
        const q = `What was discussed about ${cleaned.toLowerCase()}?`;
        if (!candidates.includes(q)) {
          candidates.push(q);
        }
      }
    }
  }

  // 5. Active Speakers candidate
  if (hasSegments) {
    const speakerCounts: Record<string, number> = {};
    for (const seg of meeting.segments) {
      if (seg.speakerName) {
        speakerCounts[seg.speakerName] = (speakerCounts[seg.speakerName] || 0) + 1;
      }
    }
    const sortedSpeakers = Object.keys(speakerCounts).sort((a, b) => speakerCounts[b] - speakerCounts[a]);
    for (const speaker of sortedSpeakers) {
      const q = `What did ${speaker} discuss during this meeting?`;
      if (!candidates.includes(q)) {
        candidates.push(q);
      }
    }
  }

  // Filter candidates against answerability verification function
  const verified = candidates.filter((q) => isQuestionAnswerable(q, meeting));

  // Return at most 3 verified questions
  return verified.slice(0, 3);
}

export const AskAiTab: React.FC<AskAiTabProps> = ({ meeting, onSeek }) => {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest response or loading indicator
  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading]);

  // Reset history and state when navigating between meetings
  useEffect(() => {
    setMessages([]);
    setQuestionInput('');
    setError(null);
    setValidationError(null);
    setLastFailedQuestion(null);
  }, [meeting.id]);

  // Dynamically derive and validate grounded suggested questions
  const sampleQuestions = useMemo(() => generateGroundedSuggestions(meeting), [meeting]);

  const handleSubmitQuestion = async (qText: string) => {
    const cleanQ = qText.trim();
    if (!cleanQ) {
      setValidationError('Please enter a question before submitting.');
      return;
    }

    setValidationError(null);
    setError(null);
    setLoading(true);

    try {
      const historyPayload = messages.flatMap((msg) => [
        { role: 'user' as const, content: msg.question },
        { role: 'assistant' as const, content: msg.answerResponse.answer },
      ]);
      const response = await api.askMeetingQuestion(meeting.id, cleanQ, historyPayload);
      setMessages((prev) => [
        ...prev,
        {
          id: `qa-${Date.now()}-${Math.random()}`,
          question: cleanQ,
          answerResponse: response,
        },
      ]);
      setQuestionInput('');
      setLastFailedQuestion(null);
    } catch (err: any) {
      console.error('Failed to ask question:', err);
      setLastFailedQuestion(cleanQ);
      setError(err?.message || 'Failed to generate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedQuestion) {
      handleSubmitQuestion(lastFailedQuestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuestion(questionInput);
    }
  };

  // Render text with clickable [MM:SS] timestamps
  const renderFormattedAnswer = (text: string) => {
    const parts = text.split(/(\[\d{2}:\d{2}\])/g);
    return (
      <span>
        {parts.map((part, idx) => {
          const timeMatch = part.match(/^\[(\d{2}):(\d{2})\]$/);
          if (timeMatch) {
            const mins = parseInt(timeMatch[1], 10);
            const secs = parseInt(timeMatch[2], 10);
            const totalSecs = mins * 60 + secs;
            return (
              <button
                key={`ts-${idx}`}
                type="button"
                className={styles.timestampLink}
                onClick={() => onSeek(totalSecs)}
                title={`Seek audio to ${part}`}
              >
                <Play size={9} />
                <span>{part}</span>
              </button>
            );
          }
          return <React.Fragment key={`text-${idx}`}>{part}</React.Fragment>;
        })}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.historyList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>
              <Sparkles size={18} />
              <span>Ask AI about this Meeting</span>
            </div>
            <p className={styles.emptySubtitle}>
              Get grounded answers derived strictly from this meeting&apos;s actual transcript and summaries.
            </p>

            <div className={styles.suggestionsBox}>
              <span className={styles.suggestionTitle}>Suggested Questions</span>
              {sampleQuestions.length > 0 ? (
                <div className={styles.suggestionPills}>
                  {sampleQuestions.map((sq, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.pillBtn}
                      onClick={() => {
                        setQuestionInput(sq);
                        handleSubmitQuestion(sq);
                      }}
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.emptySubtitle} style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  No suggested questions available for this meeting.
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className={styles.qaMessageItem}>
              <div className={styles.questionHeader}>
                <Avatar name="Daksh Sachdeva" size="sm" />
                <span className={styles.questionText}>{item.question}</span>
              </div>

              <div className={styles.answerBox}>
                <div className={styles.answerHeader}>
                  <span
                    className={`${styles.aiBadge} ${
                      !item.answerResponse.found ? styles.notFoundBadge : ''
                    }`}
                  >
                    <Sparkles size={11} />
                    <span>{item.answerResponse.found ? 'AI Answer' : 'Not Found'}</span>
                  </span>
                </div>

                <div className={styles.answerBody}>
                  {renderFormattedAnswer(item.answerResponse.answer)}
                </div>

                {item.answerResponse.sources && item.answerResponse.sources.length > 0 && (
                  <div className={styles.sourcesSection}>
                    <span className={styles.sourcesTitle}>Grounded Transcript Sources</span>
                    {item.answerResponse.sources.map((src, sIdx) => (
                      <div key={sIdx} className={styles.sourceCard}>
                        <div className={styles.sourceMeta}>
                          <span>{src.speakerName || 'Speaker'}</span>
                          {src.startTime !== undefined && (
                            <button
                              type="button"
                              className={styles.timestampLink}
                              onClick={() => onSeek(src.startTime || 0)}
                            >
                              <Play size={9} />
                              <span>
                                {Math.floor((src.startTime || 0) / 60)
                                  .toString()
                                  .padStart(2, '0')}
                                :
                                {Math.floor((src.startTime || 0) % 60)
                                  .toString()
                                  .padStart(2, '0')}
                              </span>
                            </button>
                          )}
                        </div>
                        <p className={styles.sourceText}>&quot;{src.text}&quot;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className={`${styles.qaMessageItem} ${styles.loadingItem}`}>
            <div className={styles.answerHeader}>
              <span className={styles.aiBadge}>
                <Sparkles size={11} />
                <span>Thinking</span>
              </span>
            </div>
            <div className={styles.typingIndicator}>
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
              <span className={styles.typingDot} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.formBox}>
        {error && (
          <div className={styles.errorBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            {lastFailedQuestion && (
              <button type="button" className={styles.retryBtn} onClick={handleRetry}>
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {validationError && (
          <div className={styles.validationWarning}>{validationError}</div>
        )}

        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.inputField}
            placeholder="Ask anything about this meeting..."
            value={questionInput}
            onChange={(e) => {
              setQuestionInput(e.target.value);
              if (validationError) setValidationError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => handleSubmitQuestion(questionInput)}
            disabled={loading || !questionInput.trim()}
            title="Ask AI question"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
