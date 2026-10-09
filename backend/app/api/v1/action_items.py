from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.meeting_service import MeetingService
from app.schemas.meeting import ActionItemSchema

router = APIRouter(prefix="/action-items", tags=["Action Items"])


@router.patch("/{item_id}", response_model=ActionItemSchema)
def update_action_item(item_id: str, payload: dict, db: Session = Depends(get_db)):
    """Update action item status (completed) or content (text, assignee)."""
    completed = payload.get("completed")
    text = payload.get("text")
    assignee_name = payload.get("assigneeName")

    item = MeetingService.update_action_item(
        db, item_id, completed=completed, text=text, assignee_name=assignee_name
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item '{item_id}' not found"
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


@router.delete("/{item_id}", response_model=dict)
def delete_action_item(item_id: str, db: Session = Depends(get_db)):
    """Delete an action item task."""
    success = MeetingService.delete_action_item(db, item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item '{item_id}' not found"
        )
    return {"success": True, "message": f"Action item '{item_id}' deleted successfully"}
