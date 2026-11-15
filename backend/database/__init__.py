"""
CreatorPulse AI - Relational Database Foundation
SQLAlchemy 2.0 Models, Connection Management, and Encryption.
"""

from .connection import get_engine, get_session_factory, get_db, get_db_session, init_db, ensure_database_ready
from .models import (
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

__all__ = [
    "get_engine",
    "get_session_factory",
    "get_db",
    "get_db_session",
    "init_db",
    "Base",
    "User",
    "UserPreference",
    "ConnectedSocialAccount",
    "ApiIntegrationMetadata",
    "SocialPost",
    "EngagementMetric",
    "Comment",
    "Prediction",
    "SentimentReport",
    "SentimentComment",
    "ContentDraft",
    "ContentCalendar",
    "Dataset",
    "DatasetVersion",
    "ModelVersion",
    "TrainingRun",
    "SYSTEM_DEMO_WORKSPACE_ID",
    "SYSTEM_DEMO_USER_ID",
]
