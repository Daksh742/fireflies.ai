# Product Requirements Document (PRD)

## 1. Document overview

| Field | Value |
|---|---|
| Product | Fireflies Meeting Intelligence (Fireflies.ai-inspired clone) |
| Document status | Audited draft based on supplied source archive and assignment PDF |
| Intended audience | Assignment evaluator, developer, product/design reviewers |
| Platform | Web application: Next.js frontend, FastAPI backend, SQLite persistence |
| Primary experience | Post-meeting library and transcript workspace |

This document separates assignment requirements from observed implementation. The assignment PDF is the source of truth for mandatory scope; the repository is the source of truth for implementation status. See [FEATURES.md](FEATURES.md) for evidence and status labels.

## 2. Product vision

Provide a focused workspace where a user can find recorded meetings, review timestamped transcript content, understand key takeaways, track follow-up tasks, and search across past discussions without switching between separate note-taking tools.

## 3. Problem statement

Meeting information is only useful when participants can revisit what was said and act on decisions. A usable post-meeting product needs a searchable library, readable transcript with speakers and timestamps, a summary/task view, and persistent meeting records. This assignment evaluates the quality of these workflows, the UI resemblance to Fireflies, and the design of the API and database.

## 4. Goals and success criteria

### Product goals

1. Present a meeting library with title, date, duration, and participants.
2. Provide a meeting workspace that combines transcript, media controls, summary, chapters, action items, and annotations.
3. Support meeting and task management with persistent SQLite storage.
4. Make meeting content discoverable through filtering and global search.
5. Provide understandable setup instructions and an API that can be evaluated locally.

### Measurable acceptance targets

- The API can list seeded meetings and retrieve a meeting with its related transcript and notes.
- A user can create a meeting from a title, participant list, and optional pasted transcript text.
- A user can update/delete meeting metadata/content using the API-backed UI where exposed.
- Transcript rows and the media seek bar share playback-time state.
- Action item completion and annotation changes are saved to SQLite.
- Global search can return results from meeting metadata, transcript segments, summaries, and action items.
- The backend Q&A test suite passes. The audited run passed 9/9 tests; this does not imply all acceptance targets above have been verified.

## 5. Target users and use cases

- **Individual professional:** revisits a past call and checks decisions.
- **Project/product manager:** finds a topic or participant, reviews action items, and follows up.
- **Engineer/team member:** jumps to a relevant transcript timestamp and reads context.
- **Assignment evaluator:** checks UI fidelity, API organization, persistence, data relationships, and whether the developer understands the code.

Authentication is not a target for this MVP; the assignment explicitly permits assuming a default logged-in user.

## 6. Product principles

- **Meeting-first navigation:** library and meeting detail are the primary destinations.
- **Context is connected:** transcript segments, chapters, summaries, and tasks belong to a meeting.
- **Clear provenance:** seeded and estimated transcript data must not be represented as real transcription.
- **Responsive feedback:** expose loading, empty, success, and failure states where the UI implements them.
- **Modularity:** separate UI components, API routes, schemas, service logic, and ORM models.

## 7. Scope and non-goals

### Mandatory assignment scope

- Meeting library/dashboard with title, date, duration, participants; search/filter by title/date/participant; recency sorting; profile/settings placeholders.
- Meeting detail with speaker-labelled timestamped transcript, media player/seek bar, transcript-to-player seeking and reverse active-segment feedback, transcript search/highlights.
- Summary, action items, key topics/chapters.
- Meeting create/update/delete; action item add/edit/complete; persistent meeting content.
- Fireflies-like navigation, panels, forms/modals, search/filters, notifications/toasts, settings placeholders.
- Several seeded meetings with transcripts, summaries, and action items.

### Optional assignment enhancements

Transcript comments/highlights/soundbites; export to PDF/Markdown/TXT; global search; topic tags/filtering; meeting Q&A; dark mode.

### Non-goals / explicitly mocked by assignment

Real-time call bot, real speech-to-text, Zoom/Google Meet/calendar/CRM integrations, team sharing/collaboration, and real authentication. The assignment allows placeholder sections for these. No claim is made that these integrations exist in the repository.

## 8. MVP definition

The MVP is a single-user post-meeting workspace backed by SQLite. It supports meeting discovery, transcript review, summary and task review, basic CRUD, and seeded demonstration data. Q&A may use an optional LLM provider but must have a local fallback. Audio is a sample/placeholder asset; speech-to-text is not included.

## 9. Implemented product capabilities (source inspection)

The supplied code contains implementations for the meetings library and its filters/view modes, meeting detail workspace, sample audio player, summary/chapters/action items, meeting CRUD endpoints, action item mutation endpoints, transcript annotations, global search, Q&A, client-side exports, dark/light theme, and notifications. The only freshly executed test suite during this audit was the nine backend Q&A unit tests. See [FEATURES.md](FEATURES.md) for status distinctions and caveats.

