import {
  Meeting,
  MeetingDetail,
  MeetingFilterOptions,
  CreateMeetingPayload,
  UpdateMeetingPayload,
  ActionItem,
  GlobalSearchResponse,
  CommentHighlight,
  CreateAnnotationPayload,
  UpdateAnnotationPayload,
  AskQuestionResponse,
} from '../types/meeting';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://fireflies-ai-qyjw.onrender.com/api/v1";
class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      throw new ApiError(
        errorData?.detail || `HTTP Error ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network request failed', 0);
  }
}

export const api = {
  async getMeetings(params: MeetingFilterOptions = {}): Promise<{ items: Meeting[]; total: number }> {
    const query = new URLSearchParams();
    if (params.query) query.append('q', params.query);
    if (params.participant) query.append('participant', params.participant);
    if (params.dateRange) query.append('date_range', params.dateRange);
    if (params.sortBy) query.append('sort', params.sortBy);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<{ items: Meeting[]; total: number }>(`/meetings${queryString}`);
  },

  async getMeetingById(id: string): Promise<MeetingDetail> {
    return fetchJson<MeetingDetail>(`/meetings/${id}`);
  },

  async createMeeting(payload: CreateMeetingPayload): Promise<MeetingDetail> {
    return fetchJson<MeetingDetail>('/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMeeting(id: string, payload: UpdateMeetingPayload): Promise<Meeting> {
    return fetchJson<Meeting>(`/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteMeeting(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>(`/meetings/${id}`, {
      method: 'DELETE',
    });
  },

  async addActionItem(meetingId: string, text: string, assigneeName?: string): Promise<ActionItem> {
    return fetchJson<ActionItem>(`/meetings/${meetingId}/action-items`, {
      method: 'POST',
      body: JSON.stringify({ text, assigneeName }),
    });
  },

  async updateActionItem(itemId: string, updates: Partial<ActionItem>): Promise<ActionItem> {
    return fetchJson<ActionItem>(`/action-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteActionItem(itemId: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/action-items/${itemId}`, {
      method: 'DELETE',
    });
  },

  async searchGlobal(q: string): Promise<GlobalSearchResponse> {
    const encoded = encodeURIComponent(q.trim());
    return fetchJson<GlobalSearchResponse>(`/search?q=${encoded}`);
  },

  async createAnnotation(meetingId: string, payload: CreateAnnotationPayload): Promise<CommentHighlight> {
    return fetchJson<CommentHighlight>(`/meetings/${meetingId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAnnotation(
    meetingId: string,
    annotationId: string,
    payload: UpdateAnnotationPayload
  ): Promise<CommentHighlight> {
    return fetchJson<CommentHighlight>(`/meetings/${meetingId}/annotations/${annotationId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteAnnotation(meetingId: string, annotationId: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/meetings/${meetingId}/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  },

  async askMeetingQuestion(
    meetingId: string,
    question: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AskQuestionResponse> {
    return fetchJson<AskQuestionResponse>(`/meetings/${meetingId}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    });
  },
};
