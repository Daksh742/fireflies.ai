import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class MeetingModel(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    audio_url = Column(String, nullable=True)
    video_url = Column(String, nullable=True)
    participants = Column(JSON, default=list) # List of participant dicts/strings
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    segments = relationship("TranscriptSegmentModel", back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegmentModel.sequence_order")
    summary = relationship("SummaryModel", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItemModel", back_populates="meeting", cascade="all, delete-orphan")
    chapters = relationship("ChapterTopicModel", back_populates="meeting", cascade="all, delete-orphan", order_by="ChapterTopicModel.start_time")
    comments = relationship("CommentHighlightModel", back_populates="meeting", cascade="all, delete-orphan")


class TranscriptSegmentModel(Base):
    __tablename__ = "transcript_segments"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(Float, nullable=False) # In seconds
    end_time = Column(Float, nullable=False)   # In seconds
    speaker_name = Column(String, nullable=False, index=True)
    speaker_avatar = Column(String, nullable=True)
    text = Column(Text, nullable=False)
    sequence_order = Column(Integer, nullable=False)

    meeting = relationship("MeetingModel", back_populates="segments")


class SummaryModel(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    overview = Column(Text, nullable=False)
    key_takeaways = Column(JSON, default=list)
    discussion_bullets = Column(JSON, default=list)

    meeting = relationship("MeetingModel", back_populates="summary")


class ActionItemModel(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    assignee_name = Column(String, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    priority = Column(String, default="medium")
    due_date = Column(DateTime, nullable=True)

    meeting = relationship("MeetingModel", back_populates="action_items")


class ChapterTopicModel(Base):
    __tablename__ = "chapter_topics"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    start_time = Column(Float, nullable=False)
    summary_snippet = Column(Text, nullable=True)

    meeting = relationship("MeetingModel", back_populates="chapters")


class CommentHighlightModel(Base):
    __tablename__ = "comment_highlights"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    segment_id = Column(String, ForeignKey("transcript_segments.id", ondelete="CASCADE"), nullable=False)
    selected_text = Column(Text, nullable=True)
    start_offset = Column(Integer, default=0, nullable=True)
    end_offset = Column(Integer, default=0, nullable=True)
    comment_text = Column(Text, nullable=True, default="")
    color_code = Column(String, default="#6366F1")
    annotation_type = Column(String, default="highlight")
    author_name = Column(String, nullable=False, default="Daksh Sachdeva")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("MeetingModel", back_populates="comments")
