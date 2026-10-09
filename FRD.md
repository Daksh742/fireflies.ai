# Functional Requirements Document (FRD)

## 1. Purpose and status

This document describes functional behavior found in the supplied Fireflies Meeting Intelligence source archive for the Scaler SDE Fullstack assignment. It is source-inspection based except where verification is explicitly stated. The assignment PDF defines required versus optional scope. Status meanings are defined in [FEATURES.md](FEATURES.md).

- **Verified:** exercised by a test or runtime check during the audit.
- **Implemented — unverified:** relevant implementation exists, but this audit did not confirm complete behavior end to end.
- **Partially implemented:** only part of the expected behavior exists or a limitation prevents the full requirement.
- **Planned:** not found as implemented.
- **Not applicable:** outside assignment scope.

## 2. User-facing functional requirements

### FR-01 — Meeting library

- **Purpose:** let a user browse saved meetings and navigate to their workspaces.
- **User actions:** open `/meetings`; search by title/participant; select participant/date filter and sort; switch grid/list; open a meeting; open create/import modal.
- **System behavior:** the frontend calls `GET /api/v1/meetings` and renders returned items, summary statistics, loading/error/empty states, and cards/rows. API accepts page and limit, but the UI call inspected does not pass pagination state or expose page navigation.
- **Input:** optional `q`, `participant`, `date_range`, `sort`, `page`, `limit` query parameters.
- **Output:** `{ items, total, page, limit }`; each item includes meeting ID/title/date/duration/audio/video URLs/participants/timestamps/counts.
- **Validation/errors:** page >= 1; limit 1–100; invalid values are rejected by FastAPI with 422. Network/API errors are caught and a retry action is displayed.
- **Acceptance:** meeting list loads, filters and sort produce expected rows, empty results can be cleared, and a row opens the corresponding meeting. **Status:** Implemented — unverified (API list behavior was part of supplied historical audit notes; not re-executed in this audit).

### FR-02 — Meeting creation/import

- **Purpose:** add a meeting and optionally create transcript-backed demo content.
- **User actions:** enter required title, comma-separated participants, optional pasted transcript text; submit the modal.
- **System behavior:** frontend posts JSON to `POST /api/v1/meetings`. Backend creates a meeting and defaults its audio URL to the shared sample WAV. If `rawTranscriptText` is non-empty, each non-empty line becomes a segment; speaker names rotate through participant names; duration is estimated from word count; a template summary and one default action item are created.
- **Input:** `title` string; optional ISO datetime `date`; `participants` array of strings; optional `rawTranscriptText`; optional `audioUrl`.
- **Output:** 201 and full meeting detail response.
- **Validation/errors:** title is required/non-whitespace; route returns 400 for empty title. Other Pydantic type/schema errors may return 422. The frontend shows an inline error on failure and success toast on completion.
- **Acceptance:** meeting appears in library and detail endpoint returns persisted data. Timestamp/audio relationship must be understood as synthetic, not actual transcription. **Status:** Implemented — unverified.

### FR-03 — Meeting detail workspace

- **Purpose:** view meeting metadata and related transcript/notes.
- **User actions:** open `/meetings/{id}`; inspect summary, transcript, tasks, chapters, and annotations.
- **System behavior:** frontend fetches `GET /api/v1/meetings/{meeting_id}` and displays meeting header, smart-notes tabs/panel, transcript panel, and audio dock. 404 uses Next.js `notFound()`; other errors show retry UI.
- **Input:** path `meeting_id`.
- **Output:** meeting metadata plus `segments`, `summary`, `actionItems`, `chapters`, and `comments` arrays/object.
- **Validation/errors:** unknown ID returns 404. Frontend has loading/error handling.
- **Acceptance:** a known meeting renders all persisted child content; unknown ID produces not-found behavior. **Status:** Implemented — unverified (historical notes supplied for the task report a successful detail response, but this audit did not repeat the runtime request).

### FR-04 — Transcript display, search, and seeking