## 10. Core user journeys

### Journey A — Find a meeting

1. Open `/` and get redirected to `/meetings`.
2. Browse seeded meetings in grid or list view.
3. Search by title/participant, filter by participant/date range, and select a sort order.
4. Open a meeting workspace.

### Journey B — Review a meeting

1. Open `/meetings/{id}`.
2. Read the transcript and speaker/timestamp labels.
3. Play or seek the sample audio; select transcript segments or chapters to seek.
4. Review summary, takeaways, chapters, and action items.
5. Search transcript text and inspect or create annotations.

### Journey C — Create a meeting

1. Open the create/import modal from the meetings library.
2. Enter a title, comma-separated participants, and optional pasted transcript text.
3. Submit to `POST /api/v1/meetings`.
4. If transcript text is provided, the service splits non-empty lines into estimated segments and creates a template summary and action item. It does not transcribe audio.

### Journey D — Manage follow-ups

1. Add an action item to a meeting.
2. Change its text/assignee or completion status, or delete it.
3. Changes persist through the backend endpoints.

### Journey E — Ask a meeting question

1. Enter a question in the meeting Q&A panel.
2. The backend uses configured OpenAI if available; otherwise it uses deterministic local fallback logic.
3. The response includes a `found` flag and source excerpts where the service can identify them. Answers are intended to be grounded in the selected meeting.

## 11. Information architecture and pages

- `/` — redirects to `/meetings`.
- `/meetings` — library, summary statistics, filters, grid/list toggle, create/import modal.
- `/meetings/[id]` — meeting header, smart notes panel (summary/action items/chapters/Q&A), transcript panel, media player dock.
- Global search modal and notification popover are components within the workspace shell, not separate routes.
- Settings/profile navigation is placeholder-level UI; real account management is out of scope.

## 12. High-level system architecture

The browser renders Next.js App Router pages and React components. `frontend/src/lib/api.ts` calls the FastAPI base URL using JSON fetch requests. FastAPI routes validate input through Pydantic models (some mutation endpoints currently accept plain dictionaries), delegate persistence/query work to service classes, and use SQLAlchemy sessions for SQLite. Static audio is served by FastAPI from the configured static directory. Theme and notification history are client-local rather than database entities.

## 13. Data and persistence overview

- `MeetingModel` owns meeting metadata and relationships.
- `TranscriptSegmentModel` stores speaker, text, and start/end seconds.
- `SummaryModel` stores overview, takeaways, and discussion bullets (one summary per meeting).
- `ActionItemModel` stores text, assignee, completion, priority, and due date.
- `ChapterTopicModel` stores timestamped topics.
- `CommentHighlightModel` stores segment-linked annotations.

The SQLite database in the supplied archive contains five meeting rows and associated content. The seed script itself creates five illustrative meetings and destructively recreates the ORM tables. The source archive's database also contains `conversations` and `ai_messages` tables that are not represented in the current inspected ORM model definitions; their intended lifecycle is unresolved.

## 14. Functional requirements

| ID | Requirement | Priority | Source of truth |
|---|---|---|---|
| FR-01 | Browse meeting metadata in a library | Must have | Assignment PDF |
| FR-02 | Search/filter by title, participant, date; sort by recency | Must have | Assignment PDF |
| FR-03 | Open transcript with speakers and timestamps | Must have | Assignment PDF |
| FR-04 | Provide player controls and timestamp seeking in both directions | Must have | Assignment PDF |
| FR-05 | Search transcript and highlight matches | Must have | Assignment PDF |
| FR-06 | Display summary, takeaways, action items, chapters/topics | Must have | Assignment PDF |
| FR-07 | Create/update/delete meeting metadata and persist content | Must have | Assignment PDF |
| FR-08 | Add/edit/complete action items | Must have | Assignment PDF |
| FR-09 | Use Fireflies-like layout and feedback patterns | Must have | Assignment PDF |
| FR-10 | Seed several fully populated demonstration meetings | Must have | Assignment PDF |
| FR-11 | Annotate transcript segments | Bonus | Assignment PDF |
| FR-12 | Export transcript/summary as TXT, Markdown, PDF | Bonus | Assignment PDF |
| FR-13 | Search across all meeting content | Bonus | Assignment PDF |
| FR-14 | Ask a question about a meeting | Bonus | Assignment PDF |
| FR-15 | Toggle dark/light mode | Bonus | Assignment PDF |
| FR-16 | Real-time transcription and call integrations | Out of scope | Assignment PDF |

Implementation status and verification evidence are maintained in [FEATURES.md](FEATURES.md) and [FRD.md](FRD.md).

## 15. Non-functional requirements

