# Project Structure — Complete File Inventory

This tree is generated from the supplied project folder. Python cache files and the generated Next.js `.next-build/` output are omitted from the canonical source tree below and described separately, because they are generated artifacts rather than application source. Lockfiles and configuration files are included.

## Root and source tree

```text
fireflies_project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── action_items.py
│   │   │       ├── health.py
│   │   │       ├── meetings.py
│   │   │       ├── qa.py
│   │   │       ├── router.py
│   │   │       └── search.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── meeting.py
│   │   ├── schemas/
│   │   │   ├── meeting.py
│   │   │   └── qa.py
│   │   ├── services/
│   │   │   ├── meeting_service.py
│   │   │   └── qa_service.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── seeds/
│   │   └── seed_data.py
│   ├── static/
│   │   └── audio/
│   │       └── sample_meeting_1.wav
│   ├── tests/
│   │   └── test_qa.py
│   ├── .env.example
│   ├── fireflies.db
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── audio/
│   │       └── sample_meeting_1.wav
│   ├── src/
│   │   ├── app/
│   │   │   ├── meetings/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── workspace.module.css
│   │   │   │   ├── page.module.css
│   │   │   │   └── page.tsx
│   │   │   ├── error.tsx
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── page.module.css
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── MeetingCard.module.css
│   │   │   │   ├── MeetingCard.tsx
│   │   │   │   ├── MeetingFilterBar.module.css
│   │   │   │   ├── MeetingFilterBar.tsx
│   │   │   │   ├── MeetingRow.module.css
│   │   │   │   ├── MeetingRow.tsx
│   │   │   │   ├── NewMeetingModal.module.css
│   │   │   │   ├── NewMeetingModal.tsx
│   │   │   │   ├── StatsBanner.module.css
│   │   │   │   └── StatsBanner.tsx
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.module.css
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Navbar.module.css
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.module.css
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── notifications/
│   │   │   │   ├── NotificationPopover.module.css
│   │   │   │   └── NotificationPopover.tsx
│   │   │   ├── search/
│   │   │   │   ├── GlobalSearchModal.module.css
│   │   │   │   └── GlobalSearchModal.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Avatar.module.css
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Badge.module.css
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.module.css
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.module.css
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── EmptyState.module.css
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── Input.module.css
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── LoadingState.module.css
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   ├── Modal.module.css
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Select.module.css
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── ThemeToggle.module.css
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   ├── ToastContainer.module.css
│   │   │   │   └── ToastContainer.tsx
│   │   │   └── workspace/
│   │   │       ├── ActionItemsTab.tsx
│   │   │       ├── AnnotationToolbar.module.css
│   │   │       ├── AnnotationToolbar.tsx
│   │   │       ├── AskAiTab.module.css
│   │   │       ├── AskAiTab.tsx
│   │   │       ├── ChaptersTab.tsx
│   │   │       ├── CommentPopover.module.css
│   │   │       ├── CommentPopover.tsx
│   │   │       ├── ExportMenu.module.css
│   │   │       ├── ExportMenu.tsx
│   │   │       ├── MediaPlayerBar.module.css
│   │   │       ├── MediaPlayerBar.tsx
│   │   │       ├── MeetingHeader.module.css
│   │   │       ├── MeetingHeader.tsx
│   │   │       ├── SmartNotesPanel.module.css
│   │   │       ├── SmartNotesPanel.tsx
│   │   │       ├── SummaryTab.tsx
│   │   │       ├── TranscriptPanel.module.css
│   │   │       ├── TranscriptPanel.tsx
│   │   │       └── TranscriptSegmentItem.tsx
│   │   ├── context/
│   │   │   ├── NotificationContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   └── useAudioPlayer.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── exportUtils.ts
│   │   └── types/
│   │       ├── meeting.ts
│   │       └── notification.ts
│   ├── .gitignore
│   ├── next-env.d.ts
│   ├── next.config.js
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── DATABASE_SCHEMA.md
├── FEATURES.md
├── FRD.md
├── PRD.md
├── PROJECT_STRUCTURE.md
└── README.md
```

## File-by-file responsibility guide

### Root

