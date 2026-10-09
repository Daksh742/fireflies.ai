export interface Participant {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

export interface TranscriptSegment {
  id: string;
  meetingId: string;
  startTime: number;
  endTime: number;
  speakerName: string;
  speakerAvatar?: string;
  text: string;
  sequenceOrder: number;
}

export interface Summary {
  id: string;
  meetingId: string;
  overview: string;
  keyTakeaways: string[];
  discussionBullets: string[];
}

export interface ActionItem {
  id: string;
  meetingId: string;
  text: string;
  assigneeName?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface ChapterTopic {
  id: string;
  meetingId: string;
  title: string;
  startTime: number;
  summarySnippet: string;
}

export interface CommentHighlight {
  id: string;
  meetingId: string;
  segmentId: string;
  selectedText?: string;
  startOffset?: number;
  endOffset?: number;
  commentText?: string;
  colorCode: string;
  annotationType?: 'highlight' | 'comment';
  authorName: string;
  createdAt: string;
}

export interface CreateAnnotationPayload {
  segmentId: string;
  selectedText?: string;
  startOffset?: number;
  endOffset?: number;
  commentText?: string;
  annotationType?: 'highlight' | 'comment';
  colorCode?: string;
  authorName?: string;
}

export interface UpdateAnnotationPayload {
  colorCode?: string;
  commentText?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  audioUrl?: string;
  videoUrl?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  segmentsCount?: number;
  actionItemsCount?: number;
  pendingActionItemsCount?: number;
}

export interface MeetingDetail extends Meeting {
  segments: TranscriptSegment[];
  summary?: Summary;
  actionItems: ActionItem[];
  chapters: ChapterTopic[];
  comments: CommentHighlight[];
}

export interface MeetingFilterOptions {
  query?: string;
  participant?: string;
  dateRange?: string; // '7days', '30days', 'older'
  sortBy?: 'date_desc' | 'date_asc' | 'duration_desc' | 'duration_asc';
  page?: number;
  limit?: number;
}

export interface CreateMeetingPayload {
  title: string;
  date?: string;
  participants: string[];
  rawTranscriptText?: string;
  audioUrl?: string;
}

export interface UpdateMeetingPayload {
  title?: string;
  participants?: string[];
}

export interface GlobalSearchResult {
  id: string;
  type: 'meeting' | 'transcript' | 'summary' | 'action_item';
  meetingId: string;
  meetingTitle: string;
  date?: string;
  snippet: string;
  segmentId?: string;
  speakerName?: string;
  startTime?: number;
  endTime?: number;
  actionItemId?: string;
  assigneeName?: string;
  completed?: boolean;
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: GlobalSearchResult[];
}

export interface SourceExcerpt {
  segmentId?: string;
  speakerName?: string;
  startTime?: number;
  endTime?: number;
  text: string;
}

export interface AskQuestionResponse {
  meetingId: string;
  question: string;
  answer: string;
  found: boolean;
  sources: SourceExcerpt[];
  timestamp: string;
}

