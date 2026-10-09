import os
import sys
from datetime import datetime, timedelta

# Ensure parent path is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.meeting import (
    MeetingModel,
    TranscriptSegmentModel,
    SummaryModel,
    ActionItemModel,
    ChapterTopicModel,
    CommentHighlightModel,
)


def seed_database():
    """Populate SQLite database with 5 rich, highly realistic business sample meetings."""
    # Re-create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("🌱 Seeding Fireflies SQLite Database...")

        # -------------------------------------------------------------
        # MEETING 1: Q3 Engineering Architecture & System Scalability Sync
        # -------------------------------------------------------------
        m1_date = datetime.utcnow() - timedelta(days=1, hours=3)
        m1 = MeetingModel(
            id="m1-q3-architecture-sync",
            title="Q3 Engineering Architecture & System Scalability Sync",
            date=m1_date,
            duration_seconds=240,
            audio_url="/static/audio/sample_meeting_1.wav",
            participants=[
                {"name": "Alex Rivers", "email": "alex.rivers@company.com", "role": "Product Lead"},
                {"name": "Sarah Chen", "email": "sarah.chen@company.com", "role": "Staff Architect"},
                {"name": "Marcus Vance", "email": "marcus.vance@company.com", "role": "Senior Backend Eng"},
            ]
        )
        db.add(m1)
        db.flush()

        m1_segments = [
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=0.0,
                end_time=12.0,
                speaker_name="Alex Rivers",
                speaker_avatar="AR",
                text="Welcome everyone to our Q3 architecture sync. Today we need to finalize our API scalability roadmap, database indexing strategy, and microservices queue migration.",
                sequence_order=1,
            ),
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=12.5,
                end_time=28.0,
                speaker_name="Sarah Chen",
                speaker_avatar="SC",
                text="Thanks Alex. I've audited our database read bottlenecks under peak loads. Implementing Redis caching for meeting queries and adding compound indexes cut our p99 latency by 45%.",
                sequence_order=2,
            ),
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=28.5,
                end_time=42.0,
                speaker_name="Marcus Vance",
                speaker_avatar="MV",
                text="Great benchmark metrics Sarah. On the queue side, we are migrating transcript ingestion to FastAPI background tasks with worker pools. It prevents HTTP request timeouts on large file uploads.",
                sequence_order=3,
            ),
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=42.5,
                end_time=58.0,
                speaker_name="Alex Rivers",
                speaker_avatar="AR",
                text="That's a major improvement. Let's make sure all API request payloads pass strict Pydantic v2 validation before our staging release on Tuesday.",
                sequence_order=4,
            ),
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=58.5,
                end_time=72.0,
                speaker_name="Sarah Chen",
                speaker_avatar="SC",
                text="Agreed. I will also configure WAL (Write-Ahead Logging) mode on SQLite to ensure robust concurrent transaction handling during peak load tests.",
                sequence_order=5,
            ),
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=72.5,
                end_time=86.0,
                speaker_name="Marcus Vance",
                speaker_avatar="MV",
                text="I'll finalize the CORS middleware headers and double-check response models for all action item PATCH and DELETE endpoints.",
                sequence_order=6,
            ),
            TranscriptSegmentModel(
                meeting_id=m1.id,
                start_time=86.5,
                end_time=98.0,
                speaker_name="Alex Rivers",
                speaker_avatar="AR",
                text="Perfect. Once those are verified, we'll run a full stress test across all endpoints before signing off on the release.",
                sequence_order=7,
            ),
        ]
        db.add_all(m1_segments)
        db.flush()

        m1_summary = SummaryModel(
            meeting_id=m1.id,
            overview="The engineering team reviewed Q3 architecture benchmarks, database query optimization metrics, and backend queue migration progress. Redis caching and SQLite query indexing delivered a 45% reduction in p99 API latency.",
            key_takeaways=[
                "Database read latency decreased by 45% following query indexing and Redis integration.",
                "Transcript ingestion migrated to FastAPI background tasks for async worker concurrency.",
                "SQLite configured in WAL mode for reliable concurrent write throughput.",
                "Target staging deployment confirmed for next Tuesday with zero downtime.",
            ],
            discussion_bullets=[
                "Sarah presented database performance benchmark graphs showing significant latency gains.",
                "Marcus detailed the worker pool architecture for transcript file parsing.",
                "Alex emphasized zero-downtime deployment requirements for staging release.",
            ]
        )
        db.add(m1_summary)

        m1_action_items = [
            ActionItemModel(
                meeting_id=m1.id,
                text="Finalize Pydantic schema validation rules for all v1 API endpoints",
                assignee_name="Marcus Vance",
                completed=True,
                priority="high",
                due_date=m1_date + timedelta(days=2),
            ),
            ActionItemModel(
                meeting_id=m1.id,
                text="Deploy Redis caching layer to staging cluster and monitor cache hit ratios",
                assignee_name="Sarah Chen",
                completed=False,
                priority="high",
                due_date=m1_date + timedelta(days=4),
            ),
            ActionItemModel(
                meeting_id=m1.id,
                text="Prepare staging release notes and benchmark report for leadership review",
                assignee_name="Alex Rivers",
                completed=False,
                priority="medium",
                due_date=m1_date + timedelta(days=5),
            ),
        ]
        db.add_all(m1_action_items)

        m1_chapters = [
            ChapterTopicModel(
                meeting_id=m1.id,
                title="1. Introduction & Roadmap Overview",
                start_time=0.0,
                summary_snippet="Alex sets the agenda for Q3 scalability goals.",
            ),
            ChapterTopicModel(
                meeting_id=m1.id,
                title="2. Database Performance & Latency Audit",
                start_time=12.5,
                summary_snippet="Sarah shares 45% p99 latency reduction metrics.",
            ),
            ChapterTopicModel(
                meeting_id=m1.id,
                title="3. FastAPI Background Queue Worker Architecture",
                start_time=28.5,
                summary_snippet="Marcus details transcript ingestion queue.",
            ),
            ChapterTopicModel(
                meeting_id=m1.id,
                title="4. Staging Deployment Criteria & Release Signoff",
                start_time=72.5,
                summary_snippet="Team locks Tuesday staging deployment timeline.",
            ),
        ]
        db.add_all(m1_chapters)

        m1_comment = CommentHighlightModel(
            meeting_id=m1.id,
            segment_id=m1_segments[1].id,
            selected_text="Implementing Redis caching for meeting queries and adding compound indexes cut our p99 latency by 45%.",
            start_offset=66,
            end_offset=167,
            comment_text="Key performance benchmark metric for Q3 backend scalability.",
            color_code="#F59E0B",
            annotation_type="highlight",
            author_name="Example Highlight",
        )
        db.add(m1_comment)

        # -------------------------------------------------------------
        # MEETING 2: Customer Advisory Board — Product Feedback & UX Review
        # -------------------------------------------------------------
        m2_date = datetime.utcnow() - timedelta(days=3, hours=5)
        m2 = MeetingModel(
            id="m2-customer-advisory-board",
            title="Customer Advisory Board — Product Feedback & UX Review",
            date=m2_date,
            duration_seconds=310,
            audio_url="/static/audio/sample_meeting_1.wav",
            participants=[
                {"name": "Alex Rivers", "email": "alex.rivers@company.com", "role": "Product Lead"},
                {"name": "Elena Rostova", "email": "elena.rostova@company.com", "role": "Head of UX"},
                {"name": "David Miller", "email": "david.miller@customer.org", "role": "VP Engineering"},
                {"name": "Priya Sharma", "email": "priya.sharma@techcorp.io", "role": "Product Manager"},
            ]
        )
        db.add(m2)
        db.flush()

        m2_segments = [
            TranscriptSegmentModel(
                meeting_id=m2.id,
                start_time=0.0,
                end_time=14.0,
                speaker_name="Alex Rivers",
                speaker_avatar="AR",
                text="Welcome David and Priya! We'd love your team's direct feedback on our updated Fireflies-style meeting workspace, interactive transcript seeking, and task checklist flows.",
                sequence_order=1,
            ),
            TranscriptSegmentModel(
                meeting_id=m2.id,
                start_time=14.5,
                end_time=32.0,
                speaker_name="David Miller",
                speaker_avatar="DM",
                text="The speed of interactive transcript timestamp seeking is outstanding. Our engineering managers especially rely on toggling action item checkmarks directly from the call notes during daily standups.",
                sequence_order=2,
            ),
            TranscriptSegmentModel(
                meeting_id=m2.id,
                start_time=32.5,
                end_time=48.0,
                speaker_name="Priya Sharma",
                speaker_avatar="PS",
                text="I agree. The instant persistence on action items is great. One suggestion: making the active transcript segment left-border highlight even clearer during audio playback helps multi-tasking.",
                sequence_order=3,
            ),
            TranscriptSegmentModel(
                meeting_id=m2.id,
                start_time=48.5,
                end_time=64.0,
                speaker_name="Elena Rostova",
                speaker_avatar="ER",
                text="That's invaluable input Priya. We've refined our design system tokens to use a clean brand indigo border accent (#6366F1) and smooth auto-scrolling into view.",
                sequence_order=4,
            ),
            TranscriptSegmentModel(
                meeting_id=m2.id,
                start_time=64.5,
                end_time=78.0,
                speaker_name="David Miller",
                speaker_avatar="DM",
                text="Also, the dark-first monochromatic theme looks super clean. The subtle charcoal surfaces and 1px borders fit right in with Linear and Notion.",
                sequence_order=5,
            ),
            TranscriptSegmentModel(
                meeting_id=m2.id,
                start_time=78.5,
                end_time=92.0,
                speaker_name="Alex Rivers",
                speaker_avatar="AR",
                text="Thank you David. We will continue focusing on high information density, clean typography, and zero-latency audio synchronization.",
                sequence_order=6,
            ),
        ]
        db.add_all(m2_segments)
        db.flush()

        m2_summary = SummaryModel(
            meeting_id=m2.id,
            overview="Advisory board session reviewing customer feedback on meeting workspace usability. Enterprise managers praised real-time audio transcript seeking, dark-first typography, and persistent task management.",
            key_takeaways=[
                "Customers praised interactive timestamp jumping and instant task checklist persistence.",
                "UX team verified dark-first monochromatic color hierarchy matching top SaaS productivity tools.",
                "Auto-scrolling transcript line highlight validated across multi-speaker review flows.",
            ],
            discussion_bullets=[
                "David shared insights from 50+ engineering leads using meeting notes daily.",
                "Priya requested clear active line indicators for long transcript playback.",
                "Elena demonstrated design token refinements and responsive layout scaling.",
            ]
        )
        db.add(m2_summary)

        m2_action_items = [
            ActionItemModel(
                meeting_id=m2.id,
                text="Conduct follow-up usability session with enterprise beta users",
                assignee_name="Elena Rostova",
                completed=False,
                priority="high",
                due_date=m2_date + timedelta(days=7),
            ),
            ActionItemModel(
                meeting_id=m2.id,
                text="Document transcript search performance benchmarks for customer success team",
                assignee_name="Alex Rivers",
                completed=True,
                priority="low",
                due_date=m2_date + timedelta(days=3),
            ),
            ActionItemModel(
                meeting_id=m2.id,
                text="Share updated meeting workspace roadmap with advisory board members",
                assignee_name="Priya Sharma",
                completed=False,
                priority="medium",
                due_date=m2_date + timedelta(days=5),
            ),
        ]
        db.add_all(m2_action_items)

        m2_chapters = [
            ChapterTopicModel(
                meeting_id=m2.id,
                title="1. Customer Feedback Introduction",
                start_time=0.0,
                summary_snippet="Reviewing advisory board feedback.",
            ),
            ChapterTopicModel(
                meeting_id=m2.id,
                title="2. Transcript & Task Usability Insights",
                start_time=14.5,
                summary_snippet="David highlights team adoption of interactive notes.",
            ),
            ChapterTopicModel(
                meeting_id=m2.id,
                title="3. Design System & Typography Refinements",
                start_time=48.5,
                summary_snippet="Elena presents active segment highlight updates.",
            ),
        ]
        db.add_all(m2_chapters)

        m2_comment = CommentHighlightModel(
            meeting_id=m2.id,
            segment_id=m2_segments[1].id,
            selected_text="The speed of interactive transcript timestamp seeking is outstanding.",
            start_offset=0,
            end_offset=66,
            comment_text="Enterprise customer feedback on audio-transcript synchronization.",
            color_code="#3B82F6",
            annotation_type="highlight",
            author_name="Example Highlight",
        )
        db.add(m2_comment)

        # -------------------------------------------------------------
        # MEETING 3: Sprint Planning & Q4 Feature Roadmap Scope
        # -------------------------------------------------------------
        m3_date = datetime.utcnow() - timedelta(days=5, hours=1)
        m3 = MeetingModel(
            id="m3-sprint-planning-q4",
            title="Sprint Planning & Q4 Feature Roadmap Scope",
            date=m3_date,
            duration_seconds=270,
            audio_url="/static/audio/sample_meeting_1.wav",
            participants=[
                {"name": "Sarah Chen", "email": "sarah.chen@company.com", "role": "Staff Architect"},
                {"name": "Marcus Vance", "email": "marcus.vance@company.com", "role": "Senior Backend Eng"},
                {"name": "Rachel Green", "email": "rachel.green@company.com", "role": "QA Lead"},
                {"name": "Liam Davis", "email": "liam.davis@company.com", "role": "DevOps Lead"},
            ]
        )
        db.add(m3)
        db.flush()

        m3_segments = [
            TranscriptSegmentModel(
                meeting_id=m3.id,
                start_time=0.0,
                end_time=15.0,
                speaker_name="Sarah Chen",
                speaker_avatar="SC",
                text="Let's align on our sprint goals. We are prioritizing meeting CRUD stability, file transcript imports (.vtt, .json, .txt), and global search functionality.",
                sequence_order=1,
            ),
            TranscriptSegmentModel(
                meeting_id=m3.id,
                start_time=15.5,
                end_time=32.0,
                speaker_name="Marcus Vance",
                speaker_avatar="MV",
                text="The file parser service for VTT, JSON, and plain text files is ready. It automatically extracts speaker labels, calculates start/end timestamps, and builds structured transcript segments.",
                sequence_order=2,
            ),
            TranscriptSegmentModel(
                meeting_id=m3.id,
                start_time=32.5,
                end_time=48.0,
                speaker_name="Rachel Green",
                speaker_avatar="RG",
                text="Awesome. QA will write automated test cases covering transcript imports, keyword search query matching, and action item task checklist persistence.",
                sequence_order=3,
            ),
            TranscriptSegmentModel(
                meeting_id=m3.id,
                start_time=48.5,
                end_time=62.0,
                speaker_name="Liam Davis",
                speaker_avatar="LD",
                text="From the DevOps side, our Docker container build pipeline is fully automated and running clean health checks on every pull request.",
                sequence_order=4,
            ),
            TranscriptSegmentModel(
                meeting_id=m3.id,
                start_time=62.5,
                end_time=76.0,
                speaker_name="Sarah Chen",
                speaker_avatar="SC",
                text="Great work team. Let's make sure our database seed scripts include diverse sample meetings so evaluators can test all features immediately.",
                sequence_order=5,
            ),
        ]
        db.add_all(m3_segments)
        db.flush()

        m3_summary = SummaryModel(
            meeting_id=m3.id,
            overview="Sprint planning session establishing deliverables for meeting CRUD operations, VTT/JSON/TXT file import engine, automated QA test suites, and Docker deployment pipelines.",
            key_takeaways=[
                "Transcript parser engine supports VTT, JSON, and raw TXT file imports.",
                "Automated QA test suites will validate CRUD operations and timestamp navigation.",
                "Docker build pipeline passing automated health checks on pull requests.",
            ],
            discussion_bullets=[
                "Sarah reviewed sprint capacity and component ownership.",
                "Marcus demonstrated VTT file parsing capabilities.",
                "Rachel outlined QA test plan for release acceptance criteria.",
                "Liam reported clean CI/CD automated pipeline builds.",
            ]
        )
        db.add(m3_summary)

        m3_action_items = [
            ActionItemModel(
                meeting_id=m3.id,
                text="Write automated integration tests for transcript parsing service",
                assignee_name="Rachel Green",
                completed=False,
                priority="high",
                due_date=m3_date + timedelta(days=5),
            ),
            ActionItemModel(
                meeting_id=m3.id,
                text="Add sample VTT and JSON import files to repository test suite",
                assignee_name="Marcus Vance",
                completed=True,
                priority="medium",
                due_date=m3_date + timedelta(days=2),
            ),
            ActionItemModel(
                meeting_id=m3.id,
                text="Verify Docker container image build size and healthcheck endpoint response",
                assignee_name="Liam Davis",
                completed=False,
                priority="high",
                due_date=m3_date + timedelta(days=3),
            ),
        ]
        db.add_all(m3_action_items)

        m3_chapters = [
            ChapterTopicModel(
                meeting_id=m3.id,
                title="1. Sprint Goals & Feature Scope",
                start_time=0.0,
                summary_snippet="Sarah outlines sprint priorities.",
            ),
            ChapterTopicModel(
                meeting_id=m3.id,
                title="2. Transcript File Parser Engine Demo",
                start_time=15.5,
                summary_snippet="Marcus presents VTT and JSON parsing.",
            ),
            ChapterTopicModel(
                meeting_id=m3.id,
                title="3. DevOps Pipeline & CI Health Checks",
                start_time=48.5,
                summary_snippet="Liam reviews Docker automated build pipeline.",
            ),
        ]
        db.add_all(m3_chapters)

        m3_comment = CommentHighlightModel(
            meeting_id=m3.id,
            segment_id=m3_segments[1].id,
            selected_text="The file parser service for VTT, JSON, and plain text files is ready.",
            start_offset=0,
            end_offset=67,
            comment_text="Feature acceptance item for sprint delivery.",
            color_code="#10B981",
            annotation_type="highlight",
            author_name="Example Highlight",
        )
        db.add(m3_comment)

        # -------------------------------------------------------------
        # MEETING 4: Design System & Monochromatic UI Component Audit
        # -------------------------------------------------------------
        m4_date = datetime.utcnow() - timedelta(days=7, hours=2)
        m4 = MeetingModel(
            id="m4-design-system-sync",
            title="Design System & Monochromatic UI Component Audit",
            date=m4_date,
            duration_seconds=290,
            audio_url="/static/audio/sample_meeting_1.wav",
            participants=[
                {"name": "Elena Rostova", "email": "elena.rostova@company.com", "role": "Head of UX"},
                {"name": "Alex Rivers", "email": "alex.rivers@company.com", "role": "Product Lead"},
                {"name": "Tom Hastings", "email": "tom.hastings@company.com", "role": "Frontend Lead"},
            ]
        )
        db.add(m4)
        db.flush()

        m4_segments = [
            TranscriptSegmentModel(
                meeting_id=m4.id,
                start_time=0.0,
                end_time=14.0,
                speaker_name="Elena Rostova",
                speaker_avatar="ER",
                text="Today we are reviewing our design system token consolidation. We want a strict near-black monochromatic dark theme across all workspace views.",
                sequence_order=1,
            ),
            TranscriptSegmentModel(
                meeting_id=m4.id,
                start_time=14.5,
                end_time=30.0,
                speaker_name="Tom Hastings",
                speaker_avatar="TH",
                text="We have standardized our CSS variables in globals.css: near-black base (#080808), surface (#0F0F0F), subtle border (#202020), and a single interaction accent (#6366F1).",
                sequence_order=2,
            ),
            TranscriptSegmentModel(
                meeting_id=m4.id,
                start_time=30.5,
                end_time=45.0,
                speaker_name="Alex Rivers",
                speaker_avatar="AR",
                text="That looks extremely refined. It gives the application a mature, productivity-focused feel similar to Linear and Notion without any distracting purple tints.",
                sequence_order=3,
            ),
            TranscriptSegmentModel(
                meeting_id=m4.id,
                start_time=45.5,
                end_time=60.0,
                speaker_name="Elena Rostova",
                speaker_avatar="ER",
                text="Exactly. We also audited font weights and line heights to ensure maximum readability for long meeting transcripts and detailed AI summary notes.",
                sequence_order=4,
            ),
        ]
        db.add_all(m4_segments)
        db.flush()

        m4_summary = SummaryModel(
            meeting_id=m4.id,
            overview="Design system review establishing dark-first monochromatic color tokens, typography scales, and CSS Module layout standards.",
            key_takeaways=[
                "Consolidated CSS design tokens in globals.css using neutral black/grey palette.",
                "Single interaction accent (#6366F1) strictly scoped to hover, focus rings, and active transcript borders.",
                "Typography scale optimized for dense text readability across desktop and mobile viewports.",
            ],
            discussion_bullets=[
                "Elena led audit of UI component contrast ratios.",
                "Tom demonstrated CSS Module token usage in workspace components.",
                "Alex confirmed alignment with enterprise productivity UX standards.",
            ]
        )
        db.add(m4_summary)

        m4_action_items = [
            ActionItemModel(
                meeting_id=m4.id,
                text="Audit all UI component hover states for WCAG AA contrast compliance",
                assignee_name="Tom Hastings",
                completed=True,
                priority="medium",
                due_date=m4_date + timedelta(days=3),
            ),
            ActionItemModel(
                meeting_id=m4.id,
                text="Publish updated design token guidelines to engineering documentation",
                assignee_name="Elena Rostova",
                completed=False,
                priority="high",
                due_date=m4_date + timedelta(days=4),
            ),
        ]
        db.add_all(m4_action_items)

        m4_chapters = [
            ChapterTopicModel(
                meeting_id=m4.id,
                title="1. Design System Token Audit Overview",
                start_time=0.0,
                summary_snippet="Elena sets design system priorities.",
            ),
            ChapterTopicModel(
                meeting_id=m4.id,
                title="2. CSS Variables & Palette Standards",
                start_time=14.5,
                summary_snippet="Tom details near-black monochromatic tokens.",
            ),
        ]
        db.add_all(m4_chapters)

        m4_comment = CommentHighlightModel(
            meeting_id=m4.id,
            segment_id=m4_segments[1].id,
            selected_text="standardized our CSS variables in globals.css",
            start_offset=8,
            end_offset=48,
            comment_text="Design system color token consolidation note.",
            color_code="#EC4899",
            annotation_type="highlight",
            author_name="Example Highlight",
        )
        db.add(m4_comment)

        # -------------------------------------------------------------
        # MEETING 5: Enterprise Security, SOC2 & Data Privacy Audit
        # -------------------------------------------------------------
        m5_date = datetime.utcnow() - timedelta(days=10, hours=4)
        m5 = MeetingModel(
            id="m5-enterprise-security-review",
            title="Enterprise Security, SOC2 & Data Privacy Audit",
            date=m5_date,
            duration_seconds=350,
            audio_url="/static/audio/sample_meeting_1.wav",
            participants=[
                {"name": "Marcus Vance", "email": "marcus.vance@company.com", "role": "Senior Backend Eng"},
                {"name": "Sarah Chen", "email": "sarah.chen@company.com", "role": "Staff Architect"},
                {"name": "Claire Bennett", "email": "claire.bennett@company.com", "role": "Security Counsel"},
            ]
        )
        db.add(m5)
        db.flush()

        m5_segments = [
            TranscriptSegmentModel(
                meeting_id=m5.id,
                start_time=0.0,
                end_time=16.0,
                speaker_name="Claire Bennett",
                speaker_avatar="CB",
                text="Welcome Marcus and Sarah. Today we are conducting our quarterly security and SOC2 compliance audit across our database storage and API endpoints.",
                sequence_order=1,
            ),
            TranscriptSegmentModel(
                meeting_id=m5.id,
                start_time=16.5,
                end_time=34.0,
                speaker_name="Marcus Vance",
                speaker_avatar="MV",
                text="All database connections and static media files are served over encrypted TLS channels. Our API inputs strictly enforce Pydantic type checking to prevent injection attacks.",
                sequence_order=2,
            ),
            TranscriptSegmentModel(
                meeting_id=m5.id,
                start_time=34.5,
                end_time=52.0,
                speaker_name="Sarah Chen",
                speaker_avatar="SC",
                text="Additionally, we have enabled automated daily SQLite backups and database transaction logging for auditability.",
                sequence_order=3,
            ),
            TranscriptSegmentModel(
                meeting_id=m5.id,
                start_time=52.5,
                end_time=68.0,
                speaker_name="Claire Bennett",
                speaker_avatar="CB",
                text="Excellent work. That satisfies all primary data privacy and security criteria for our upcoming SOC2 Type II audit.",
                sequence_order=4,
            ),
        ]
        db.add_all(m5_segments)
        db.flush()

        m5_summary = SummaryModel(
            meeting_id=m5.id,
            overview="Quarterly enterprise security audit reviewing database encryption, API input validation, and SOC2 compliance readiness.",
            key_takeaways=[
                "All database storage and media endpoints operate over encrypted channels.",
                "Pydantic schema validation enforces strict type safety across all v1 routes.",
                "Automated SQLite backups and audit logging active for SOC2 compliance.",
            ],
            discussion_bullets=[
                "Claire reviewed SOC2 Type II audit requirements.",
                "Marcus presented backend API input sanitization architecture.",
                "Sarah detailed automated database backup schedules.",
            ]
        )
        db.add(m5_summary)

        m5_action_items = [
            ActionItemModel(
                meeting_id=m5.id,
                text="Compile SOC2 audit evidence package for external auditors",
                assignee_name="Claire Bennett",
                completed=True,
                priority="high",
                due_date=m5_date + timedelta(days=5),
            ),
            ActionItemModel(
                meeting_id=m5.id,
                text="Perform automated vulnerability scan on production API endpoints",
                assignee_name="Marcus Vance",
                completed=False,
                priority="medium",
                due_date=m5_date + timedelta(days=6),
            ),
        ]
        db.add_all(m5_action_items)

        m5_chapters = [
            ChapterTopicModel(
                meeting_id=m5.id,
                title="1. SOC2 Audit Agenda",
                start_time=0.0,
                summary_snippet="Claire introduces security audit goals.",
            ),
            ChapterTopicModel(
                meeting_id=m5.id,
                title="2. Backend API Security & Encryption",
                start_time=16.5,
                summary_snippet="Marcus reviews TLS encryption and Pydantic validation.",
            ),
        ]
        db.add_all(m5_chapters)

        m5_comment = CommentHighlightModel(
            meeting_id=m5.id,
            segment_id=m5_segments[1].id,
            selected_text="All database connections and static media files are served over encrypted TLS channels.",
            start_offset=0,
            end_offset=83,
            comment_text="SOC2 Type II compliance audit verification point.",
            color_code="#F59E0B",
            annotation_type="highlight",
            author_name="Example Highlight",
        )
        db.add(m5_comment)

        db.commit()
        print("✅ Database successfully seeded with 5 rich, realistic sample meetings!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
