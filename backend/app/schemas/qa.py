from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessageSchema(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Content of the message")


class AskQuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000, description="Question about the meeting")
    history: Optional[List[ChatMessageSchema]] = Field(default=None, description="Previous conversation turns in current session")


class SourceExcerpt(BaseModel):
    segmentId: Optional[str] = None
    speakerName: Optional[str] = None
    startTime: Optional[float] = None
    endTime: Optional[float] = None
    text: str


class AskQuestionResponse(BaseModel):
    meetingId: str
    question: str
    answer: str
    found: bool
    sources: List[SourceExcerpt] = []
    timestamp: str
