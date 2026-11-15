"""
CreatorPulse AI - Relational Repositories Unit Tests
Tests CRUD operations and business queries through repository abstraction.
"""

import uuid
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.models import Base, SYSTEM_DEMO_WORKSPACE_ID, SYSTEM_DEMO_USER_ID
from backend.database.seeder import seed_from_json
from backend.database.repositories import (
    post_repository,
    prediction_repository,
    draft_repository,
    vibecheck_repository,
    dataset_repository,
    integration_repository,
)


@pytest.fixture
def seeded_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    seed_from_json(session)
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_post_repository_queries(seeded_db):
    posts = post_repository.get_posts(seeded_db, platform="all")
    assert len(posts) >= 1800

    yt_posts = post_repository.get_posts(seeded_db, platform="youtube", limit=10)
    assert len(yt_posts) == 10
    assert all(p["platform"].lower() == "youtube" for p in yt_posts)

    top_posts = post_repository.get_top_posts(seeded_db, platform="all", limit=5)
    assert len(top_posts) == 5
    assert top_posts[0]["engagement_rate"] >= top_posts[-1]["engagement_rate"]

    snapshots = post_repository.get_metric_snapshots(seeded_db, days=30)
    assert len(snapshots) > 0

    creators = post_repository.get_creators(seeded_db)
    assert len(creators) == 8


def test_prediction_repository_lifecycle(seeded_db):
    new_pred = {
        "platform": "instagram",
        "post_type": "reel",
        "title": "Top 5 Python Tricks",
        "predicted_prob": 0.85,
        "range_low_percent": 75.0,
        "range_high_percent": 95.0,
        "top_reasons": [{"factor": "strong hook", "weight": "+12%"}],
    }
    saved = prediction_repository.save_prediction(seeded_db, SYSTEM_DEMO_WORKSPACE_ID, new_pred)
    assert "prediction_id" in saved

    preds = prediction_repository.get_predictions(seeded_db, platform="instagram", limit=5)
    assert any(p["prediction_id"] == saved["prediction_id"] for p in preds)

    updated = prediction_repository.update_prediction_actual(
        seeded_db, SYSTEM_DEMO_WORKSPACE_ID, saved["prediction_id"], actual_outcome=True, actual_views=50000
    )
    assert updated is not None
    assert updated["actual_outcome"] is True

    scoreboard = prediction_repository.get_brier_scoreboard(seeded_db)
    assert scoreboard["evaluated_count"] > 0
    assert "brier_score" in scoreboard


def test_draft_repository_lifecycle(seeded_db):
    draft_data = {
        "title": "New Rep Test Draft",
        "content_payload": "Draft body text here",
        "platform": "twitter",
        "status": "idea",
        "scheduled_date": "2026-11-20T10:00:00Z",
    }
    saved = draft_repository.save_content_draft(seeded_db, SYSTEM_DEMO_WORKSPACE_ID, draft_data)
    assert "draft_id" in saved

    drafts = draft_repository.get_content_drafts(seeded_db, platform="twitter")
    assert any(d["draft_id"] == saved["draft_id"] for d in drafts)

    calendar = draft_repository.get_content_calendar(seeded_db)
    assert any(c["draft_id"] == saved["draft_id"] for c in calendar)

    deleted = draft_repository.delete_content_draft(seeded_db, SYSTEM_DEMO_WORKSPACE_ID, saved["draft_id"])
    assert deleted is True


def test_vibecheck_repository_lifecycle(seeded_db):
    report_data = {
        "title": "Test VibeCheck Report",
        "platform": "youtube",
        "author": "Tech Creator",
        "vibe_score": 78.5,
        "dominant_vibe": "Positive & Inspiring",
        "comment_count": 5,
        "positive_pct": 70.0,
        "negative_pct": 10.0,
        "neutral_pct": 20.0,
        "summary": "Audience enthusiastically received the tips.",
        "full_analysis": {
            "key_themes": ["Clear explanation", "Good audio"],
            "comments": [{"author": "UserA", "text": "Super helpful!", "compound_score": 0.85}],
        },
    }
    saved = vibecheck_repository.save_vibecheck_report(seeded_db, SYSTEM_DEMO_WORKSPACE_ID, report_data)
    assert "report_id" in saved

    fetched = vibecheck_repository.get_vibecheck_report(seeded_db, SYSTEM_DEMO_WORKSPACE_ID, saved["report_id"])
    assert fetched is not None
    assert fetched["title"] == "Test VibeCheck Report"

    deleted = vibecheck_repository.delete_vibecheck_report(seeded_db, SYSTEM_DEMO_WORKSPACE_ID, saved["report_id"])
    assert deleted is True


def test_dataset_repository_lifecycle(seeded_db):
    pref = dataset_repository.get_user_preferences(seeded_db, SYSTEM_DEMO_USER_ID)
    assert "active_data_source" in pref

    saved_pref = dataset_repository.save_user_preferences(
        seeded_db, SYSTEM_DEMO_USER_ID, active_source="sample"
    )
    assert saved_pref["active_data_source"] == "sample"

    trends = dataset_repository.get_trends(seeded_db, SYSTEM_DEMO_WORKSPACE_ID)
    assert isinstance(trends, list)


def test_integration_repository_lifecycle(seeded_db):
    saved = integration_repository.save_integration_metadata(
        seeded_db,
        SYSTEM_DEMO_WORKSPACE_ID,
        SYSTEM_DEMO_USER_ID,
        provider_id="youtube",
        is_connected=True,
        secret="AIzaSyTestSecret123",
        key_masked="AIza...123",
        health_status="healthy",
    )
    assert saved["provider_id"] == "youtube"
    assert saved["is_connected"] is True
    assert saved["key_masked"] == "AIza...123"

    retrieved_secret = integration_repository.get_integration_secret(
        seeded_db, SYSTEM_DEMO_WORKSPACE_ID, provider_id="youtube"
    )
    assert retrieved_secret == "AIzaSyTestSecret123"

    all_ints = integration_repository.get_all_integrations(seeded_db, SYSTEM_DEMO_WORKSPACE_ID)
    assert len(all_ints) >= 1

