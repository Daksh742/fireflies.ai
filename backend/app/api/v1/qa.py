from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.qa import AskQuestionRequest, AskQuestionResponse
from app.services.qa_service import QAService

router = APIRouter(prefix="/meetings", tags=["AI Q&A"])


@router.post("/{meeting_id}/ask", response_model=AskQuestionResponse)
def ask_meeting_question(
    meeting_id: str,
    payload: AskQuestionRequest,
    db: Session = Depends(get_db)
):
    """Ask a question about a specific meeting and receive a response grounded in transcript/summary data."""
    clean_question = payload.question.strip()
    if not clean_question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty or whitespace only."
        )

    result = QAService.ask_question(db, meeting_id, clean_question, history=payload.history)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found."
        )

    return result