- `.gitignore` — root ignore rules.
- `README.md` — developer-facing project setup and overview.
- `PRD.md` — product scope, goals, requirements, and assumptions.
- `FRD.md` — functional flows and API contracts.
- `FEATURES.md` — UI/backend feature inventory and implementation status.
- `DATABASE_SCHEMA.md` — physical SQLite schema, constraints, and relationships.
- `PROJECT_STRUCTURE.md` — this file.

### Frontend: app routes and global setup

- `frontend/package.json` — Next.js scripts and dependencies.
- `frontend/package-lock.json` — pinned npm dependency tree.
- `frontend/next.config.js` — Next configuration and API rewrites.
- `frontend/tsconfig.json` — TypeScript compiler settings.
- `frontend/next-env.d.ts` — generated Next.js type references.
- `frontend/.gitignore` — frontend-specific ignore rules.
- `frontend/src/app/page.tsx` — redirects `/` to `/meetings`.
- `frontend/src/app/layout.tsx` — root layout/providers and global page shell.
- `frontend/src/app/globals.css` — global styles and design tokens.
- `frontend/src/app/error.tsx` — route-level error UI.
- `frontend/src/app/not-found.tsx` — not-found UI.
- `frontend/src/app/page.module.css` — root page CSS module (route redirects).
- `frontend/src/app/meetings/page.tsx` — meetings library, filters, sorting, grid/list mode, stats, empty/error states, and create/import modal orchestration.
- `frontend/src/app/meetings/page.module.css` — meetings library styles.
- `frontend/src/app/meetings/[id]/page.tsx` — meeting workspace route, data loading, audio-player hookup, and coordination of transcript/notes panels.
- `frontend/src/app/meetings/[id]/workspace.module.css` — workspace layout styles.

### Frontend: dashboard components (`src/components/dashboard/`)

- `MeetingCard.tsx` / `.module.css` — card presentation for a meeting.
- `MeetingRow.tsx` / `.module.css` — list-row presentation for a meeting.
- `MeetingFilterBar.tsx` / `.module.css` — search, participant/date filters, sort selection, grid/list toggle, and create button.
- `NewMeetingModal.tsx` / `.module.css` — create/import meeting form/modal.
- `StatsBanner.tsx` / `.module.css` — meeting count, duration, and pending-task metrics.

### Frontend: layout (`src/components/layout/`)

- `MainLayout.tsx` / `.module.css` — overall app layout wrapper.
- `Navbar.tsx` / `.module.css` — top navigation.
- `Sidebar.tsx` / `.module.css` — side navigation.

### Frontend: notifications (`src/components/notifications/`)

- `NotificationPopover.tsx` / `.module.css` — notification popover UI.

### Frontend: global search (`src/components/search/`)

- `GlobalSearchModal.tsx` / `.module.css` — global search dialog and results.

### Frontend: reusable UI (`src/components/ui/`)

- `Avatar.tsx` / `.module.css` — avatar display.
- `Badge.tsx` / `.module.css` — status/count badge.
- `Button.tsx` / `.module.css` — shared button variants.
- `Card.tsx` / `.module.css` — shared card wrapper.
- `EmptyState.tsx` / `.module.css` — empty-state presentation.
- `Input.tsx` / `.module.css` — shared input control.
- `LoadingState.tsx` / `.module.css` — loading placeholders/skeletons.
- `Modal.tsx` / `.module.css` — reusable modal shell.
- `Select.tsx` / `.module.css` — shared select control.
- `ThemeToggle.tsx` / `.module.css` — dark/light theme toggle.
- `ToastContainer.tsx` / `.module.css` — toast notifications display.

### Frontend: meeting workspace (`src/components/workspace/`)

- `MeetingHeader.tsx` / `.module.css` — meeting title/metadata and workspace-level actions including export.
- `TranscriptPanel.tsx` / `.module.css` — transcript filtering/search, selected-text annotation flow, and transcript segment list.
- `TranscriptSegmentItem.tsx` — one speaker/timestamp/text segment with search highlighting and annotation display.
- `AnnotationToolbar.tsx` / `.module.css` — highlight color picker and highlight/comment actions.
- `CommentPopover.tsx` / `.module.css` — create/view/edit/delete comment/highlight UI.
- `MediaPlayerBar.tsx` / `.module.css` — custom playback controls, seek range, volume, mute, and speed cycling. It operates on the bundled sample audio; recording-specific media/alignment is not established.
- `SmartNotesPanel.tsx` / `.module.css` — tabs for Summary, Action Items, Chapters, and Ask AI.
- `SummaryTab.tsx` — seeded summary and key discussion content.
- `ActionItemsTab.tsx` — create/edit/complete/delete task UI connected to API calls.
- `ChaptersTab.tsx` — displays chapter/topic records and seeks to their stored timestamps; chapter content is seeded/demo placeholder data, not verified automatic chapter generation.
- `AskAiTab.tsx` / `.module.css` — question entry, suggested questions, conversation display, retry/error handling, and timestamp links.
- `ExportMenu.tsx` / `.module.css` — export dialog, format/content selection, and optional export settings.

