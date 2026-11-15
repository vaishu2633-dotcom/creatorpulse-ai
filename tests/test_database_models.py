"""
CreatorPulse AI - Relational Database Schema Unit Tests
Tests models, relationships, cascade deletes, composite unique constraints, and encryption.
"""

import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from backend.database.models import (
    Base,
    User,
    UserPreference,
    ConnectedSocialAccount,
    ApiIntegrationMetadata,
    SocialPost,
    EngagementMetric,
    Comment,
    Prediction,
    SentimentReport,
    SentimentComment,
    ContentDraft,
    ContentCalendar,
    Dataset,
    DatasetVersion,
    ModelVersion,
    TrainingRun,
    SYSTEM_DEMO_WORKSPACE_ID,
    SYSTEM_DEMO_USER_ID,
)
from backend.database.security import encrypt_secret, decrypt_secret
from backend.database.connection import get_storage_mode, DatabaseConnectionError, get_engine


@pytest.fixture
def db_session():
    """Provides a fresh isolated in-memory SQLite database session for each test."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_encryption_roundtrip():
    secret = "AIzaSySecretTestKey12345"
    token = encrypt_secret(secret)
    assert token is not None
    assert token != secret
    decrypted = decrypt_secret(token)
    assert decrypted == secret


def test_user_and_preference_cascade(db_session):
    user = User(
        id=SYSTEM_DEMO_USER_ID,
        email="demo@creatorpulse.ai",
        name="CreatorPulse Demo",
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
    )
    db_session.add(user)
    db_session.commit()

    pref = UserPreference(
        user_id=user.id,
        active_data_source="sample",
        theme="dark",
    )
    db_session.add(pref)
    db_session.commit()

    # Query back
    queried_user = db_session.get(User, user.id)
    assert queried_user.preference is not None
    assert queried_user.preference.active_data_source == "sample"

    # Cascade delete
    db_session.delete(queried_user)
    db_session.commit()

    assert db_session.get(UserPreference, pref.id) is None


def test_connected_social_account_unique_constraint(db_session):
    user = User(
        email="creator@example.com",
        name="Test Creator",
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
    )
    db_session.add(user)
    db_session.commit()

    acc1 = ConnectedSocialAccount(
        user_id=user.id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        platform="youtube",
        account_handle="@testchannel",
        display_name="Test Channel",
    )
    db_session.add(acc1)
    db_session.commit()

    # Duplicate in same workspace/platform/handle should fail
    acc2 = ConnectedSocialAccount(
        user_id=user.id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        platform="youtube",
        account_handle="@testchannel",
        display_name="Duplicate Channel",
    )
    db_session.add(acc2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_api_integration_metadata_encryption(db_session):
    user = User(
        email="api_user@example.com",
        name="API User",
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
    )
    db_session.add(user)
    db_session.commit()

    meta = ApiIntegrationMetadata(
        user_id=user.id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        provider_id="youtube",
        is_connected=True,
        key_masked="AIza...abcd",
    )
    meta.secret_plaintext = "real_youtube_api_key_secret"
    db_session.add(meta)
    db_session.commit()

    # Check that encrypted_secret in DB is ciphertext
    assert meta.encrypted_secret != "real_youtube_api_key_secret"
    # Check plaintext getter decrypts properly
    assert meta.secret_plaintext == "real_youtube_api_key_secret"

    # Duplicate provider in same workspace should violate unique constraint
    meta2 = ApiIntegrationMetadata(
        user_id=user.id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        provider_id="youtube",
    )
    db_session.add(meta2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_social_post_metrics_cascade_and_uniqueness(db_session):
    now = datetime.now(timezone.utc)
    post = SocialPost(
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        platform="youtube",
        external_post_id="vid_101",
        caption="Exploring AI tools",
        post_type="video",
        published_at=now,
        views=1500,
        likes=120,
    )
    db_session.add(post)
    db_session.commit()

    metric = EngagementMetric(
        post_id=post.id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        snapshot_time=now,
        views=1500,
        likes=120,
    )
    db_session.add(metric)
    db_session.commit()

    # Ensure duplicate external_post_id for same workspace and platform fails
    dup_post = SocialPost(
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        platform="youtube",
        external_post_id="vid_101",
        caption="Duplicate vid",
        published_at=now,
    )
    db_session.add(dup_post)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Cascade delete post should delete metric
    db_session.delete(post)
    db_session.commit()
    assert db_session.get(EngagementMetric, metric.id) is None


def test_sentiment_report_and_comments_cascade(db_session):
    now = datetime.now(timezone.utc)
    report = SentimentReport(
        report_id="rep_test_01",
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        platform="youtube",
        url="https://youtube.com/watch?v=123",
        title="Sample Video",
        creator="Demo Creator",
        total_comments=1,
        sentiment_score=0.85,
    )
    db_session.add(report)
    db_session.commit()

    comment = SentimentComment(
        report_id=report.report_id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        author="Viewer1",
        text="Love this video!",
        sentiment="positive",
        score=0.9,
    )
    db_session.add(comment)
    db_session.commit()

    # Verify query
    assert len(report.sentiment_comments) == 1

    # Cascade delete report should delete comments
    db_session.delete(report)
    db_session.commit()
    assert db_session.get(SentimentComment, comment.id) is None


def test_content_draft_and_calendar_cascade(db_session):
    now = datetime.now(timezone.utc)
    draft = ContentDraft(
        draft_id="draft_test_01",
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        title="Next AI Post",
        content="AI trends in 2026...",
        platform="linkedin",
        format_type="article",
    )
    db_session.add(draft)
    db_session.commit()

    entry = ContentCalendar(
        draft_id=draft.draft_id,
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        scheduled_date=now,
        status="scheduled",
    )
    db_session.add(entry)
    db_session.commit()

    assert draft.calendar_entry is not None

    db_session.delete(draft)
    db_session.commit()
    assert db_session.get(ContentCalendar, entry.id) is None


def test_dataset_versioning_and_unique_constraint(db_session):
    dataset = Dataset(
        workspace_id=SYSTEM_DEMO_WORKSPACE_ID,
        name="Creator Benchmark 2026",
        source_type="csv",
        row_count=500,
    )
    db_session.add(dataset)
    db_session.commit()

    v1 = DatasetVersion(
        dataset_id=dataset.id,
        version_number=1,
        row_count=500,
    )
    db_session.add(v1)
    db_session.commit()

    # Duplicate version_number for same dataset fails
    v1_dup = DatasetVersion(
        dataset_id=dataset.id,
        version_number=1,
        row_count=500,
    )
    db_session.add(v1_dup)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_strict_postgres_mode_connection_error(monkeypatch):
    monkeypatch.setenv("STORAGE_MODE", "postgres")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(DatabaseConnectionError):
        get_engine()
