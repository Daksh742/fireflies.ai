from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("", response_model=dict)
def global_search(
    q: Optional[str] = Query(None, description="Search query across meetings, transcripts, summaries, and action items"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Full-text global search across all meetings, transcripts, summaries, and action items."""
    return MeetingService.search_global(db, query=q or "", limit=limit)
