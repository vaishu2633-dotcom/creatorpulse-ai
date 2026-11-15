"""
CreatorPulse AI - VibeCheck & Sentiment Repository
Handles persistence and querying of audience sentiment analysis reports and comments.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, joinedload

from ..models import (
    SentimentReport,
    SentimentComment,
    Comment,
    SYSTEM_DEMO_WORKSPACE_ID,
)


def _report_to_dict(r: SentimentReport) -> Dict[str, Any]:
    breakdown = r.sentiment_breakdown or {}
    comments_list = []
    if r.sentiment_comments:
        for sc in r.sentiment_comments:
            comments_list.append({
                "comment_id": str(sc.id),
                "author": sc.author,
                "text": sc.text,
                "sentiment": sc.sentiment,
                "compound_score": sc.score,
                "score": sc.score,
                "likes": sc.likes,
            })

    full_analysis = {
        "key_themes": r.themes or [],
        "audience_voice": r.audience_voice or {},
        "comments": comments_list,
        "analyzed_comments": comments_list,
    }

    return {
        "report_id": r.report_id,
        "title": r.title,
        "platform": r.platform,
        "author": r.creator,
        "post_url": r.url,
        "vibe_score": r.sentiment_score,
        "dominant_vibe": r.dominant_vibe or "Neutral",
        "comment_count": r.total_comments,
        "positive_pct": breakdown.get("positive_pct", 0.0),
        "negative_pct": breakdown.get("negative_pct", 0.0),
        "neutral_pct": breakdown.get("neutral_pct", 0.0),
        "summary": r.summary or "",
        "full_analysis": full_analysis,
        "created_at": r.analyzed_at.isoformat() if r.analyzed_at else "",
    }


def get_vibecheck_reports(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    stmt = (
        select(SentimentReport)
        .options(joinedload(SentimentReport.sentiment_comments))
        .where(SentimentReport.workspace_id == workspace_id)
        .order_by(desc(SentimentReport.analyzed_at))
    )
    if limit and limit > 0:
        stmt = stmt.limit(limit)

    reports = session.scalars(stmt).unique().all()
    return [_report_to_dict(r) for r in reports]


def get_vibecheck_report(
    session: Session,
    workspace_id: uuid.UUID,
    report_id: str,
) -> Optional[Dict[str, Any]]:
    report = session.scalar(
        select(SentimentReport)
        .options(joinedload(SentimentReport.sentiment_comments))
        .where(
            SentimentReport.workspace_id == workspace_id,
            SentimentReport.report_id == report_id,
        )
    )
    if not report:
        return None
    return _report_to_dict(report)


def save_vibecheck_report(
    session: Session,
    workspace_id: uuid.UUID,
    report_data: Dict[str, Any],
) -> Dict[str, Any]:
    r_id = report_data.get("report_id") or f"vibe_{uuid.uuid4().hex[:8]}"
    report_data["report_id"] = r_id

    created_iso = report_data.get("created_at") or datetime.now(timezone.utc).isoformat()
    report_data["created_at"] = created_iso

    try:
        dt = datetime.fromisoformat(created_iso.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.now(timezone.utc)

    fa = report_data.get("full_analysis") or {}
    themes = fa.get("key_themes") or report_data.get("themes") or []
    audience_voice = fa.get("audience_voice") or report_data.get("audience_voice") or {}

    new_report = SentimentReport(
        report_id=r_id,
        workspace_id=workspace_id,
        platform=report_data.get("platform", "youtube"),
        url=report_data.get("post_url") or "",
        title=report_data.get("title", "Audience Analysis"),
        creator=report_data.get("author", "Creator"),
        dominant_vibe=report_data.get("dominant_vibe") or "Neutral",
        total_comments=int(report_data.get("comment_count", 0)),
        sentiment_score=float(report_data.get("vibe_score", 50.0)),
        summary=report_data.get("summary") or "",
        sentiment_breakdown={
            "positive_pct": float(report_data.get("positive_pct", 0.0)),
            "negative_pct": float(report_data.get("negative_pct", 0.0)),
            "neutral_pct": float(report_data.get("neutral_pct", 0.0)),
        },
        themes=themes,
        audience_voice=audience_voice,
        analyzed_at=dt,
    )
    session.add(new_report)

    # Comments in full_analysis
    raw_comments = fa.get("comments") or fa.get("analyzed_comments") or []
    for c in raw_comments:
        sc = SentimentComment(
            report_id=r_id,
            workspace_id=workspace_id,
            author=c.get("author", "Viewer"),
            text=c.get("text", ""),
            sentiment=c.get("sentiment", "neutral"),
            score=float(c.get("compound_score") or c.get("score") or 0.0),
            likes=int(c.get("like_count") or c.get("likes") or 0),
        )
        session.add(sc)

    session.flush()
    return report_data


def delete_vibecheck_report(
    session: Session,
    workspace_id: uuid.UUID,
    report_id: str,
) -> bool:
    report = session.scalar(
        select(SentimentReport).where(
            SentimentReport.workspace_id == workspace_id,
            SentimentReport.report_id == report_id,
        )
    )
    if not report:
        return False
    session.delete(report)
    session.flush()
    return True


def get_comments(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    stmt = (
        select(Comment)
        .where(Comment.workspace_id == workspace_id)
        .order_by(desc(Comment.published_at))
    )
    if platform and platform.lower() != "all":
        stmt = stmt.where(Comment.platform == platform.lower())
    if limit and limit > 0:
        stmt = stmt.limit(limit)

    comments = session.scalars(stmt).all()
    return [
        {
            "comment_id": c.external_comment_id,
            "platform": c.platform,
            "author": c.author,
            "text": c.text,
            "sentiment": c.sentiment,
            "sentiment_score": c.sentiment_score,
            "compound_score": c.sentiment_score,
            "theme": c.theme or "General Feedback",
            "is_question": c.is_question,
            "like_count": c.likes,
            "published_at": c.published_at.isoformat() if c.published_at else "",
        }
        for c in comments
    ]