- **Purpose:** let users navigate transcript content by speaker and timestamp.
- **User actions:** read transcript segments, search within transcript, select a segment, use player seek bar, navigate chapters.
- **System behavior:** transcript segments have start/end seconds, speaker, text, and sequence order. `useAudioPlayer` updates current time from HTML audio events; `seekTo()` clamps the target and attempts playback. Transcript panel receives current time and playback state for active-segment feedback. Deep links may include `?time=` to seek.
- **Input:** transcript search string; selected segment/chapter timestamp; media seek target.
- **Output:** filtered/highlighted transcript matches and synchronized player position/active segment.
- **Validation/errors:** seek target is clamped to non-negative and effective duration; browser playback may fail if media cannot load or playback is blocked. No real speech alignment is generated for pasted transcript text.
- **Acceptance:** clicking a segment moves player time; player progress updates the active segment; search highlights matching text; chapters seek to their start times. **Status:** Implemented — unverified; audio synchronization requires browser testing.

### FR-05 — Summary and chapters

- **Purpose:** provide a compact overview and navigable topic outline.
- **User actions:** read overview/takeaways/discussion bullets; choose a chapter.
- **System behavior:** summary is returned from the one-to-one summary relation; chapters are ordered by start time in the ORM relationship. Pasted-text creation creates a template overview/takeaways and uses the first three transcript lines as discussion bullets.
- **Input:** persisted summary and chapter data.
- **Output:** summary object or `null`; chapters array.
- **Validation/errors:** empty child data is represented as null/empty arrays in detail response. No AI summary generation is implied by the template path.
- **Acceptance:** persisted summary and chapters render and chapter selection seeks to the relevant time. **Status:** Implemented — unverified.

### FR-06 — Action item management

- **Purpose:** track meeting follow-up tasks.
- **User actions:** add an action item; edit text/assignee; toggle completion; delete item.
- **System behavior:** create endpoint adds item to meeting; PATCH updates provided `completed`, `text`, and/or `assigneeName`; DELETE removes item. Changes are persisted via SQLAlchemy.
- **Input:** create body is a JSON object with non-empty `text`, optional `assigneeName`, optional `priority` (default `medium`). PATCH body is a dictionary with any of `completed`, `text`, `assigneeName`.
- **Output:** action item object with `id`, `meetingId`, `text`, `assigneeName`, `completed`, `priority`, `dueDate`; delete returns success/message.
- **Validation/errors:** blank create text returns 400; missing meeting/item returns 404; malformed JSON or incompatible typed fields may return 422, though PATCH currently uses a plain dictionary and has limited schema validation.
- **Acceptance:** add/edit/complete/delete survives a fresh detail request. **Status:** Implemented — unverified.

### FR-07 — Meeting metadata management

- **Purpose:** rename a meeting and update participants or delete the meeting.
- **User actions:** edit title/participants from meeting header; confirm deletion.
- **System behavior:** PATCH changes title and/or participant list; DELETE removes meeting. ORM relationships specify cascade delete-orphan for child records.
- **Input:** `PATCH` body with optional `title` and/or `participants` list of strings.
- **Output:** update returns `{ id, title, participants, updatedAt }`; delete returns `{ success, message }`.
- **Validation/errors:** missing meeting returns 404; Pydantic may return 422 for incompatible request types. Explicit non-empty validation on update title is not present in the route/service.
- **Acceptance:** metadata persists and deletion removes related meeting content. **Status:** Implemented — unverified.

### FR-08 — Transcript annotations

- **Purpose:** attach comments/highlights to transcript segments.
- **User actions:** select transcript text, create a highlight/comment, change color or comment text, delete annotation.
- **System behavior:** create verifies the meeting and that the segment belongs to it; update changes `colorCode` and/or `commentText`; delete removes the annotation. Detail response returns annotation metadata.
- **Input:** create body includes `segmentId`; optional `selectedText`, `startOffset`, `endOffset`, `commentText`, `annotationType`, `colorCode`, `authorName`. Update body accepts `colorCode` and/or `commentText`.
- **Output:** annotation object or `{ success, message }`.
- **Validation/errors:** missing meeting/segment and missing annotation return 404. Request validation errors may return 422.
- **Acceptance:** annotations persist and appear after detail reload. **Status:** Implemented — unverified.

