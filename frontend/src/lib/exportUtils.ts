import { MeetingDetail } from '@/types/meeting';

export interface ExportTranscriptOptions {
  includeSpeakerNames?: boolean;
  includeTimestamps?: boolean;
}

export interface ExportSummaryOptions {
  includeMeetingDetails?: boolean;
  includeActionItems?: boolean;
}

// Helper to format duration in seconds to MM:SS or HH:MM:SS
export function formatDurationSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

// Helper to format date cleanly
export function formatDateString(dateString?: string): string {
  if (!dateString) return 'N/A';
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
}

// Helper to sanitize filenames for clean file downloads
export function sanitizeFilename(title: string): string {
  const safe = (title || 'meeting')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safe || 'meeting';
}

// Helper to trigger browser file downloads for Blob content
export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   TRANSCRIPT EXPORTS
   ========================================================================== */

export function exportTranscriptTxt(
  meeting: MeetingDetail,
  options?: ExportTranscriptOptions
): string {
  const { includeSpeakerNames = true, includeTimestamps = true } = options || {};
  const title = meeting.title || 'Untitled Meeting';
  const dateStr = formatDateString(meeting.date);
  const durationStr = formatDurationSeconds(meeting.durationSeconds);
  const participantsStr = (meeting.participants || []).map((p) => p.name).join(', ') || 'N/A';

  const lines: string[] = [
    '================================================================================',
    `MEETING TRANSCRIPT: ${title}`,
    `Date: ${dateStr}`,
    `Duration: ${durationStr}`,
    `Participants: ${participantsStr}`,
    '================================================================================',
    '',
  ];

  if (!meeting.segments || meeting.segments.length === 0) {
    lines.push('[No transcript segments available for this meeting]');
  } else {
    meeting.segments.forEach((segment) => {
      const timeStr = formatDurationSeconds(segment.startTime);
      let header = '';
      if (includeTimestamps && includeSpeakerNames) {
        header = `[${timeStr}] ${segment.speakerName}:`;
      } else if (includeTimestamps) {
        header = `[${timeStr}]:`;
      } else if (includeSpeakerNames) {
        header = `${segment.speakerName}:`;
      }
      if (header) {
        lines.push(header);
      }
      lines.push(segment.text);
      lines.push('');
    });
  }

  const filename = `${sanitizeFilename(title)}-transcript.txt`;
  const content = lines.join('\n');
  downloadBlob(content, filename, 'text/plain');
  return filename;
}

export function exportTranscriptMarkdown(
  meeting: MeetingDetail,
  options?: ExportTranscriptOptions
): string {
  const { includeSpeakerNames = true, includeTimestamps = true } = options || {};
  const title = meeting.title || 'Untitled Meeting';
  const dateStr = formatDateString(meeting.date);
  const durationStr = formatDurationSeconds(meeting.durationSeconds);
  const participantsStr = (meeting.participants || []).map((p) => p.name).join(', ') || 'N/A';

  const lines: string[] = [
    `# Meeting Transcript: ${title}`,
    '',
    `- **Date**: ${dateStr}`,
    `- **Duration**: ${durationStr}`,
    `- **Participants**: ${participantsStr}`,
    '',
    '---',
    '',
    '### Full Transcript',
    '',
  ];

  if (!meeting.segments || meeting.segments.length === 0) {
    lines.push('_No transcript segments available for this meeting._');
  } else {
    meeting.segments.forEach((segment) => {
      const timeStr = formatDurationSeconds(segment.startTime);
      let header = '';
      if (includeTimestamps && includeSpeakerNames) {
        header = `**[${timeStr}] ${segment.speakerName}**`;
      } else if (includeTimestamps) {
        header = `**[${timeStr}]**`;
      } else if (includeSpeakerNames) {
        header = `**${segment.speakerName}**`;
      }
      if (header) {
        lines.push(header);
      }
      lines.push(`${segment.text}`);
      lines.push('');
    });
  }

  const filename = `${sanitizeFilename(title)}-transcript.md`;
  const content = lines.join('\n');
  downloadBlob(content, filename, 'text/markdown');
  return filename;
}

/* ==========================================================================
   SUMMARY EXPORTS
   ========================================================================== */

