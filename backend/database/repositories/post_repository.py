"""
CreatorPulse AI - Post & Analytics Repository
Handles querying and persisting social posts, creator accounts, and metric snapshots.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc, asc, func, delete
from sqlalchemy.orm import Session, joinedload

from ..models import (
    SocialPost,
    EngagementMetric,
    ConnectedSocialAccount,
    SYSTEM_DEMO_WORKSPACE_ID,
)


def _post_to_dict(p: SocialPost) -> Dict[str, Any]:
    creator_name = ""
    creator_id = ""
    if p.account:
        creator_name = p.account.display_name
        creator_id = p.account.account_id or str(p.account.id)

    pub_iso = p.published_at.isoformat() if p.published_at else ""

    return {
        "post_id": p.external_post_id,
        "creator_id": creator_id,
        "creator_name": creator_name,
        "platform": p.platform,
        "post_type": p.post_type,
        "title": p.caption,
        "caption": p.caption,
        "published_at": pub_iso,
        "views": p.views,
        "likes": p.likes,
        "comments": p.comments_count,
        "shares": p.shares,
        "impressions": p.impressions,
        "engagement_rate": p.engagement_rate,
        "is_breakout": bool(p.breakout_score and p.breakout_score > 0),
        "breakout_score": p.breakout_score,
        "topic": p.topic,
        "url": p.url,
        "media_urls": p.media_urls,
        "is_synthetic": p.is_synthetic,
    }


def get_posts(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    post_type: Optional[str] = None,
    days: Optional[int] = None,
    limit: Optional[int] = None,
    sort_by: str = "published_at",
    descending: bool = True,
    is_synthetic: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    stmt = (
        select(SocialPost)
        .options(joinedload(SocialPost.account))
        .where(SocialPost.workspace_id == workspace_id)
    )

    if platform and platform.lower() != "all":
        stmt = stmt.where(func.lower(SocialPost.platform) == platform.lower())

    if post_type and post_type.lower() != "all":
        stmt = stmt.where(func.lower(SocialPost.post_type) == post_type.lower())

    if is_synthetic is not None:
        stmt = stmt.where(SocialPost.is_synthetic == is_synthetic)

    # Days filter relative to newest post in workspace
    if days and days > 0:
        max_pub = session.scalar(
            select(func.max(SocialPost.published_at)).where(SocialPost.workspace_id == workspace_id)
        )
        if max_pub:
            cutoff = max_pub - timedelta(days=days)
            stmt = stmt.where(SocialPost.published_at >= cutoff)

    # Sorting
    col = getattr(SocialPost, sort_by, SocialPost.published_at)
    stmt = stmt.order_by(desc(col) if descending else asc(col))

    if limit and limit > 0:
        stmt = stmt.limit(limit)

    posts = session.scalars(stmt).all()
    return [_post_to_dict(p) for p in posts]


def get_top_posts(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    metric: str = "engagement_rate",
    limit: int = 5,
    is_synthetic: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    return get_posts(
        session=session,
        workspace_id=workspace_id,
        platform=platform,
        sort_by=metric,
        descending=True,
        limit=limit,
        is_synthetic=is_synthetic,
    )


def get_bottom_posts(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    metric: str = "engagement_rate",
    limit: int = 5,
    is_synthetic: Optional[bool] = None,
) -> List[Dict[str, Any]]:
    return get_posts(
        session=session,
        workspace_id=workspace_id,
        platform=platform,
        sort_by=metric,
        descending=False,
        limit=limit,
        is_synthetic=is_synthetic,
    )


def get_metric_snapshots(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    days: int = 30,
) -> List[Dict[str, Any]]:
    stmt = select(EngagementMetric).where(EngagementMetric.workspace_id == workspace_id)
    if platform and platform.lower() != "all":
        stmt = stmt.where(func.lower(EngagementMetric.platform) == platform.lower())

    if days and days > 0:
        max_time = session.scalar(
            select(func.max(EngagementMetric.snapshot_time)).where(EngagementMetric.workspace_id == workspace_id)
        )
        if max_time:
            cutoff = max_time - timedelta(days=days)
            stmt = stmt.where(EngagementMetric.snapshot_time >= cutoff)

    stmt = stmt.order_by(asc(EngagementMetric.snapshot_time))
    snapshots = session.scalars(stmt).all()

    return [
        {
            "date": s.snapshot_time.strftime("%Y-%m-%d"),
            "platform": s.platform or "all",
            "views": s.views,
            "likes": s.likes,
            "comments": s.comments,
            "shares": s.shares,
            "engagement_rate": s.engagement_rate,
            "followers_gained": s.followers_gained,
        }
        for s in snapshots
    ]


def get_creators(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
) -> List[Dict[str, Any]]:
    stmt = select(ConnectedSocialAccount).where(ConnectedSocialAccount.workspace_id == workspace_id)
    if platform and platform.lower() != "all":
        stmt = stmt.where(
            func.lower(ConnectedSocialAccount.platform).in_([platform.lower(), "all"])
        )

    accounts = session.scalars(stmt).all()
    return [
        {
            "creator_id": a.account_id or str(a.id),
            "name": a.display_name,
            "handle": a.account_handle,
            "platform": a.platform,
            "follower_count": a.follower_count,
            "baseline_engagement_rate": a.baseline_engagement_rate,
            "category": "Creator Analytics",
            "avatar": a.avatar_url or "",
        }
        for a in accounts
    ]


def get_creator_by_id(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    creator_id: str = "",
) -> Optional[Dict[str, Any]]:
    stmt = select(ConnectedSocialAccount).where(
        ConnectedSocialAccount.workspace_id == workspace_id,
        (ConnectedSocialAccount.account_id == creator_id) | (func.cast(ConnectedSocialAccount.id, str) == creator_id),
    )
    acc = session.scalar(stmt)
    if not acc:
        return None
    return {
        "creator_id": acc.account_id or str(acc.id),
        "name": acc.display_name,
        "handle": acc.account_handle,
        "platform": acc.platform,
        "follower_count": acc.follower_count,
        "baseline_engagement_rate": acc.baseline_engagement_rate,
        "category": "Creator Analytics",
        "avatar": acc.avatar_url or "",
    }


def save_posts(
    session: Session,
    workspace_id: uuid.UUID,
    posts_data: List[Dict[str, Any]],
    is_synthetic: bool = False,
) -> int:
    """Inserts or updates posts preserving unique constraints."""
    saved_count = 0
    for p in posts_data:
        ext_id = str(p.get("post_id") or p.get("external_id") or "")
        plat = p.get("platform", "youtube").lower()
        if not ext_id:
            continue

        existing = session.scalar(
            select(SocialPost).where(
                SocialPost.workspace_id == workspace_id,
                SocialPost.platform == plat,
                SocialPost.external_post_id == ext_id,
            )
        )

        pub_at = p.get("published_at")
        if isinstance(pub_at, str):
            try:
                pub_at = datetime.fromisoformat(pub_at.replace("Z", "+00:00"))
            except Exception:
                pub_at = datetime.now(timezone.utc)
        elif not isinstance(pub_at, datetime):
            pub_at = datetime.now(timezone.utc)

        views = int(p.get("views", 0))
        likes = int(p.get("likes", 0))
        comments = int(p.get("comments", 0))
        shares = int(p.get("shares", 0))
        impressions = int(p.get("impressions", views or 1))
        er = float(p.get("engagement_rate", 0.0))

        if existing:
            existing.views = views
            existing.likes = likes
            existing.comments_count = comments
            existing.shares = shares
            existing.impressions = impressions
            existing.engagement_rate = er
        else:
            new_post = SocialPost(
                workspace_id=workspace_id,
                platform=plat,
                external_post_id=ext_id,
                caption=p.get("caption") or p.get("title") or "",
                post_type=p.get("post_type", "post"),
                published_at=pub_at,
                views=views,
                likes=likes,
                comments_count=comments,
                shares=shares,
                impressions=impressions,
                engagement_rate=er,
                is_synthetic=is_synthetic,
            )
            session.add(new_post)
            saved_count += 1

    session.flush()
    return saved_count


def clear_uploaded_posts(session: Session, workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID) -> int:
    """Deletes all non-synthetic (uploaded CSV) posts for the given workspace before a new import."""
    stmt = delete(SocialPost).where(
        SocialPost.workspace_id == workspace_id,
        SocialPost.is_synthetic == False
    )
    res = session.execute(stmt)
    session.flush()
    return res.rowcount
