"""
CreatorPulse AI - Controlled DAL Integration Tests
Tests data_access.py routing across explicit storage modes (json_mock, sqlite, postgres).
"""

import os
import uuid
import pytest
from backend.services import data_access
from backend.database.connection import DatabaseConnectionError, get_db, init_db
from backend.database.models import Base, SYSTEM_DEMO_WORKSPACE_ID
from backend.database.repositories import (
    post_repository,
    prediction_repository,
    draft_repository,
    vibecheck_repository,
)


def test_dal_json_mock_mode(monkeypatch):
    monkeypatch.setenv("STORAGE_MODE", "json_mock")
    data_access.set_active_data_source("sample")

    posts = data_access.get_posts()
    assert len(posts) >= 1800

    creators = data_access.get_creators()
    assert len(creators) == 8

    predictions = data_access.get_predictions(limit=10)
    assert len(predictions) > 0

    drafts = data_access.get_drafts()
    assert len(drafts) >= 12


def test_dal_sqlite_relational_mode(monkeypatch, tmp_path):
    test_db = tmp_path / "test_dal.db"
    monkeypatch.setenv("STORAGE_MODE", "sqlite")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{test_db}")
    from backend.database.connection import reset_engine_cache
    reset_engine_cache()
    data_access.set_active_data_source("sample")

    # 1. Fetch posts via DAL in sqlite mode
    posts = data_access.get_posts(limit=25)
    assert len(posts) == 25
    assert "post_id" in posts[0]

    # 2. Save a new draft via DAL
    draft_title = f"DAL Test Draft {uuid.uuid4().hex[:6]}"
    saved_draft = data_access.save_draft({
        "title": draft_title,
        "content_payload": "Testing relational DAL integration",
        "platform": "youtube",
        "status": "idea",
    })
    assert saved_draft["title"] == draft_title

    # Verify it exists in database via repository
    with get_db() as session:
        db_drafts = draft_repository.get_content_drafts(session, SYSTEM_DEMO_WORKSPACE_ID)
        assert any(d["title"] == draft_title for d in db_drafts)

    # 3. Save a new prediction via DAL
    pred_data = {
        "platform": "instagram",
        "post_type": "reel",
        "title": "5 DAL Architectural Wins",
        "predicted_prob": 0.91,
    }
    saved_pred = data_access.save_prediction(pred_data)
    assert "prediction_id" in saved_pred

    with get_db() as session:
        db_preds = prediction_repository.get_predictions(session, SYSTEM_DEMO_WORKSPACE_ID)
        assert any(p["prediction_id"] == saved_pred["prediction_id"] for p in db_preds)

    # 4. Save a new vibecheck report via DAL
    report_data = {
        "title": "DAL Sentiment Audit",
        "platform": "youtube",
        "author": "Test Author",
        "vibe_score": 82.0,
        "dominant_vibe": "Energetic",
        "comment_count": 2,
        "positive_pct": 80.0,
        "negative_pct": 0.0,
    }
    saved_rep = data_access.save_vibecheck_report(report_data)
    assert "report_id" in saved_rep

    with get_db() as session:
        db_reps = vibecheck_repository.get_vibecheck_reports(session, SYSTEM_DEMO_WORKSPACE_ID)
        assert any(r["report_id"] == saved_rep["report_id"] for r in db_reps)


def test_dal_strict_postgres_mode_fails_fast_without_db(monkeypatch):
    """Enforces architectural correction: never silently fall back from PostgreSQL to JSON."""
    monkeypatch.setenv("STORAGE_MODE", "postgres")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(DatabaseConnectionError):
        data_access.get_active_posts_raw()