### Frontend: state, hooks, API, and types

- `frontend/src/context/NotificationContext.tsx` — notification/toast state and helpers.
- `frontend/src/context/ThemeContext.tsx` — theme state and persistence.
- `frontend/src/hooks/useAudioPlayer.ts` — audio element state, play/pause, time updates, seeking, speed, volume, and mute behavior.
- `frontend/src/lib/api.ts` — typed fetch client for backend endpoints.
- `frontend/src/lib/exportUtils.ts` — transcript/summary TXT, Markdown, and print-to-PDF export helpers.
- `frontend/src/types/meeting.ts` — meeting, transcript, summary, action, chapter, annotation, and Q&A types.
- `frontend/src/types/notification.ts` — notification data types.
- `frontend/public/audio/sample_meeting_1.wav` — bundled sample audio asset used as a fallback/demo recording.

### Backend: app and API

- `backend/app/main.py` — FastAPI app, middleware/CORS, router mounting, static audio mount, and startup setup.
- `backend/app/__init__.py` — Python package marker.
- `backend/app/api/v1/router.py` — v1 API router aggregation.
- `backend/app/api/v1/health.py` — health endpoint.
- `backend/app/api/v1/meetings.py` — meeting list/detail/create/update/delete, action-item creation, annotation creation/update/delete routes.
- `backend/app/api/v1/action_items.py` — action-item update/delete routes.
- `backend/app/api/v1/search.py` — global search endpoint.
- `backend/app/api/v1/qa.py` — meeting-scoped question-and-answer endpoint.
- `backend/app/core/config.py` — environment-backed settings.
- `backend/app/db/base.py` — SQLAlchemy declarative base.
- `backend/app/db/session.py` — engine/session creation and database dependency.
- `backend/app/models/__init__.py` — ORM model exports/import registration.
- `backend/app/models/meeting.py` — ORM models for meetings, segments, summaries, action items, chapters, and annotations.
- `backend/app/schemas/meeting.py` — Pydantic request/response schemas for meeting data.
- `backend/app/schemas/qa.py` — Pydantic schemas for Q&A request/response and history.
- `backend/app/services/meeting_service.py` — database query and mutation/business logic for meetings, action items, annotations, and search.
- `backend/app/services/qa_service.py` — provider call/fallback logic for meeting Q&A.
- `backend/requirements.txt` — Python dependencies.
- `backend/.env.example` — example configuration keys (not real credentials).
- `backend/seeds/seed_data.py` — demo data reset/reseed script; destructive to ORM-managed tables.
- `backend/tests/test_qa.py` — Q&A unit tests.
- `backend/fireflies.db` — SQLite database snapshot included in archive.
- `backend/static/audio/sample_meeting_1.wav` — backend static copy of the sample WAV.

## Generated or incidental files found in the archive

- `frontend/.next-build/` — Next.js generated build output included in the supplied archive; not hand-maintained source.
- `backend/**/__pycache__/*.pyc` — Python bytecode caches included in the extracted folder; generated by Python.

These are intentionally excluded from the canonical tree above but were physically present in the archive. The documentation update does not modify application source code or clean these artifacts from the project.

## Configuration caveats

- The frontend API client reads `NEXT_PUBLIC_API_BASE_URL`, while the Next.js rewrite configuration reads `NEXT_PUBLIC_API_URL`; reconcile this before relying on rewrites in a deployment.
- The backend SQLite and static-audio paths are relative paths and depend on the working directory unless overridden.
- `GEMINI_API_KEY` and `LLM_PROVIDER` are declared in configuration, but no Gemini provider implementation was confirmed in the inspected source.
