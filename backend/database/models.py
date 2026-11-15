"""
CreatorPulse AI - Relational Database Schema
SQLAlchemy 2.0 declarative models supporting both SQLite (testing/local) and PostgreSQL (production).
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    Uuid,
    JSON,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)

from .security import encrypt_secret, decrypt_secret

# Deterministic Identifiers for System Demo Workspace & Legacy Data Ownership
SYSTEM_DEMO_WORKSPACE_ID: uuid.UUID = uuid.UUID("00000000-0000-4000-a000-000000000001")
SYSTEM_DEMO_USER_ID: uuid.UUID = uuid.UUID("00000000-0000-4000-a000-000000000002")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    """Base declarative class for CreatorPulse AI."""
    pass


# 1. Users
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="creator", nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    preference: Mapped[Optional["UserPreference"]] = relationship(
        "UserPreference", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    connected_accounts: Mapped[List["ConnectedSocialAccount"]] = relationship(
        "ConnectedSocialAccount", back_populates="user", cascade="all, delete-orphan"
    )
    api_integrations: Mapped[List["ApiIntegrationMetadata"]] = relationship(
        "ApiIntegrationMetadata", back_populates="user", cascade="all, delete-orphan"
    )


# 2. User Preferences
class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    active_data_source: Mapped[str] = mapped_column(String(50), default="sample", nullable=False)
    theme: Mapped[str] = mapped_column(String(50), default="dark", nullable=False)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="preference")


# 3. Connected Social Accounts
class ConnectedSocialAccount(Base):
    __tablename__ = "connected_social_accounts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    account_handle: Mapped[str] = mapped_column(String(255), nullable=False)
    account_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    follower_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    baseline_engagement_rate: Mapped[float] = mapped_column(Float, default=0.05, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "platform", "account_handle", name="uq_account_workspace_platform_handle"),
    )

    user: Mapped["User"] = relationship("User", back_populates="connected_accounts")
    posts: Mapped[List["SocialPost"]] = relationship("SocialPost", back_populates="account")


# 4. API Integration Metadata (Backend secret encryption applied)
class ApiIntegrationMetadata(Base):
    __tablename__ = "api_integration_metadata"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    provider_id: Mapped[str] = mapped_column(String(50), nullable=False)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    encrypted_secret: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    key_masked: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_tested_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    health_status: Mapped[str] = mapped_column(String(50), default="unconfigured", nullable=False)
    quota_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quota_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "provider_id", name="uq_integration_workspace_provider"),
    )

    user: Mapped["User"] = relationship("User", back_populates="api_integrations")

    @property
    def secret_plaintext(self) -> Optional[str]:
        return decrypt_secret(self.encrypted_secret)

    @secret_plaintext.setter
    def secret_plaintext(self, value: Optional[str]) -> None:
        self.encrypted_secret = encrypt_secret(value)


# 5. Social Posts
class SocialPost(Base):
    __tablename__ = "social_posts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    account_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("connected_social_accounts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    platform: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    external_post_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    caption: Mapped[str] = mapped_column(Text, default="", nullable=False)
    post_type: Mapped[str] = mapped_column(String(50), index=True, default="post", nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments_count: Mapped[int] = mapped_column("comments", Integer, default=0, nullable=False)
    shares: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    impressions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engagement_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    breakout_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    media_urls: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "platform", "external_post_id", name="uq_post_workspace_platform_external_id"),
        Index("ix_social_posts_time_platform", "platform", "published_at"),
    )

    account: Mapped[Optional["ConnectedSocialAccount"]] = relationship("ConnectedSocialAccount", back_populates="posts")
    metrics: Mapped[List["EngagementMetric"]] = relationship(
        "EngagementMetric", back_populates="post", cascade="all, delete-orphan"
    )
    comments: Mapped[List["Comment"]] = relationship(
        "Comment", back_populates="post", cascade="all, delete-orphan"
    )


# 6. Engagement Metrics
class EngagementMetric(Base):
    __tablename__ = "engagement_metrics"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("social_posts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    platform: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    snapshot_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    views: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comments: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shares: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    impressions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    engagement_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    followers_gained: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    post: Mapped[Optional["SocialPost"]] = relationship("SocialPost", back_populates="metrics")


# 7. Comments
class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("social_posts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    external_comment_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    author: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    likes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    theme: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_question: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("workspace_id", "platform", "external_comment_id", name="uq_comment_workspace_platform_external_id"),
    )

    post: Mapped[Optional["SocialPost"]] = relationship("SocialPost", back_populates="comments")


# 8. Predictions
class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    content_topic: Mapped[str] = mapped_column(String(255), default="General", nullable=False)
    format_type: Mapped[str] = mapped_column(String(50), default="short", nullable=False)
    p_success: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_low: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_high: Mapped[float] = mapped_column(Float, nullable=False)
    recommendation: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    top_features: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    simulated_actual_viral: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    actual_views: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_engagement_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    brier_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)


# 9. Sentiment Reports
class SentimentReport(Base):
    __tablename__ = "sentiment_reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), default="", nullable=False)
    title: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    creator: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    dominant_vibe: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    total_comments: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sentiment_breakdown: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    themes: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    audience_voice: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    sentiment_comments: Mapped[List["SentimentComment"]] = relationship(
        "SentimentComment", back_populates="report", cascade="all, delete-orphan"
    )


# 10. Sentiment Comments
class SentimentComment(Base):
    __tablename__ = "sentiment_comments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("sentiment_reports.report_id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    author: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(50), default="neutral", nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    report: Mapped["SentimentReport"] = relationship("SentimentReport", back_populates="sentiment_comments")


# 11. Content Drafts
class ContentDraft(Base):
    __tablename__ = "content_drafts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    draft_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    platform: Mapped[str] = mapped_column(String(50), default="youtube", nullable=False)
    format_type: Mapped[str] = mapped_column(String(50), default="short", nullable=False)
    target_audience: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hook: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    language: Mapped[str] = mapped_column(String(50), default="English", nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    predicted_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, index=True, nullable=False)

    calendar_entry: Mapped[Optional["ContentCalendar"]] = relationship(
        "ContentCalendar", back_populates="draft", cascade="all, delete-orphan", uselist=False
    )


# 12. Content Calendar
class ContentCalendar(Base):
    __tablename__ = "content_calendar"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    draft_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("content_drafts.draft_id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    slot_type: Mapped[str] = mapped_column(String(50), default="optimal", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="scheduled", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    draft: Mapped["ContentDraft"] = relationship("ContentDraft", back_populates="calendar_entry")


# 13. Datasets
class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="sample", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    bad_rows_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    versions: Mapped[List["DatasetVersion"]] = relationship(
        "DatasetVersion", back_populates="dataset", cascade="all, delete-orphan"
    )


# 14. Dataset Versions
class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("dataset_id", "version_number", name="uq_dataset_version"),
    )

    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="versions")
    training_runs: Mapped[List["TrainingRun"]] = relationship("TrainingRun", back_populates="dataset_version")


# 15. Model Versions
class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_tag: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    algorithm: Mapped[str] = mapped_column(String(100), default="HistGradientBoostingClassifier", nullable=False)
    accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    f1_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    brier_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_artifact_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    hyperparameters: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    training_runs: Mapped[List["TrainingRun"]] = relationship(
        "TrainingRun", back_populates="model_version", cascade="all, delete-orphan"
    )


# 16. Training Runs
class TrainingRun(Base):
    __tablename__ = "training_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_version_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("model_versions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dataset_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("dataset_versions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)
    metrics_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    model_version: Mapped["ModelVersion"] = relationship("ModelVersion", back_populates="training_runs")
    dataset_version: Mapped[Optional["DatasetVersion"]] = relationship("DatasetVersion", back_populates="training_runs")