export function exportSummaryTxt(
  meeting: MeetingDetail,
  options?: ExportSummaryOptions
): string {
  const { includeMeetingDetails = true, includeActionItems = true } = options || {};
  const title = meeting.title || 'Untitled Meeting';
  const dateStr = formatDateString(meeting.date);
  const durationStr = formatDurationSeconds(meeting.durationSeconds);
  const participantsStr = (meeting.participants || []).map((p) => p.name).join(', ') || 'N/A';

  const lines: string[] = [];

  if (includeMeetingDetails) {
    lines.push(
      '================================================================================',
      `MEETING SUMMARY: ${title}`,
      `Date: ${dateStr}`,
      `Duration: ${durationStr}`,
      `Participants: ${participantsStr}`,
      '================================================================================',
      ''
    );
  } else {
    lines.push(`MEETING SUMMARY: ${title}`, '');
  }

  if (meeting.summary) {
    lines.push('OVERVIEW');
    lines.push('--------------------------------------------------------------------------------');
    lines.push(meeting.summary.overview || 'N/A');
    lines.push('');

    if (meeting.summary.keyTakeaways && meeting.summary.keyTakeaways.length > 0) {
      lines.push('KEY TAKEAWAYS');
      lines.push('--------------------------------------------------------------------------------');
      meeting.summary.keyTakeaways.forEach((t) => lines.push(`- ${t}`));
      lines.push('');
    }

    if (meeting.summary.discussionBullets && meeting.summary.discussionBullets.length > 0) {
      lines.push('KEY DISCUSSION HIGHLIGHTS');
      lines.push('--------------------------------------------------------------------------------');
      meeting.summary.discussionBullets.forEach((d) => lines.push(`- ${d}`));
      lines.push('');
    }
  }

  if (includeActionItems && meeting.actionItems && meeting.actionItems.length > 0) {
    lines.push('ACTION ITEMS');
    lines.push('--------------------------------------------------------------------------------');
    meeting.actionItems.forEach((item) => {
      const status = item.completed ? '[X]' : '[ ]';
      const assignee = item.assigneeName ? ` (Assignee: ${item.assigneeName})` : '';
      lines.push(`${status} ${item.text}${assignee}`);
    });
    lines.push('');
  }

  if (meeting.chapters && meeting.chapters.length > 0) {
    lines.push('CHAPTER TOPICS');
    lines.push('--------------------------------------------------------------------------------');
    meeting.chapters.forEach((ch) => {
      const timeStr = formatDurationSeconds(ch.startTime);
      lines.push(`[${timeStr}] ${ch.title}: ${ch.summarySnippet || ''}`);
    });
    lines.push('');
  }

  const filename = `${sanitizeFilename(title)}-summary.txt`;
  const content = lines.join('\n');
  downloadBlob(content, filename, 'text/plain');
  return filename;
}

export function exportSummaryMarkdown(
  meeting: MeetingDetail,
  options?: ExportSummaryOptions
): string {
  const { includeMeetingDetails = true, includeActionItems = true } = options || {};
  const title = meeting.title || 'Untitled Meeting';
  const dateStr = formatDateString(meeting.date);
  const durationStr = formatDurationSeconds(meeting.durationSeconds);
  const participantsStr = (meeting.participants || []).map((p) => p.name).join(', ') || 'N/A';

  const lines: string[] = [`# Meeting Summary: ${title}`, ''];

  if (includeMeetingDetails) {
    lines.push(
      `- **Date**: ${dateStr}`,
      `- **Duration**: ${durationStr}`,
      `- **Participants**: ${participantsStr}`,
      '',
      '---',
      ''
    );
  }

  if (meeting.summary) {
    lines.push('## Executive Overview');
    lines.push('');
    lines.push(meeting.summary.overview || '_No overview provided._');
    lines.push('');

    if (meeting.summary.keyTakeaways && meeting.summary.keyTakeaways.length > 0) {
      lines.push('## Key Takeaways');
      lines.push('');
      meeting.summary.keyTakeaways.forEach((t) => lines.push(`- ${t}`));
      lines.push('');
    }

    if (meeting.summary.discussionBullets && meeting.summary.discussionBullets.length > 0) {
      lines.push('## Key Discussion Highlights');
      lines.push('');
      meeting.summary.discussionBullets.forEach((d) => lines.push(`- ${d}`));
      lines.push('');
    }
  }

  if (includeActionItems && meeting.actionItems && meeting.actionItems.length > 0) {
    lines.push('## Action Items');
    lines.push('');
    meeting.actionItems.forEach((item) => {
      const check = item.completed ? '[x]' : '[ ]';
      const assignee = item.assigneeName ? ` *(Assignee: ${item.assigneeName})*` : '';
      lines.push(`- ${check} ${item.text}${assignee}`);
    });
    lines.push('');
  }

  if (meeting.chapters && meeting.chapters.length > 0) {
    lines.push('## Outline Chapters');
    lines.push('');
    meeting.chapters.forEach((ch) => {
      const timeStr = formatDurationSeconds(ch.startTime);
      lines.push(`- **[${timeStr}] ${ch.title}**: ${ch.summarySnippet || ''}`);
    });
    lines.push('');
  }

  const filename = `${sanitizeFilename(title)}-summary.md`;
  const content = lines.join('\n');
  downloadBlob(content, filename, 'text/markdown');
  return filename;
}

