from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, desc, asc, String

from app.models.meeting import (
    MeetingModel,
    TranscriptSegmentModel,
    SummaryModel,
    ActionItemModel,
    ChapterTopicModel,
    CommentHighlightModel,
)
from app.schemas.meeting import CreateMeetingRequest, UpdateMeetingRequest, CreateAnnotationRequest


class MeetingService:

    @staticmethod
    def get_meetings(
        db: Session,
        query: Optional[str] = None,
        participant: Optional[str] = None,
        date_range: Optional[str] = None,
        sort_by: Optional[str] = "date_desc",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[MeetingModel], int]:
        """Fetch list of meetings with search, filtering (title, participant, date), and recency sorting."""
        stmt = select(MeetingModel).options(
            joinedload(MeetingModel.segments),
            joinedload(MeetingModel.action_items)
        )

        # Search filter (Title or Participant match)
        if query and query.strip():
            search_pattern = f"%{query.strip()}%"
            stmt = stmt.where(
                or_(
                    MeetingModel.title.ilike(search_pattern),
                    MeetingModel.participants.cast(String).ilike(search_pattern)
                )
            )

        # Participant filter
        if participant and participant.strip():
            stmt = stmt.where(MeetingModel.participants.cast(String).ilike(f"%{participant.strip()}%"))

        # Date range filter
        now = datetime.utcnow()
        if date_range == "7days":
            seven_days_ago = now - timedelta(days=7)
            stmt = stmt.where(MeetingModel.date >= seven_days_ago)
        elif date_range == "30days":
            thirty_days_ago = now - timedelta(days=30)
            stmt = stmt.where(MeetingModel.date >= thirty_days_ago)
        elif date_range == "older":
            thirty_days_ago = now - timedelta(days=30)
            stmt = stmt.where(MeetingModel.date < thirty_days_ago)

        # Sorting
        if sort_by == "date_asc":
            stmt = stmt.order_by(asc(MeetingModel.date))
        elif sort_by == "duration_desc":
            stmt = stmt.order_by(desc(MeetingModel.duration_seconds))
        elif sort_by == "duration_asc":
            stmt = stmt.order_by(asc(MeetingModel.duration_seconds))
        else: # Default: date_desc (recency)
            stmt = stmt.order_by(desc(MeetingModel.date))

        # Count total matches before pagination
        count_stmt = select(MeetingModel.id)
        if query and query.strip():
            search_pattern = f"%{query.strip()}%"
            count_stmt = count_stmt.where(or_(MeetingModel.title.ilike(search_pattern), MeetingModel.participants.cast(String).ilike(search_pattern)))
        if participant and participant.strip():
            count_stmt = count_stmt.where(MeetingModel.participants.cast(String).ilike(f"%{participant.strip()}%"))
        if date_range == "7days":
            count_stmt = count_stmt.where(MeetingModel.date >= (now - timedelta(days=7)))
        elif date_range == "30days":
            count_stmt = count_stmt.where(MeetingModel.date >= (now - timedelta(days=30)))
        elif date_range == "older":
            count_stmt = count_stmt.where(MeetingModel.date < (now - timedelta(days=30)))

        total = len(db.scalars(count_stmt).all())

        # Pagination
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        meetings = db.scalars(stmt).unique().all()
        return meetings, total

    @staticmethod
    def get_meeting_by_id(db: Session, meeting_id: str) -> Optional[MeetingModel]:
        """Fetch single detailed meeting with all related entities."""
        stmt = (
            select(MeetingModel)
            .where(MeetingModel.id == meeting_id)
            .options(
                joinedload(MeetingModel.segments),
                joinedload(MeetingModel.summary),
                joinedload(MeetingModel.action_items),
                joinedload(MeetingModel.chapters),
                joinedload(MeetingModel.comments),
            )
        )
        return db.scalars(stmt).first()

    @staticmethod
    def create_meeting(db: Session, payload: CreateMeetingRequest) -> MeetingModel:
        """Create new meeting entry."""
        meeting = MeetingModel(
            title=payload.title,
            date=payload.date or datetime.utcnow(),
            duration_seconds=0,
            audio_url=payload.audioUrl or "/static/audio/sample_meeting_1.wav",
            participants=[{"name": p, "email": f"{p.lower().replace(' ', '.')}@company.com"} for p in payload.participants]
        )
        db.add(meeting)
        db.flush()

        if payload.rawTranscriptText:
            lines = [line.strip() for line in payload.rawTranscriptText.split('\n') if line.strip()]
            speakers = [p["name"] for p in meeting.participants] or ["Speaker 1", "Speaker 2"]
            current_time = 0.0

            for idx, line in enumerate(lines):
                speaker = speakers[idx % len(speakers)]
                duration = max(3.0, len(line.split()) * 0.4)
                segment = TranscriptSegmentModel(
                    meeting_id=meeting.id,
                    start_time=current_time,
                    end_time=current_time + duration,
                    speaker_name=speaker,
                    text=line,
                    sequence_order=idx + 1
                )
                db.add(segment)
                current_time += duration + 1.0

            meeting.duration_seconds = int(current_time)

            summary = SummaryModel(
                meeting_id=meeting.id,
                overview=f"Discussion covering {payload.title}. Key decisions and action steps reviewed.",
                key_takeaways=["Reviewed roadmap priorities.", "Assigned ownership for execution."],
                discussion_bullets=lines[:3]
            )
            db.add(summary)

            action_item = ActionItemModel(
                meeting_id=meeting.id,
                text="Follow up on discussion items and sync next week.",
                assignee_name=speakers[0],
                completed=False,
                priority="medium"
            )
            db.add(action_item)

        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def update_meeting(db: Session, meeting_id: str, payload: UpdateMeetingRequest) -> Optional[MeetingModel]:
        """Update meeting metadata."""
        meeting = db.query(MeetingModel).filter(MeetingModel.id == meeting_id).first()
        if not meeting:
            return None

        if payload.title is not None:
            meeting.title = payload.title
        if payload.participants is not None:
            meeting.participants = [{"name": p, "email": f"{p.lower().replace(' ', '.')}@company.com"} for p in payload.participants]

        meeting.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(meeting)
        return meeting

    @staticmethod
    def delete_meeting(db: Session, meeting_id: str) -> bool:
        """Delete meeting and cascade delete all associated content."""
        meeting = db.query(MeetingModel).filter(MeetingModel.id == meeting_id).first()
        if not meeting:
            return False

        db.delete(meeting)
        db.commit()
        return True

    @staticmethod
    def add_action_item(
        db: Session,
        meeting_id: str,
        text: str,
        assignee_name: Optional[str] = None,
        priority: str = "medium"
    ) -> Optional[ActionItemModel]:
        """Add a new action item task to a meeting."""
        meeting = db.query(MeetingModel).filter(MeetingModel.id == meeting_id).first()
        if not meeting:
            return None

        action_item = ActionItemModel(
            meeting_id=meeting_id,
            text=text,
            assignee_name=assignee_name,
            completed=False,
            priority=priority
        )
        db.add(action_item)
        db.commit()
        db.refresh(action_item)
        return action_item

    @staticmethod
    def update_action_item(
        db: Session,
        item_id: str,
        completed: Optional[bool] = None,
        text: Optional[str] = None,
        assignee_name: Optional[str] = None,
    ) -> Optional[ActionItemModel]:
        """Update an action item task in SQLite database."""
        item = db.query(ActionItemModel).filter(ActionItemModel.id == item_id).first()
        if not item:
            return None

        if completed is not None:
            item.completed = completed
        if text is not None:
            item.text = text
        if assignee_name is not None:
            item.assignee_name = assignee_name

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_action_item(db: Session, item_id: str) -> bool:
        """Delete an action item task."""
        item = db.query(ActionItemModel).filter(ActionItemModel.id == item_id).first()
        if not item:
            return False

        db.delete(item)
        db.commit()
        return True

    @staticmethod
    def search_global(db: Session, query: str, limit: int = 30) -> dict:
        """Search across all stored meetings, transcript segments, summaries, and action items."""
        if not query or not query.strip():
            return {"query": "", "total": 0, "results": []}

        q = query.strip()
        pattern = f"%{q}%"
        results = []

        # 1. Meetings (Title or Participants)
        meeting_stmt = (
            select(MeetingModel)
            .where(
                or_(
                    MeetingModel.title.ilike(pattern),
                    MeetingModel.participants.cast(String).ilike(pattern)
                )
            )
            .order_by(desc(MeetingModel.date))
            .limit(10)
        )
        matched_meetings = db.scalars(meeting_stmt).all()
        for m in matched_meetings:
            participants_str = ", ".join(
                [p.get("name", "") if isinstance(p, dict) else str(p) for p in (m.participants or [])]
            )
            results.append({
                "id": f"meeting-{m.id}",
                "type": "meeting",
                "meetingId": m.id,
                "meetingTitle": m.title,
                "date": m.date.isoformat() if m.date else None,
                "snippet": f"Participants: {participants_str}" if participants_str else m.title,
            })

        # 2. Transcript Segments
        seg_stmt = (
            select(TranscriptSegmentModel, MeetingModel)
            .join(MeetingModel, TranscriptSegmentModel.meeting_id == MeetingModel.id)
            .where(
                or_(
                    TranscriptSegmentModel.text.ilike(pattern),
                    TranscriptSegmentModel.speaker_name.ilike(pattern)
                )
            )
            .order_by(desc(MeetingModel.date))
            .limit(15)
        )
        matched_segments = db.execute(seg_stmt).all()
        for seg, m in matched_segments:
            results.append({
                "id": f"segment-{seg.id}",
                "type": "transcript",
                "meetingId": m.id,
                "meetingTitle": m.title,
                "segmentId": seg.id,
                "speakerName": seg.speaker_name,
                "startTime": seg.start_time,
                "endTime": seg.end_time,
                "snippet": seg.text,
                "date": m.date.isoformat() if m.date else None,
            })

        # 3. Summaries
        sum_stmt = (
            select(SummaryModel, MeetingModel)
            .join(MeetingModel, SummaryModel.meeting_id == MeetingModel.id)
            .where(
                or_(
                    SummaryModel.overview.ilike(pattern),
                    SummaryModel.key_takeaways.cast(String).ilike(pattern),
                    SummaryModel.discussion_bullets.cast(String).ilike(pattern)
                )
            )
            .order_by(desc(MeetingModel.date))
            .limit(10)
        )
        matched_summaries = db.execute(sum_stmt).all()
        for s, m in matched_summaries:
            snippet = s.overview
            if s.key_takeaways:
                for k in (s.key_takeaways or []):
                    if q.lower() in str(k).lower():
                        snippet = f"Key Takeaway: {k}"
                        break
            results.append({
                "id": f"summary-{s.id}",
                "type": "summary",
                "meetingId": m.id,
                "meetingTitle": m.title,
                "snippet": snippet,
                "date": m.date.isoformat() if m.date else None,
            })

        # 4. Action Items
        action_stmt = (
            select(ActionItemModel, MeetingModel)
            .join(MeetingModel, ActionItemModel.meeting_id == MeetingModel.id)
            .where(
                or_(
                    ActionItemModel.text.ilike(pattern),
                    ActionItemModel.assignee_name.ilike(pattern)
                )
            )
            .order_by(desc(MeetingModel.date))
            .limit(10)
        )
        matched_actions = db.execute(action_stmt).all()
        for act, m in matched_actions:
            assignee_info = f" (Assignee: {act.assignee_name})" if act.assignee_name else ""
            results.append({
                "id": f"action-{act.id}",
                "type": "action_item",
                "meetingId": m.id,
                "meetingTitle": m.title,
                "actionItemId": act.id,
                "assigneeName": act.assignee_name,
                "completed": act.completed,
                "snippet": f"{act.text}{assignee_info}",
                "date": m.date.isoformat() if m.date else None,
            })

        return {
            "query": query,
            "total": len(results),
            "results": results[:limit]
        }

    @staticmethod
    def add_annotation(
        db: Session,
        meeting_id: str,
        payload: CreateAnnotationRequest
    ) -> Optional[CommentHighlightModel]:
        """Create a new highlight or comment annotation attached to a meeting segment."""
        meeting = db.query(MeetingModel).filter(MeetingModel.id == meeting_id).first()
        if not meeting:
            return None

        # Verify segment belongs to this meeting
        segment = db.query(TranscriptSegmentModel).filter(
            TranscriptSegmentModel.id == payload.segmentId,
            TranscriptSegmentModel.meeting_id == meeting_id
        ).first()
        if not segment:
            return None

        annotation = CommentHighlightModel(
            meeting_id=meeting_id,
            segment_id=payload.segmentId,
            selected_text=payload.selectedText,
            start_offset=payload.startOffset or 0,
            end_offset=payload.endOffset or 0,
            comment_text=payload.commentText or "",
            color_code=payload.colorCode or "#6366F1",
            annotation_type=payload.annotationType or "highlight",
            author_name=payload.authorName or "Daksh Sachdeva",
        )
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        return annotation

    @staticmethod
    def update_annotation(
        db: Session,
        annotation_id: str,
        color_code: Optional[str] = None,
        comment_text: Optional[str] = None,
    ) -> Optional[CommentHighlightModel]:
        """Update an existing annotation (color_code or comment_text) in place."""
        annotation = db.query(CommentHighlightModel).filter(CommentHighlightModel.id == annotation_id).first()
        if not annotation:
            return None

        if color_code is not None:
            annotation.color_code = color_code
        if comment_text is not None:
            annotation.comment_text = comment_text

        db.commit()
        db.refresh(annotation)
        return annotation

    @staticmethod
    def delete_annotation(db: Session, annotation_id: str) -> bool:
        """Delete an annotation entry."""
        annotation = db.query(CommentHighlightModel).filter(CommentHighlightModel.id == annotation_id).first()
        if not annotation:
            return False

        db.delete(annotation)
        db.commit()
        return True

    @staticmethod
    def ensure_example_highlights(db: Session) -> dict:
        """Idempotently seed 1 example highlight per existing meeting if the meeting has 0 annotations."""
        meetings = db.query(MeetingModel).all()
        if not meetings:
            return {"seeded_count": 0, "exceptions": []}

        seeded_count = 0
        exceptions = []
        palette_colors = ["#F59E0B", "#3B82F6", "#10B981", "#EC4899"]

        for idx, m in enumerate(meetings):
            existing_count = db.query(CommentHighlightModel).filter(
                CommentHighlightModel.meeting_id == m.id
            ).count()
            if existing_count > 0:
                continue

            segments = db.query(TranscriptSegmentModel).filter(
                TranscriptSegmentModel.meeting_id == m.id
            ).order_by(TranscriptSegmentModel.sequence_order).all()

            if not segments:
                exceptions.append(f"Meeting '{m.id}' has no transcript segments to highlight.")
                continue

            target_segment = None
            for seg in segments:
                if seg.text and len(seg.text.strip()) >= 15:
                    target_segment = seg
                    break

            if not target_segment:
                exceptions.append(f"Meeting '{m.id}' has no usable transcript text.")
                continue

            full_text = target_segment.text.strip()
            period_idx = full_text.find(".")
            if period_idx > 10:
                selected_text = full_text[:period_idx + 1]
            else:
                selected_text = full_text[:min(80, len(full_text))]

            start_offset = full_text.find(selected_text)
            if start_offset < 0:
                start_offset = 0
            end_offset = start_offset + len(selected_text)

            color = palette_colors[idx % len(palette_colors)]

            example_annotation = CommentHighlightModel(
                meeting_id=m.id,
                segment_id=target_segment.id,
                selected_text=selected_text,
                start_offset=start_offset,
                end_offset=end_offset,
                comment_text="Example highlight demonstrating transcript annotation.",
                color_code=color,
                annotation_type="highlight",
                author_name="Example Highlight",
            )
            db.add(example_annotation)
            seeded_count += 1

        if seeded_count > 0:
            db.commit()

        return {"seeded_count": seeded_count, "exceptions": exceptions}



