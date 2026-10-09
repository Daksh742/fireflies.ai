from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ParticipantSchema(BaseModel):
    name: str
    email: Optional[str] = None
    avatarUrl: Optional[str] = None
    role: Optional[str] = None


class TranscriptSegmentSchema(BaseModel):
    id: str
    meetingId: str
    startTime: float
    endTime: float
    speakerName: str
    speakerAvatar: Optional[str] = None
    text: str
    sequenceOrder: int

    model_config = ConfigDict(from_attributes=True)


class SummarySchema(BaseModel):
    id: str
    meetingId: str
    overview: str
    keyTakeaways: List[str] = []
    discussionBullets: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class ActionItemSchema(BaseModel):
    id: str
    meetingId: str
    text: str
    assigneeName: Optional[str] = None
    completed: bool = False
    priority: Optional[str] = "medium"
    dueDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ChapterTopicSchema(BaseModel):
    id: str
    meetingId: str
    title: str
    startTime: float
    summarySnippet: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CommentHighlightSchema(BaseModel):
    id: str
    meetingId: str = Field(..., validation_alias="meeting_id")
    segmentId: str = Field(..., validation_alias="segment_id")
    selectedText: Optional[str] = Field(None, validation_alias="selected_text")
    startOffset: Optional[int] = Field(0, validation_alias="start_offset")
    endOffset: Optional[int] = Field(0, validation_alias="end_offset")
    commentText: Optional[str] = Field("", validation_alias="comment_text")
    colorCode: str = Field("#6366F1", validation_alias="color_code")
    annotationType: Optional[str] = Field("highlight", validation_alias="annotation_type")
    authorName: str = Field("Daksh Sachdeva", validation_alias="author_name")
    createdAt: datetime = Field(..., validation_alias="created_at")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CreateAnnotationRequest(BaseModel):
    segmentId: str
    selectedText: Optional[str] = None
    startOffset: Optional[int] = 0
    endOffset: Optional[int] = 0
    commentText: Optional[str] = ""
    annotationType: Optional[str] = "highlight"
    colorCode: Optional[str] = "#6366F1"
    authorName: Optional[str] = "Daksh Sachdeva"


class UpdateAnnotationRequest(BaseModel):
    colorCode: Optional[str] = None
    commentText: Optional[str] = None


class MeetingSummaryResponse(BaseModel):
    id: str
    title: str
    date: datetime
    durationSeconds: int
    audioUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    participants: List[dict] = []
    createdAt: datetime
    updatedAt: datetime
    segmentsCount: Optional[int] = 0
    actionItemsCount: Optional[int] = 0
    pendingActionItemsCount: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class MeetingDetailResponse(MeetingSummaryResponse):
    segments: List[TranscriptSegmentSchema] = []
    summary: Optional[SummarySchema] = None
    actionItems: List[ActionItemSchema] = []
    chapters: List[ChapterTopicSchema] = []
    comments: List[CommentHighlightSchema] = []


class CreateMeetingRequest(BaseModel):
    title: str
    date: Optional[datetime] = None
    participants: List[str] = []
    rawTranscriptText: Optional[str] = None
    audioUrl: Optional[str] = None


class UpdateMeetingRequest(BaseModel):
    title: Optional[str] = None
    participants: Optional[List[str]] = None