### FR-09 — Global search

- **Purpose:** discover content across meetings.
- **User actions:** open global search and enter a query.
- **System behavior:** `GET /api/v1/search?q=...` searches meeting title/participants, transcript text/speaker, summary overview/takeaways/discussion bullets, and action-item text/assignee. Results are typed as meeting, transcript, summary, or action item.
- **Input:** optional `q`; `limit` from 1 to 100 (default 30).
- **Output:** `{ query, total, results }`, where each result includes a type, meeting ID/title, snippet and relevant entity fields.
- **Validation/errors:** invalid limit returns 422. Empty query returns no results. Search is SQL `LIKE`-style matching, not a dedicated full-text index.
- **Acceptance:** query returns matching records with links to relevant meeting/time. **Status:** Implemented — unverified.

### FR-10 — Meeting-specific Q&A

- **Purpose:** answer questions grounded in a meeting's available notes/transcript.
- **User actions:** submit a question and optional prior chat history.
- **System behavior:** trims the question; handles greetings/gratitude and selected out-of-scope patterns; tries OpenAI Chat Completions when `OPENAI_API_KEY` is set; otherwise uses deterministic local retrieval/extraction. Response includes `meetingId`, `question`, `answer`, `found`, `sources`, and `timestamp`.
- **Input:** `{ "question": string, "history"?: [{"role":"user"|"assistant", "content": string}] }`; schema max question length 1000.
- **Output:** structured answer with optional source excerpts containing segment ID, speaker, timestamps, and text.
- **Validation/errors:** empty/whitespace-only question returns 400; unknown meeting returns 404; Pydantic length/type errors return 422; a meeting without transcript/summary/action items returns a not-found-style answer with HTTP 200.
- **Acceptance:** supported question returns a grounded answer/source where available; unsupported query is handled; fallback works without key. **Status:** Verified for the nine Q&A test cases executed in this audit; external OpenAI integration not tested.

### FR-11 — Export

- **Purpose:** let users save transcript or summary outside the app.
- **User actions:** select transcript or summary; choose TXT, Markdown, or PDF; toggle content options; export.
- **System behavior:** `frontend/src/lib/exportUtils.ts` provides client-side export functions called by `ExportMenu.tsx`.
- **Input:** current meeting detail, export type/format, selected inclusion options.
- **Output:** downloaded file generated in browser.
- **Validation/errors:** no backend endpoint is involved; browser download/PDF output has not been validated during this audit.
- **Acceptance:** generated file opens and reflects selected options. **Status:** Implemented — unverified.

### FR-12 — Theme and notifications

- **Purpose:** provide basic appearance and operation feedback.
- **System behavior:** theme is persisted under `fireflies_theme` in browser `localStorage`; notification history uses `fireflies_notification_history`; toast messages auto-dismiss after 3.5 seconds. This state is not backend-persisted.
- **Acceptance:** theme survives reload in same browser; toast appears/dismisses; notifications can be marked read/cleared. **Status:** Implemented — unverified.

## 3. API functional specification

Base path: `/api/v1`. JSON routes use FastAPI/Pydantic; exact live schema is exposed at `/api/v1/openapi.json` when the backend is running. No endpoint beyond the Q&A suite was re-tested during this audit, so non-Q&A status below is source-inspection only.

### 3.1 Health

| Method / route | `GET /health` |
|---|---|
| Purpose | Report API status and attempt `SELECT 1` against configured database |
| Query/body | None |
| Success response | `{ "status": "online", "project": string, "version": "1.0.0", "database": "healthy" | "unhealthy: ..." }` |
| Status codes | Normally 200; code does not explicitly change HTTP status on database failure |
| Error cases | DB failure is represented in `database` text; details may be exposed in response |
| Verification | Not rerun in this audit |

### 3.2 Meetings list