/* ==========================================================================
   PDF PRINT WORKFLOW EXPORTS
   ========================================================================== */

function printHtmlDocument(htmlBodyContent: string, documentTitle: string) {
  let printContainer = document.getElementById('printable-export-container');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'printable-export-container';
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = `
    <style>
      @media print {
        body > *:not(#printable-export-container) {
          display: none !important;
        }
        #printable-export-container {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: #ffffff !important;
          color: #111827 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          padding: 24px !important;
          box-sizing: border-box !important;
        }
        @page {
          margin: 1.5cm;
          size: auto;
        }
        h1, h2, h3, .print-item {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
      @media screen {
        #printable-export-container {
          display: none !important;
        }
      }
    </style>
    <div style="max-width: 800px; margin: 0 auto; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827;">
      ${htmlBodyContent}
    </div>
  `;

  const originalTitle = document.title;
  document.title = documentTitle;

  setTimeout(() => {
    window.print();
    document.title = originalTitle;
    setTimeout(() => {
      if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
    }, 1000);
  }, 150);
}

export function exportTranscriptPdf(
  meeting: MeetingDetail,
  options?: ExportTranscriptOptions
): string {
  const { includeSpeakerNames = true, includeTimestamps = true } = options || {};
  const title = meeting.title || 'Untitled Meeting';
  const dateStr = formatDateString(meeting.date);
  const durationStr = formatDurationSeconds(meeting.durationSeconds);
  const participantsStr = (meeting.participants || []).map((p) => p.name).join(', ') || 'N/A';

  let segmentsHtml = '';
  if (!meeting.segments || meeting.segments.length === 0) {
    segmentsHtml = '<p style="color: #6b7280; font-style: italic;">No transcript segments available.</p>';
  } else {
    segmentsHtml = meeting.segments
      .map((s) => {
        const timeStr = formatDurationSeconds(s.startTime);
        let headerHtml = '';
        if (includeTimestamps && includeSpeakerNames) {
          headerHtml = `<div style="font-weight: 600; font-size: 0.9rem; color: #111827; margin-bottom: 0.25rem;"><span style="color: #4f46e5; font-size: 0.8rem; margin-right: 0.5rem;">[${timeStr}]</span>${s.speakerName}</div>`;
        } else if (includeTimestamps) {
          headerHtml = `<div style="font-weight: 600; font-size: 0.9rem; color: #4f46e5; margin-bottom: 0.25rem;">[${timeStr}]</div>`;
        } else if (includeSpeakerNames) {
          headerHtml = `<div style="font-weight: 600; font-size: 0.9rem; color: #111827; margin-bottom: 0.25rem;">${s.speakerName}</div>`;
        }

        return `
          <div class="print-item" style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; page-break-inside: avoid; break-inside: avoid;">
            ${headerHtml}
            <div style="font-size: 0.9rem; color: #374151;">${s.text}</div>
          </div>
        `;
      })
      .join('');
  }

  const htmlContent = `
    <div style="border-bottom: 2px solid #111827; padding-bottom: 1rem; margin-bottom: 1.5rem;">
      <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #111827;">Meeting Transcript: ${title}</h1>
      <div style="font-size: 0.85rem; color: #4b5563; display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <div><strong>Date:</strong> ${dateStr}</div>
        <div><strong>Duration:</strong> ${durationStr}</div>
        <div><strong>Participants:</strong> ${participantsStr}</div>
      </div>
    </div>
    <div>
      <h2 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 1rem; color: #111827;">Full Transcript</h2>
      ${segmentsHtml}
    </div>
  `;

  const filename = `${sanitizeFilename(title)}-transcript.pdf`;
  printHtmlDocument(htmlContent, `${title} - Transcript`);
  return filename;
}