- **Maintainability:** route/service/schema/model separation should be preserved.
- **Data integrity:** child records should remain associated with their meeting and be removed on meeting deletion as configured by ORM relationships.
- **Usability:** clear loading/error/empty feedback; keyboard-usable forms and accessible labels should be checked during browser QA.
- **Performance:** current assignment-sized SQLite data should support ordinary local filtering/search. No formal load/performance tests were supplied.
- **Security:** no credentials in source control; keep LLM API keys server-side; production CORS should be restricted to the real frontend origin. Authentication/authorization is not implemented.
- **Reliability:** errors should be surfaced to users; database and media paths must be configured consistently.

## 16. UX and accessibility expectations

The assignment calls for close visual resemblance to Fireflies, with library/detail navigation, transcript and summary panels, forms, modals, filters, toasts, and settings placeholders. Source includes loading/empty/error states, CSS Modules, button labels, and some ARIA attributes. Full keyboard navigation, screen-reader behavior, color contrast, and responsive behavior have not been comprehensively verified in this audit.

## 17. Technical constraints

- Next.js 14 / React 18 / TypeScript; native CSS and CSS Modules.
- Python FastAPI backend; SQLite with SQLAlchemy; Pydantic schemas.
- No real speech-to-text. Transcript input is pasted text or seeded sample data.
- Backend database/audio paths are relative to the process working directory.
- Frontend API client uses `NEXT_PUBLIC_API_BASE_URL`; Next.js rewrite uses a different variable (`NEXT_PUBLIC_API_URL`).
- Optional OpenAI integration is present in Q&A service; local fallback is provided.

## 18. Risks and assumptions

- **Mock data risk:** seeded transcripts, summaries, and action items are illustrative and should not be mistaken for actual meeting artifacts.
- **Timestamp risk:** raw-text timestamps are estimated by line length and are not aligned to real speech.
- **Audio mismatch:** multiple seeded meetings reference one sample WAV file.
- **Persistence risk:** SQLite on ephemeral deployment storage may not survive restarts.
- **Configuration risk:** API URL variable mismatch may cause a deployment to call the wrong origin unless configured correctly.
- **Authentication assumption:** single-user/default-user operation is acceptable for the assignment.
- **LLM availability:** Q&A quality and behavior differ between external LLM and deterministic fallback modes.
- **Audit coverage:** only the Q&A test suite was freshly executed; other claims need broader tests.

## 19. Known limitations

No real transcription, live meeting bot, external integrations, team collaboration, or authentication. Transcript timestamps for manually pasted content are estimates. Seeded audio is shared placeholder media. Browser-local theme and notification state are not synced across devices. Generated `.next-build` artifacts are included in the supplied archive. Relative paths and API environment variable mismatch need attention before deployment. A few database tables in the included SQLite file are not represented by the inspected ORM definitions.

## 20. Future improvements

1. Add tests for all CRUD/search/annotation endpoints and browser-driven flows.
2. Correct API URL configuration so local and production behavior use one documented variable.
3. Add schema migrations and move to absolute/configured data paths for deployments.
4. Improve validation with explicit Pydantic request schemas for action-item mutation endpoints.
5. Add real pagination controls to the UI if full multi-page browsing is required; verify current page state handling.
6. Improve transcript import formats and clearly label estimated timestamps.
7. Add accessible keyboard/focus behavior and responsive-layout regression checks.
8. Remove generated build output from version control and clarify extra SQLite tables.
9. Add a verified hosted demo with persistent storage and secure environment configuration.

## 21. Acceptance criteria

- [ ] Seed script creates multiple meetings with transcript, summary, action items, and chapters.
- [ ] Meeting list supports expected search, filters, sorting, and pagination at the API level.
- [ ] Meeting detail endpoint returns related transcript, summary, tasks, chapters, and annotations.
- [ ] Transcript search highlights matches and clicking a segment seeks the audio player.
- [ ] Player state highlights the active transcript segment during playback.
- [ ] Meeting create/update/delete persists correctly and cascades related data on delete.
- [ ] Action items can be added, edited, completed, and deleted with persisted state.
- [ ] Annotation create/update/delete persists correctly and validates segment ownership.
- [ ] Global search returns relevant results from supported entity types.
- [ ] Q&A answers meeting-grounded questions, handles empty/out-of-scope queries, and has working fallback behavior.
- [ ] TXT/Markdown/PDF exports produce valid files for transcripts and summaries.
- [ ] Dark/light theme persists in browser storage; notifications/toasts provide useful feedback.
- [ ] Backend tests pass and frontend production build succeeds in a clean environment.
- [ ] Hosted demo is tested for frontend/API connectivity, audio, and persistent storage before its URL is submitted.

Only the Q&A unit-test acceptance slice was verified during this audit; remaining checkboxes require additional testing.