| Field | Specification |
|---|---|
| Method / route | `GET /meetings` |
| Query | `q` optional title/participant search; `participant` optional name filter; `date_range` optional `7days`, `30days`, `older`; `sort` optional `date_desc` (default), `date_asc`, `duration_desc`, `duration_asc`; `page` integer >= 1 (default 1); `limit` integer 1–100 (default 20) |
| Request body | None |
| Success | `{ "items": [MeetingSummary], "total": number, "page": number, "limit": number }` |
| MeetingSummary fields | `id`, `title`, `date`, `durationSeconds`, `audioUrl`, `videoUrl`, `participants`, `createdAt`, `updatedAt`, `segmentsCount`, `actionItemsCount`, `pendingActionItemsCount` |
| Status codes | 200; 422 for invalid constrained query values |
| Errors/notes | Unknown `date_range`/`sort` strings are not explicitly rejected; they fall through to default behavior. Search uses title/participants only at list level. |
| Verification | Historical audit notes reported expected filtering/pagination; not freshly rerun |

### 3.3 Meeting detail

| Field | Specification |
|---|---|
| Method / route | `GET /meetings/{meeting_id}` |
| Query/body | None |
| Success | Meeting summary fields plus `segments`, `summary`, `actionItems`, `chapters`, `comments` |
| Segment fields | `id`, `meetingId`, `startTime`, `endTime`, `speakerName`, `speakerAvatar`, `text`, `sequenceOrder` |
| Summary fields | `id`, `meetingId`, `overview`, `keyTakeaways`, `discussionBullets`; `summary` may be `null` |
| Action item fields | `id`, `meetingId`, `text`, `assigneeName`, `completed`, `priority`, `dueDate` |
| Chapter fields | `id`, `meetingId`, `title`, `startTime`, `summarySnippet` |
| Annotation fields | `id`, `meetingId`, `segmentId`, `selectedText`, `startOffset`, `endOffset`, `commentText`, `colorCode`, `annotationType`, `authorName`, `createdAt` |
| Status codes | 200; 404 when meeting is missing |
| Verification | Historical audit notes reported detail data; not freshly rerun |

### 3.4 Create meeting

| Field | Specification |
|---|---|
| Method / route | `POST /meetings` |
| Request | `{ "title": string, "date"?: datetime, "participants"?: string[], "rawTranscriptText"?: string, "audioUrl"?: string }` |
| Success | 201 and full meeting detail response |
| Behavior | Defaults audio URL to `/static/audio/sample_meeting_1.wav`. When transcript text is supplied, splits non-empty lines into segments, rotates speaker names, estimates durations from word counts, and creates template summary plus one action item. |
| Status codes | 201; 400 for missing/blank title; 422 for schema/type errors |
| Validation caveat | Route checks title non-empty; segment timestamps are estimates and no audio transcription is performed. |
| Verification | Not freshly tested |

### 3.5 Update/delete meeting

| Method / route | Request | Success | Errors |
|---|---|---|---|
| `PATCH /meetings/{meeting_id}` | `{ "title"?: string, "participants"?: string[] }` | `{ id, title, participants, updatedAt }` | 404 missing meeting; 422 invalid body |
| `DELETE /meetings/{meeting_id}` | No body | `{ "success": true, "message": string }` | 404 missing meeting |

Update does not explicitly reject an empty title. Delete is intended to cascade to related ORM relationships. Neither operation was freshly tested in this audit.

### 3.6 Action items

| Method / route | Request | Success | Errors |
|---|---|---|---|
| `POST /meetings/{meeting_id}/action-items` | `{ "text": string, "assigneeName"?: string, "priority"?: string }` | 201 action item object | 400 blank text; 404 missing meeting; 422 invalid JSON/type |
| `PATCH /action-items/{item_id}` | Dictionary with optional `completed`, `text`, `assigneeName` | Updated action item object | 404 missing item; malformed/incompatible data may return 422 or trigger service/database errors |
| `DELETE /action-items/{item_id}` | No body | `{ "success": true, "message": string }` | 404 missing item |

The create/PATCH endpoints use plain dictionaries rather than dedicated Pydantic request schemas, limiting explicit field validation. Priority and due date are returned; PATCH route does not currently update priority/due date.

### 3.7 Annotations

