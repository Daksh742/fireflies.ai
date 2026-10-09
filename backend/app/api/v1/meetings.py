from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.meeting_service import MeetingService
from app.schemas.meeting import (
    MeetingDetailResponse,
    CreateMeetingRequest,
    UpdateMeetingRequest,
    ActionItemSchema,
    CreateAnnotationRequest,
    UpdateAnnotationRequest,
    CommentHighlightSchema,
)

router = APIRouter(prefix="/meetings", tags=["Meetings"])


@router.get("", response_model=dict)
def list_meetings(
    q: Optional[str] = Query(None, description="Search by title or participant"),
    participant: Optional[str] = Query(None, description="Filter by participant name"),
    date_range: Optional[str] = Query(None, description="Filter by date: 7days, 30days, older"),
    sort: Optional[str] = Query("date_desc", description="Sort order: date_desc, date_asc, duration_desc, duration_asc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Fetch paginated list of meetings with title, participant, date filtering, and recency sorting."""
    meetings, total = MeetingService.get_meetings(
        db, query=q, participant=participant, date_range=date_range, sort_by=sort, page=page, limit=limit
    )

    items = []
    for m in meetings:
        segments_count = len(m.segments) if m.segments else 0
        action_items_count = len(m.action_items) if m.action_items else 0
        pending_count = sum(1 for item in m.action_items if not item.completed) if m.action_items else 0

        items.append({
            "id": m.id,
            "title": m.title,
            "date": m.date,
            "durationSeconds": m.duration_seconds,
            "audioUrl": m.audio_url,
            "videoUrl": m.video_url,
            "participants": m.participants,
            "createdAt": m.created_at,
            "updatedAt": m.updated_at,
            "segmentsCount": segments_count,
            "actionItemsCount": action_items_count,
            "pendingActionItemsCount": pending_count,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting_detail(meeting_id: str, db: Session = Depends(get_db)):
    """Fetch full meeting workspace details."""
    meeting = MeetingService.get_meeting_by_id(db, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found"
        )

    segments_count = len(meeting.segments) if meeting.segments else 0
    action_items_count = len(meeting.action_items) if meeting.action_items else 0
    pending_count = sum(1 for item in meeting.action_items if not item.completed) if meeting.action_items else 0

    return {
        "id": meeting.id,
        "title": meeting.title,
        "date": meeting.date,
        "durationSeconds": meeting.duration_seconds,
        "audioUrl": meeting.audio_url,
        "videoUrl": meeting.video_url,
        "participants": meeting.participants,
        "createdAt": meeting.created_at,
        "updatedAt": meeting.updated_at,
        "segmentsCount": segments_count,
        "actionItemsCount": action_items_count,
        "pendingActionItemsCount": pending_count,
        "segments": [
            {
                "id": s.id,
                "meetingId": s.meeting_id,
                "startTime": s.start_time,
                "endTime": s.end_time,
                "speakerName": s.speaker_name,
                "speakerAvatar": s.speaker_avatar,
                "text": s.text,
                "sequenceOrder": s.sequence_order
            }
            for s in meeting.segments
        ],
        "summary": {
            "id": meeting.summary.id,
            "meetingId": meeting.summary.meeting_id,
            "overview": meeting.summary.overview,
            "keyTakeaways": meeting.summary.key_takeaways or [],
            "discussionBullets": meeting.summary.discussion_bullets or []
        } if meeting.summary else None,
        "actionItems": [
            {
                "id": a.id,
                "meetingId": a.meeting_id,
                "text": a.text,
                "assigneeName": a.assignee_name,
                "completed": a.completed,
                "priority": a.priority,
                "dueDate": a.due_date
            }
            for a in meeting.action_items
        ],
        "chapters": [
            {
                "id": c.id,
                "meetingId": c.meeting_id,
                "title": c.title,
                "startTime": c.start_time,
                "summarySnippet": c.summary_snippet
            }
            for c in meeting.chapters
        ],
        "comments": [
            {
                "id": cm.id,
                "meetingId": cm.meeting_id,
                "segmentId": cm.segment_id,
                "selectedText": cm.selected_text,
                "startOffset": cm.start_offset,
                "endOffset": cm.end_offset,
                "commentText": cm.comment_text,
                "colorCode": cm.color_code,
                "annotationType": cm.annotation_type,
                "authorName": cm.author_name,
                "createdAt": cm.created_at
            }
            for cm in meeting.comments
        ]
    }


@router.post("", response_model=MeetingDetailResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: CreateMeetingRequest, db: Session = Depends(get_db)):
    """Create a new meeting."""
    if not payload.title or not payload.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting title is required"
        )
    
    meeting = MeetingService.create_meeting(db, payload)
    return get_meeting_detail(meeting.id, db)


@router.patch("/{meeting_id}", response_model=dict)
def update_meeting(meeting_id: str, payload: UpdateMeetingRequest, db: Session = Depends(get_db)):
    """Update meeting metadata."""
    meeting = MeetingService.update_meeting(db, meeting_id, payload)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found"
        )
    return {
        "id": meeting.id,
        "title": meeting.title,
        "participants": meeting.participants,
        "updatedAt": meeting.updated_at
    }


@router.delete("/{meeting_id}", response_model=dict)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """Delete a meeting."""
    success = MeetingService.delete_meeting(db, meeting_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found"
        )
    return {
        "success": True,
        "message": f"Meeting '{meeting_id}' deleted successfully"
    }


@router.post("/{meeting_id}/action-items", response_model=ActionItemSchema, status_code=status.HTTP_201_CREATED)
def add_action_item_to_meeting(meeting_id: str, payload: dict, db: Session = Depends(get_db)):
    """Add a new action item to a meeting."""
    text = payload.get("text")
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action item text is required"
        )
    assignee_name = payload.get("assigneeName")
    priority = payload.get("priority", "medium")

    item = MeetingService.add_action_item(
        db, meeting_id, text=text.strip(), assignee_name=assignee_name, priority=priority
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found"
        )
    return {
        "id": item.id,
        "meetingId": item.meeting_id,
        "text": item.text,
        "assigneeName": item.assignee_name,
        "completed": item.completed,
        "priority": item.priority,
        "dueDate": item.due_date
    }


@router.post("/{meeting_id}/annotations", response_model=CommentHighlightSchema, status_code=status.HTTP_201_CREATED)
def create_annotation(meeting_id: str, payload: CreateAnnotationRequest, db: Session = Depends(get_db)):
    """Create a new highlight or comment annotation attached to a transcript segment."""
    annotation = MeetingService.add_annotation(db, meeting_id, payload)
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting '{meeting_id}' or Segment '{payload.segmentId}' not found"
        )
    return annotation


@router.patch("/annotations/{annotation_id}", response_model=CommentHighlightSchema)
@router.patch("/{meeting_id}/annotations/{annotation_id}", response_model=CommentHighlightSchema)
def update_annotation(
    annotation_id: str,
    payload: UpdateAnnotationRequest,
    meeting_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update an existing highlight color or comment text in place."""
    annotation = MeetingService.update_annotation(
        db,
        annotation_id,
        color_code=payload.colorCode,
        comment_text=payload.commentText,
    )
    if not annotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Annotation with ID '{annotation_id}' not found"
        )
    return annotation


@router.delete("/annotations/{annotation_id}", response_model=dict)
@router.delete("/{meeting_id}/annotations/{annotation_id}", response_model=dict)
def delete_annotation(annotation_id: str, meeting_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Delete a highlight or comment annotation."""
    success = MeetingService.delete_annotation(db, annotation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Annotation with ID '{annotation_id}' not found"
        )
    return {"success": True, "message": f"Annotation '{annotation_id}' deleted successfully"}



