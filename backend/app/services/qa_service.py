import re
import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.meeting import MeetingModel, TranscriptSegmentModel
from app.schemas.qa import AskQuestionResponse, SourceExcerpt, ChatMessageSchema


class QAService:
    @staticmethod
    def ask_question(
        db: Session,
        meeting_id: str,
        question: str,
        history: Optional[List[ChatMessageSchema]] = None,
    ) -> Optional[AskQuestionResponse]:
        """Process an AI Q&A query grounded strictly in the target meeting's transcript and summary data."""
        # 1. Retrieve meeting
        meeting = db.query(MeetingModel).filter(MeetingModel.id == meeting_id).first()
        if not meeting:
            return None

        clean_question = question.strip()
        q_lower = clean_question.lower()
        timestamp_str = datetime.utcnow().isoformat()

        # 2. Intent Recognition: Greetings & Gratitude
        greeting_pattern = r"^(\s*)(hi|hello|hey|hey there|good morning|good afternoon|good evening|greetings|yo)(\s*[!.]*)?$"
        if re.match(greeting_pattern, q_lower):
            return AskQuestionResponse(
                meetingId=meeting_id,
                question=clean_question,
                answer="Hello! I can help you explore this meeting. You can ask me about its key decisions, discussion topics, participants, or action items.",
                found=True,
                sources=[],
                timestamp=timestamp_str,
            )

        gratitude_pattern = r"^(\s*)(thanks|thank you|thanks a lot|thank you so much|thx|cheers|appreciate it)(\s*[!.]*)?$"
        if re.match(gratitude_pattern, q_lower):
            return AskQuestionResponse(
                meetingId=meeting_id,
                question=clean_question,
                answer="You're welcome! Let me know if you have any other questions about this meeting.",
                found=True,
                sources=[],
                timestamp=timestamp_str,
            )

        # 3. Intent Recognition: Explicit Out-of-Scope General Knowledge Queries
        out_of_scope_patterns = [
            r"what is the capital of",
            r"who won the",
            r"what('s| is) the weather",
            r"recipe for",
            r"write a (python|javascript|code|poem|story)",
            r"translate .* to",
        ]
        if any(re.search(pattern, q_lower) for pattern in out_of_scope_patterns):
            return AskQuestionResponse(
                meetingId=meeting_id,
                question=clean_question,
                answer="I am an AI assistant focused specifically on this meeting. Please ask a question related to this meeting's discussion, transcript, action items, or key takeaways.",
                found=False,
                sources=[],
                timestamp=timestamp_str,
            )

        # 4. Check for empty transcript / summary
        segments: List[TranscriptSegmentModel] = meeting.segments or []
        summary = meeting.summary
        action_items = meeting.action_items or []

        if not segments and not summary and not action_items:
            return AskQuestionResponse(
                meetingId=meeting_id,
                question=clean_question,
                answer="No transcript or summary content is available for this meeting to answer your question.",
                found=False,
                sources=[],
                timestamp=timestamp_str,
            )

        # 5. Build context strings for LLM / Search
        context_lines = [f"Meeting Title: {meeting.title}", f"Participants: {meeting.participants}"]
        if summary:
            if summary.overview:
                context_lines.append(f"Overview: {summary.overview}")
            if summary.key_takeaways:
                context_lines.append(f"Key Takeaways: {json.dumps(summary.key_takeaways)}")
            if summary.discussion_bullets:
                context_lines.append(f"Discussion Points: {json.dumps(summary.discussion_bullets)}")

        if action_items:
            action_text = "; ".join([f"{ai.text} (assignee: {ai.assignee_name or 'Unassigned'})" for ai in action_items])
            context_lines.append(f"Action Items: {action_text}")

        context_lines.append("\nTranscript Segments:")
        for seg in segments:
            mins = int(seg.start_time // 60)
            secs = int(seg.start_time % 60)
            time_formatted = f"[{mins:02d}:{secs:02d}]"
            context_lines.append(f"{time_formatted} {seg.speaker_name}: {seg.text}")

        full_context = "\n".join(context_lines)

        # 6. Try external LLM API if key is available
        llm_response = QAService._try_llm_api(clean_question, full_context, segments, history)
        if llm_response:
            return AskQuestionResponse(
                meetingId=meeting_id,
                question=clean_question,
                answer=llm_response["answer"],
                found=llm_response["found"],
                sources=llm_response["sources"],
                timestamp=timestamp_str,
            )

        # 7. Fallback: Factual RAG & Grounded Transcript Search Algorithm
        return QAService._grounded_fallback_qa(
            meeting_id, clean_question, segments, summary, action_items, history, timestamp_str
        )

    @staticmethod
    def _try_llm_api(
        question: str,
        context: str,
        segments: List[TranscriptSegmentModel],
        history: Optional[List[ChatMessageSchema]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Call OpenAI API if environment variable API keys are configured."""
        if settings.OPENAI_API_KEY:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                }
                system_prompt = (
                    "You are an AI assistant focused specifically on the selected meeting. "
                    "Answer the user's question using ONLY the provided meeting details, transcript, and summary. "
                    "Guidelines:\n"
                    "1. Provide direct, concise answers (1-3 sentences for simple questions, structured bullets for summary/action items).\n"
                    "2. Do NOT invent facts, speakers, quotes, dates, or decisions. Do NOT claim something was agreed upon unless explicitly supported.\n"
                    "3. If a question is partially answerable, answer the supported portion and clearly state what detail is missing.\n"
                    "4. If the question cannot be answered from the meeting content, reply: 'The requested information could not be found in this meeting.'\n"
                    "5. Always reference timestamps in [MM:SS] format where available."
                )

                messages = [{"role": "system", "content": system_prompt}]
                if history:
                    for h_item in history[-4:]:
                        messages.append({"role": h_item.role, "content": h_item.content})

                messages.append(
                    {"role": "user", "content": f"Meeting Data:\n{context}\n\nQuestion: {question}"}
                )

                payload = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 400,
                }

                req = urllib.request.Request(
                    url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST"
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        answer_text = data["choices"][0]["message"]["content"].strip()
                        found = "could not be found in this meeting" not in answer_text.lower()
                        matched_sources = QAService._find_matching_sources(question, segments)
                        return {
                            "answer": answer_text,
                            "found": found,
                            "sources": matched_sources,
                        }
            except Exception as e:
                print(f"OpenAI API call failed or timed out: {e}")

        return None

    @staticmethod
    def _grounded_fallback_qa(
        meeting_id: str,
        question: str,
        segments: List[TranscriptSegmentModel],
        summary: Any,
        action_items: List[Any],
        history: Optional[List[ChatMessageSchema]],
        timestamp_str: str,
    ) -> AskQuestionResponse:
        """Deterministic grounded RAG transcript search & extraction fallback algorithm."""
        q_lower = question.lower()

        # Check if question is a follow-up ("why", "who was responsible", "tell me more", "what happened next")
        is_follow_up = any(
            phrase in q_lower
            for phrase in ["why", "tell me more", "who was responsible", "what happened next", "who did that", "can you elaborate"]
        )

        history_context_keywords = []
        if is_follow_up and history and len(history) > 0:
            last_msg = history[-1].content.lower()
            # Extract keywords from previous assistant or user message
            h_words = re.findall(r"\w+", last_msg)
            h_stop = {"here", "are", "the", "this", "that", "meeting", "and", "was", "were", "said", "with"}
            history_context_keywords = [w for w in h_words if len(w) > 3 and w not in h_stop]

        # Tokenize query keywords (exclude stop words)
        stop_words = {
            "what", "who", "where", "when", "why", "how", "is", "are", "was", "were", "the", "a", "an",
            "and", "or", "in", "on", "at", "to", "for", "of", "with", "about", "did", "does", "do",
            "tell", "me", "discuss", "discussed", "regarding", "during", "this", "meeting", "more", "next"
        }
        words = re.findall(r"\w+", q_lower)
        keywords = [w for w in words if len(w) > 2 and w not in stop_words]
        combined_keywords = list(set(keywords + history_context_keywords))

        # 1. Action Items Query
        if any(term in q_lower for term in ["action item", "task", "todo", "to-do", "assigned"]):
            if action_items:
                formatted_actions = []
                for ai in action_items:
                    assignee = f" (assigned to {ai.assignee_name})" if ai.assignee_name else ""
                    status = "✓ Done" if ai.completed else "Pending"
                    formatted_actions.append(f"• {ai.text}{assignee} [{status}]")

                return AskQuestionResponse(
                    meetingId=meeting_id,
                    question=question,
                    answer="Here are the action items identified in this meeting:\n" + "\n".join(formatted_actions),
                    found=True,
                    sources=[],
                    timestamp=timestamp_str,
                )

        # 2. Summary / Takeaways Query
        if any(term in q_lower for term in ["summary", "overview", "takeaway", "key takeaway", "highlight"]):
            if summary and (summary.overview or summary.key_takeaways):
                ans_parts = []
                if summary.overview:
                    ans_parts.append(f"**Executive Overview:**\n{summary.overview}")
                if summary.key_takeaways:
                    ans_parts.append("**Key Takeaways:**\n" + "\n".join([f"• {t}" for t in summary.key_takeaways]))

                return AskQuestionResponse(
                    meetingId=meeting_id,
                    question=question,
                    answer="\n\n".join(ans_parts),
                    found=True,
                    sources=[],
                    timestamp=timestamp_str,
                )

        # 3. Match transcript segments using keywords
        matched_segments: List[TranscriptSegmentModel] = []
        for seg in segments:
            seg_text_lower = seg.text.lower()
            speaker_lower = seg.speaker_name.lower()

            score = 0
            if combined_keywords:
                for kw in combined_keywords:
                    if kw in seg_text_lower or kw in speaker_lower:
                        score += 1
            elif question.lower() in seg_text_lower:
                score += 2

            if score > 0:
                matched_segments.append((score, seg))

        if matched_segments:
            matched_segments.sort(key=lambda item: (-item[0], item[1].sequence_order))
            top_matches = [item[1] for item in matched_segments[:3]]

            sources: List[SourceExcerpt] = []
            answer_lines = []

            for seg in top_matches:
                mins = int(seg.start_time // 60)
                secs = int(seg.start_time % 60)
                time_code = f"[{mins:02d}:{secs:02d}]"
                answer_lines.append(f"At {time_code}, **{seg.speaker_name}** said: \"{seg.text}\"")

                sources.append(
                    SourceExcerpt(
                        segmentId=seg.id,
                        speakerName=seg.speaker_name,
                        startTime=seg.start_time,
                        endTime=seg.end_time,
                        text=seg.text,
                    )
                )

            # Check for partial answer requirement (e.g. deadline or specific fact missing)
            partial_note = ""
            if any(term in q_lower for term in ["deadline", "due date", "when is it due", "budget amount"]):
                partial_note = "\n\n*Note: The transcript mentions the relevant topic above, but does not state a specific deadline or exact figure.*"

            full_answer = (
                f"Based on the meeting transcript, here is the relevant discussion:\n\n" +
                "\n\n".join(answer_lines) +
                partial_note
            )

            return AskQuestionResponse(
                meetingId=meeting_id,
                question=question,
                answer=full_answer,
                found=True,
                sources=sources,
                timestamp=timestamp_str,
            )

        # 4. Fallback if information is absent
        return AskQuestionResponse(
            meetingId=meeting_id,
            question=question,
            answer="The requested information could not be found in this meeting.",
            found=False,
            sources=[],
            timestamp=timestamp_str,
        )

    @staticmethod
    def _find_matching_sources(question: str, segments: List[TranscriptSegmentModel]) -> List[SourceExcerpt]:
        """Extract matching source excerpts for LLM response."""
        words = re.findall(r"\w+", question.lower())
        keywords = [w for w in words if len(w) > 3]
        matched: List[SourceExcerpt] = []

        for seg in segments:
            if any(kw in seg.text.lower() for kw in keywords):
                matched.append(
                    SourceExcerpt(
                        segmentId=seg.id,
                        speakerName=seg.speaker_name,
                        startTime=seg.start_time,
                        endTime=seg.end_time,
                        text=seg.text,
                    )
                )
                if len(matched) >= 3:
                    break

        return matched
