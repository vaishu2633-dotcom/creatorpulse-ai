"""
CreatorPulse AI - Relational Database Seeder Unit Tests
Tests that seeding from existing JSON files is accurate and strictly idempotent.
"""

import uuid
import pytest
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker

from backend.database.models import (
    Base,
    User,
    UserPreference,
    ConnectedSocialAccount,
    SocialPost,
    EngagementMetric,
    Comment,
    Prediction,
    SentimentReport,
    ContentDraft,
    ContentCalendar,
    Dataset,
    DatasetVersion,
    SYSTEM_DEMO_WORKSPACE_ID,
)
from backend.database.seeder import seed_from_json


@pytest.fixture
def seeder_session():
    """Provides an isolated SQLite database session."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_seed_from_json_and_idempotency(seeder_session):
    # First execution: imports all data
    first_stats = seed_from_json(seeder_session)

    assert first_stats["users"] == 1
    assert first_stats["user_preferences"] == 1
    assert first_stats["connected_social_accounts"] == 8
    # 1800 sample posts + 2 uploaded posts
    assert first_stats["social_posts"] >= 1800
    assert first_stats["engagement_metrics"] == 124
    assert first_stats["comments"] == 10
    assert first_stats["predictions"] >= 325
    assert first_stats["content_drafts"] >= 12
    assert first_stats["sentiment_reports"] >= 10
    assert first_stats["datasets"] == 1
    assert first_stats["dataset_versions"] == 1

    # Check total post count in DB
    total_posts = seeder_session.scalar(select(func.count(SocialPost.id)))
    assert total_posts == first_stats["social_posts"]

    # Second execution: must be 100% idempotent and create ZERO new records
    second_stats = seed_from_json(seeder_session)

    for entity, count in second_stats.items():
        assert count == 0, f"Expected 0 new records for {entity} on second run, got {count}"

    # Verify counts remained completely unchanged
    total_posts_after = seeder_session.scalar(select(func.count(SocialPost.id)))
    assert total_posts_after == total_posts

    total_predictions = seeder_session.scalar(select(func.count(Prediction.id)))
    assert total_predictions == first_stats["predictions"]

    total_drafts = seeder_session.scalar(select(func.count(ContentDraft.id)))
    assert total_drafts == first_stats["content_drafts"]


def test_seed_workspace_isolation(seeder_session):
    seed_from_json(seeder_session)

    # Query with default demo workspace
    demo_posts = seeder_session.scalars(
        select(SocialPost).where(SocialPost.workspace_id == SYSTEM_DEMO_WORKSPACE_ID)
    ).all()
    assert len(demo_posts) >= 1800

    # Query with a random different workspace
    other_workspace_id = uuid.uuid4()
    other_posts = seeder_session.scalars(
        select(SocialPost).where(SocialPost.workspace_id == other_workspace_id)
    ).all()
    assert len(other_posts) == 0