export function exportSummaryPdf(
  meeting: MeetingDetail,
  options?: ExportSummaryOptions
): string {
  const { includeMeetingDetails = true, includeActionItems = true } = options || {};
  const title = meeting.title || 'Untitled Meeting';
  const dateStr = formatDateString(meeting.date);
  const durationStr = formatDurationSeconds(meeting.durationSeconds);
  const participantsStr = (meeting.participants || []).map((p) => p.name).join(', ') || 'N/A';

  let summaryHtml = '';
  if (meeting.summary) {
    summaryHtml += `
      <div class="print-item" style="margin-bottom: 1.5rem; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.35rem; margin-bottom: 0.5rem; color: #111827;">Executive Overview</h2>
        <p style="font-size: 0.9rem; color: #374151; margin: 0;">${meeting.summary.overview || 'N/A'}</p>
      </div>
    `;

    if (meeting.summary.keyTakeaways && meeting.summary.keyTakeaways.length > 0) {
      const takeawaysList = meeting.summary.keyTakeaways.map((t) => `<li style="margin-bottom: 0.35rem;">${t}</li>`).join('');
      summaryHtml += `
        <div class="print-item" style="margin-bottom: 1.5rem; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.35rem; margin-bottom: 0.5rem; color: #111827;">Key Takeaways</h2>
          <ul style="font-size: 0.9rem; color: #374151; padding-left: 1.25rem; margin: 0;">${takeawaysList}</ul>
        </div>
      `;
    }

    if (meeting.summary.discussionBullets && meeting.summary.discussionBullets.length > 0) {
      const discussionList = meeting.summary.discussionBullets.map((d) => `<li style="margin-bottom: 0.35rem;">${d}</li>`).join('');
      summaryHtml += `
        <div class="print-item" style="margin-bottom: 1.5rem; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.35rem; margin-bottom: 0.5rem; color: #111827;">Discussion Highlights</h2>
          <ul style="font-size: 0.9rem; color: #374151; padding-left: 1.25rem; margin: 0;">${discussionList}</ul>
        </div>
      `;
    }
  }

  if (includeActionItems && meeting.actionItems && meeting.actionItems.length > 0) {
    const itemsList = meeting.actionItems
      .map((item) => {
        const check = item.completed ? '☑' : '☐';
        const assignee = item.assigneeName ? ` <span style="color: #6b7280;">(Assignee: ${item.assigneeName})</span>` : '';
        return `<li style="margin-bottom: 0.4rem; list-style-type: none;"><strong>${check}</strong> ${item.text}${assignee}</li>`;
      })
      .join('');
    summaryHtml += `
      <div class="print-item" style="margin-bottom: 1.5rem; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.35rem; margin-bottom: 0.5rem; color: #111827;">Action Items</h2>
        <ul style="font-size: 0.9rem; color: #374151; padding-left: 0; margin: 0;">${itemsList}</ul>
      </div>
    `;
  }

  if (meeting.chapters && meeting.chapters.length > 0) {
    const chaptersList = meeting.chapters
      .map((ch) => {
        const timeStr = formatDurationSeconds(ch.startTime);
        return `<li style="margin-bottom: 0.4rem;"><strong>[${timeStr}] ${ch.title}</strong>: ${ch.summarySnippet || ''}</li>`;
      })
      .join('');
    summaryHtml += `
      <div class="print-item" style="margin-bottom: 1.5rem; page-break-inside: avoid; break-inside: avoid;">
        <h2 style="font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.35rem; margin-bottom: 0.5rem; color: #111827;">Outline Chapters</h2>
        <ul style="font-size: 0.9rem; color: #374151; padding-left: 1.25rem; margin: 0;">${chaptersList}</ul>
      </div>
    `;
  }

  const detailsHtml = includeMeetingDetails
    ? `<div style="border-bottom: 2px solid #111827; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #111827;">Meeting Summary: ${title}</h1>
        <div style="font-size: 0.85rem; color: #4b5563; display: flex; gap: 1.5rem; flex-wrap: wrap;">
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Duration:</strong> ${durationStr}</div>
          <div><strong>Participants:</strong> ${participantsStr}</div>
        </div>
      </div>`
    : `<div style="border-bottom: 2px solid #111827; padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0; color: #111827;">Meeting Summary: ${title}</h1>
      </div>`;

  const htmlContent = `
    ${detailsHtml}
    <div>
      ${summaryHtml}
    </div>
  `;

  const filename = `${sanitizeFilename(title)}-summary.pdf`;
  printHtmlDocument(htmlContent, `${title} - Summary`);
  return filename;
}