| Method / route | Request | Success | Errors |
|---|---|---|---|
| `POST /meetings/{meeting_id}/annotations` | `{ "segmentId": string, "selectedText"?: string, "startOffset"?: integer, "endOffset"?: integer, "commentText"?: string, "annotationType"?: string, "colorCode"?: string, "authorName"?: string }` | 201 annotation object | 404 missing meeting or segment |
| `PATCH /meetings/{meeting_id}/annotations/{annotation_id}` | `{ "colorCode"?: string, "commentText"?: string }` | Updated annotation object | 404 missing annotation |
| `DELETE /meetings/{meeting_id}/annotations/{annotation_id}` | No body | `{ "success": true, "message": string }` | 404 missing annotation |

Legacy routes also exist for `PATCH /meetings/annotations/{annotation_id}` and `DELETE /meetings/annotations/{annotation_id}`. In the current handler, update/delete operate by annotation ID; the optional meeting ID path value is not used to constrain the record. The UI uses meeting-scoped routes. Annotation routes were not freshly tested.

### 3.8 Global search

| Field | Specification |
|---|---|
| Method / route | `GET /search` |
| Query | `q` optional; `limit` integer 1–100, default 30 |
| Success | `{ "query": string, "total": number, "results": [...] }` |
| Result types | `meeting`, `transcript`, `summary`, `action_item`; fields vary by type and include meeting identifiers/title, snippet and relevant timestamp/assignee/segment fields |
| Status codes | 200; 422 for invalid limit |
| Behavior | Searches title/participants, transcript text/speaker, summary text/arrays, and action item text/assignee; combines results and truncates to requested limit |
| Verification | Historical audit notes reported matching results; not freshly rerun |

### 3.9 Meeting Q&A

| Field | Specification |
|---|---|
| Method / route | `POST /meetings/{meeting_id}/ask` |
| Request | `{ "question": string (1–1000 chars), "history"?: [{ "role": string, "content": string }] }` |
| Success | `{ "meetingId": string, "question": string, "answer": string, "found": boolean, "sources": [{ "segmentId"?, "speakerName"?, "startTime"?, "endTime"?, "text": string }], "timestamp": string }` |
| Status codes | 200; 400 for blank question; 404 unknown meeting; 422 for schema/length/type validation |
| Behavior | Optional OpenAI Chat Completions when `OPENAI_API_KEY` is configured; deterministic fallback otherwise. Selected greeting/gratitude and out-of-scope patterns are handled directly. |
| Verification | **Verified:** 9/9 backend unit tests passed in this audit, including supported/unsupported questions, empty question, unknown meeting, empty transcript, suggested questions, greeting/gratitude, and follow-up history. OpenAI network call not tested. |

## 4. Cross-cutting states and validation

- **Loading:** library and meeting workspace show loading UI while requests are pending.
- **Empty:** library displays a no-results/no-meetings state; Q&A returns a no-content answer if meeting has no transcript/summary/action items.
- **Success:** mutations generally return updated records and frontend notification/toast feedback is used in visible workflows.
- **Failure:** API client wraps HTTP/network errors; library/workspace show error and retry controls; modal shows inline creation error.
- **Persistence:** meeting content and mutations are SQLite-backed. Theme and notification history are browser-local.
- **Security:** no authentication/authorization is present; assume single default user as permitted by the assignment. Production deployment must keep API keys server-side and restrict CORS.

## 5. Test and acceptance checklist

- [x] Q&A unit-test suite (9 tests) passed during this audit.
- [ ] Freshly run health endpoint and database check.
- [ ] Freshly test list filters, all sort options, and page/limit boundaries.
- [ ] Test meeting create/update/delete and child cascade behavior.
- [ ] Test action item create/update/complete/delete and validation.
- [ ] Test annotation create/update/delete and segment ownership validation.
- [ ] Test global search across each result type.
- [ ] Browser test transcript search/highlighting and transcript-player synchronization.
- [ ] Open exported TXT/Markdown/PDF files and verify selected options.
- [ ] Test frontend production build in a clean dependency install.
- [ ] Verify deployed frontend, API, audio, and durable persistence if a hosted demo is supplied.
