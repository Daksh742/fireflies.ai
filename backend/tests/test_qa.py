import unittest
import os
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.meeting import MeetingModel, TranscriptSegmentModel, SummaryModel, ActionItemModel

TEST_DB_FILE = "./test_qa.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestQAEndpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        db = TestingSessionLocal()
        db.query(MeetingModel).delete()

        now = datetime.utcnow()
        meeting = MeetingModel(
            id="m_test_1",
            title="Redis Caching & Latency Review",
            date=now,
            duration_seconds=300,
            participants=["Alex Rivers", "Sarah Chen"],
        )
        db.add(meeting)

        summary = SummaryModel(
            meeting_id="m_test_1",
            overview="Audited database read bottlenecks and implemented Redis caching.",
            key_takeaways=["Redis caching reduced latency by 45%."],
            discussion_bullets=["Audited slow queries under peak load."],
        )
        db.add(summary)

        seg1 = TranscriptSegmentModel(
            id="s1",
            meeting_id="m_test_1",
            start_time=0.0,
            end_time=15.0,
            speaker_name="Sarah Chen",
            text="I audited our database read bottlenecks under peak load and implemented Redis caching.",
            sequence_order=0,
        )
        seg2 = TranscriptSegmentModel(
            id="s2",
            meeting_id="m_test_1",
            start_time=16.0,
            end_time=30.0,
            speaker_name="Alex Rivers",
            text="That cut our p99 latency by 45 percent, which is impressive.",
            sequence_order=1,
        )
        db.add_all([seg1, seg2])

        action = ActionItemModel(
            id="a1",
            meeting_id="m_test_1",
            text="Deploy Redis cache configuration to production.",
            assignee_name="Sarah Chen",
            completed=False,
        )
        db.add(action)

        empty_meeting = MeetingModel(
            id="m_empty",
            title="Empty Meeting",
            date=now,
            duration_seconds=60,
            participants=["Nobody"],
        )
        db.add(empty_meeting)

        db.commit()
        db.close()

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except OSError:
                pass

    def test_1_ask_valid_question_found(self):
        response = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "What were the Redis latency results?"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["meetingId"], "m_test_1")
        self.assertTrue(data["found"])
        self.assertIn("Redis", data["answer"])

    def test_2_ask_unsupported_question_not_found(self):
        response = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "What is the weather in Tokyo?"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["found"])
        self.assertIn("focused specifically on this meeting", data["answer"].lower())

    def test_3_ask_empty_question_returns_400(self):
        response = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "   "},
        )
        self.assertEqual(response.status_code, 400)

    def test_4_ask_non_existent_meeting_returns_404(self):
        response = client.post(
            "/api/v1/meetings/invalid_id/ask",
            json={"question": "What was discussed?"},
        )
        self.assertEqual(response.status_code, 404)

    def test_5_ask_empty_transcript_meeting(self):
        response = client.post(
            "/api/v1/meetings/m_empty/ask",
            json={"question": "What did Sarah say?"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["found"])
        self.assertIn("No transcript", data["answer"])

    def test_6_grounded_suggested_questions_all_answerable(self):
        suggested = [
            "What were the key takeaways from this meeting?",
            "What action items were assigned in this meeting?",
            "What did Sarah Chen discuss during this meeting?",
        ]
        for q in suggested:
            resp = client.post(
                "/api/v1/meetings/m_test_1/ask",
                json={"question": q},
            )
            self.assertEqual(resp.status_code, 200)
            d = resp.json()
            self.assertTrue(d["found"], f"Suggested question '{q}' failed with found=False")

    def test_7_greeting_and_gratitude_intent(self):
        # Greeting
        resp_hi = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "Hi"},
        )
        self.assertEqual(resp_hi.status_code, 200)
        d_hi = resp_hi.json()
        self.assertTrue(d_hi["found"])
        self.assertIn("help you explore this meeting", d_hi["answer"].lower())

        # Gratitude
        resp_thanks = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "Thanks"},
        )
        self.assertEqual(resp_thanks.status_code, 200)
        d_thanks = resp_thanks.json()
        self.assertTrue(d_thanks["found"])
        self.assertIn("welcome", d_thanks["answer"].lower())

    def test_8_out_of_scope_intent(self):
        resp = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "What is the capital of France?"},
        )
        self.assertEqual(resp.status_code, 200)
        d = resp.json()
        self.assertFalse(d["found"])
        self.assertIn("focused specifically on this meeting", d["answer"].lower())

    def test_9_follow_up_with_history(self):
        history = [
            {"role": "user", "content": "What action items were assigned?"},
            {"role": "assistant", "content": "Deploy Redis cache configuration to production (Sarah Chen)."},
        ]
        resp = client.post(
            "/api/v1/meetings/m_test_1/ask",
            json={"question": "Who was responsible for that?", "history": history},
        )
        self.assertEqual(resp.status_code, 200)
        d = resp.json()
        self.assertTrue(d["found"])
        self.assertIn("Sarah Chen", d["answer"])


if __name__ == "__main__":
    unittest.main()
