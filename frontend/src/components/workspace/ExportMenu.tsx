'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileCode, Printer, X } from 'lucide-react';
import { MeetingDetail } from '@/types/meeting';
import { useNotifications } from '@/context/NotificationContext';
import {
  exportTranscriptTxt,
  exportTranscriptMarkdown,
  exportTranscriptPdf,
  exportSummaryTxt,
  exportSummaryMarkdown,
  exportSummaryPdf,
  ExportTranscriptOptions,
  ExportSummaryOptions,
} from '@/lib/exportUtils';
import styles from './ExportMenu.module.css';

interface ExportMenuProps {
  meeting: MeetingDetail;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ meeting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { notifyToastOnly, notifyError } = useNotifications();

  // Export Settings State
  const [exportType, setExportType] = useState<'transcript' | 'summary'>('transcript');
  const [exportFormat, setExportFormat] = useState<'txt' | 'md' | 'pdf'>('txt');

  // Transcript Options
  const [includeSpeakerNames, setIncludeSpeakerNames] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  // Summary Options
  const [includeMeetingDetails, setIncludeMeetingDetails] = useState(true);
  const [includeActionItems, setIncludeActionItems] = useState(true);

  // Lock body scrolling when modal is open and handle Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      triggerBtnRef.current?.focus();
    }, 50);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      handleCloseModal();
    }
  };

  const handleExecuteExport = () => {
    try {
      let filename = '';
      const formatLabel = exportFormat.toUpperCase();

      if (exportType === 'transcript') {
        const options: ExportTranscriptOptions = {
          includeSpeakerNames,
          includeTimestamps,
        };

        if (exportFormat === 'txt') {
          filename = exportTranscriptTxt(meeting, options);
        } else if (exportFormat === 'md') {
          filename = exportTranscriptMarkdown(meeting, options);
        } else if (exportFormat === 'pdf') {
          filename = exportTranscriptPdf(meeting, options);
        }
      } else {
        const options: ExportSummaryOptions = {
          includeMeetingDetails,
          includeActionItems,
        };

        if (exportFormat === 'txt') {
          filename = exportSummaryTxt(meeting, options);
        } else if (exportFormat === 'md') {
          filename = exportSummaryMarkdown(meeting, options);
        } else if (exportFormat === 'pdf') {
          filename = exportSummaryPdf(meeting, options);
        }
      }

      handleCloseModal();
      notifyToastOnly(`Export complete (${formatLabel})`, filename, 'success');
    } catch (err: any) {
      notifyError(`Export failed: ${err?.message || 'Unexpected error'}`);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Single Header Export Button */}
      <button
        type="button"
        ref={triggerBtnRef}
        className={styles.triggerBtn}
        onClick={handleOpenModal}
        title="Export Transcript or Summary"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Download size={13} />
        <span>Export</span>
      </button>

      {/* Centered Modal Dialog */}
      {isOpen && (
        <div
          ref={overlayRef}
          className={styles.overlay}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.dialogHeader}>
              <div className={styles.headerText}>
                <h2 id="export-dialog-title" className={styles.title}>
                  Export meeting
                </h2>
                <p className={styles.subtitle}>
                  Choose what to export and customize your file.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleCloseModal}
                title="Close modal"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className={styles.dialogBody}>
              {/* Content Type Selector */}
              <div>
                <div className={styles.sectionHeader}>Export content</div>
                <div className={styles.typeTabs}>
                  <button
                    type="button"
                    className={`${styles.typeTabBtn} ${
                      exportType === 'transcript' ? styles.activeTypeTab : ''
                    }`}
                    onClick={() => setExportType('transcript')}
                  >
                    Transcript
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeTabBtn} ${
                      exportType === 'summary' ? styles.activeTypeTab : ''
                    }`}
                    onClick={() => setExportType('summary')}
                  >
                    Summary
                  </button>
                </div>
              </div>

              {/* Format Selector */}
              <div>
                <div className={styles.sectionHeader}>File format</div>
                <div className={styles.formatGrid}>
                  <button
                    type="button"
                    className={`${styles.formatBtn} ${
                      exportFormat === 'txt' ? styles.activeFormatBtn : ''
                    }`}
                    onClick={() => setExportFormat('txt')}
                  >
                    <FileText size={15} />
                    <span>TXT</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.formatBtn} ${
                      exportFormat === 'md' ? styles.activeFormatBtn : ''
                    }`}
                    onClick={() => setExportFormat('md')}
                  >
                    <FileCode size={15} />
                    <span>Markdown</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.formatBtn} ${
                      exportFormat === 'pdf' ? styles.activeFormatBtn : ''
                    }`}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <Printer size={15} />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div className={styles.divider} />

              {/* Options Checkboxes */}
              <div>
                <div className={styles.sectionHeader}>Options</div>
                <div className={styles.optionsGroup}>
                  {exportType === 'transcript' ? (
                    <>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={includeSpeakerNames}
                          onChange={(e) => setIncludeSpeakerNames(e.target.checked)}
                        />
                        <span>Include speaker names</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={includeTimestamps}
                          onChange={(e) => setIncludeTimestamps(e.target.checked)}
                        />
                        <span>Include timestamps</span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={includeMeetingDetails}
                          onChange={(e) => setIncludeMeetingDetails(e.target.checked)}
                        />
                        <span>Include meeting details</span>
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={includeActionItems}
                          onChange={(e) => setIncludeActionItems(e.target.checked)}
                        />
                        <span>Include action items, if available</span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.dialogFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.exportActionBtn}
                onClick={handleExecuteExport}
              >
                <Download size={14} />
                <span>
                  Export {exportType === 'transcript' ? 'Transcript' : 'Summary'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
