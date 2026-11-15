"""
CreatorPulse AI - Idempotent JSON Seeder
Imports existing JSON data assets into relational SQLAlchemy tables.
Guarantees idempotency: repeated execution creates zero duplicates.
"""

import os
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Set, Tuple
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import (
    User,
    UserPreference,
    ConnectedSocialAccount,
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
    SYSTEM_DEMO_WORKSPACE_ID,
    SYSTEM_DEMO_USER_ID,
)

logger = logging.getLogger("creatorpulse.seeder")


def _parse_datetime(val: Any) -> datetime:
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if not val or not isinstance(val, str):
        return datetime.now(timezone.utc)
    cleaned = val.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(cleaned)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        # Try date only format
        try:
            dt = datetime.strptime(cleaned, "%Y-%m-%d")
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            return datetime.now(timezone.utc)


def _norm_date(dt: Any) -> str:
    if hasattr(dt, "strftime"):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)


def _load_file(data_dir: str, filename: str) -> Any:
    path = os.path.join(data_dir, filename)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to read {filename}: {e}")
        return []


def seed_from_json(
    session: Session,
    data_dir: Optional[str] = None,
    workspace_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
) -> Dict[str, int]:
    """
    Idempotently seeds relational database from JSON storage files.
    Repeated execution does not create duplicate entries.
    """
    if data_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(base_dir, "data")

    ws_id = workspace_id or SYSTEM_DEMO_WORKSPACE_ID
    u_id = user_id or SYSTEM_DEMO_USER_ID

    stats = {
        "users": 0,
        "user_preferences": 0,
        "connected_social_accounts": 0,
        "social_posts": 0,
        "engagement_metrics": 0,
        "comments": 0,
        "predictions": 0,
        "content_drafts": 0,
        "content_calendar": 0,
        "sentiment_reports": 0,
        "sentiment_comments": 0,
        "datasets": 0,
        "dataset_versions": 0,
    }

    # 1. Seed Demo User
    existing_user = session.get(User, u_id)
    if not existing_user:
        user_by_email = session.execute(select(User).where(User.email == "demo@creatorpulse.ai")).scalar_one_or_none()
        if user_by_email:
            existing_user = user_by_email
        else:
            demo_user = User(
                id=u_id,
                email="demo@creatorpulse.ai",
                name="Demo Creator",
                role="creator",
                workspace_id=ws_id,
            )
            session.add(demo_user)
            session.flush()
            stats["users"] += 1
            existing_user = demo_user

    # 2. Seed User Preferences from data_source_state.json
    state_data = _load_file(data_dir, "data_source_state.json")
    if not isinstance(state_data, dict):
        state_data = {"active_source": "sample"}

    existing_pref = session.execute(
        select(UserPreference).where(UserPreference.user_id == existing_user.id)
    ).scalar_one_or_none()
    if not existing_pref:
        pref = UserPreference(
            user_id=existing_user.id,
            active_data_source=state_data.get("active_source", "sample"),
            theme="dark",
            notifications_enabled=True,
            metadata_json=state_data,
        )
        session.add(pref)
        session.flush()
        stats["user_preferences"] += 1

    # 3. Seed Connected Social Accounts from creators.json
    creators_data = _load_file(data_dir, "creators.json")
    creator_account_map: Dict[str, uuid.UUID] = {}

    existing_accounts = session.execute(
        select(ConnectedSocialAccount).where(ConnectedSocialAccount.workspace_id == ws_id)
    ).scalars().all()
    account_lookup = {
        (acc.platform.lower(), acc.account_handle.lower()): acc for acc in existing_accounts
    }
    for acc in existing_accounts:
        if acc.account_id:
            creator_account_map[acc.account_id] = acc.id

    if isinstance(creators_data, list):
        for c in creators_data:
            platform = c.get("platform", "all").lower()
            handle = c.get("handle", "@creator").lower()
            key = (platform, handle)

            if key not in account_lookup:
                new_acc = ConnectedSocialAccount(
                    user_id=existing_user.id,
                    workspace_id=ws_id,
                    platform=platform,
                    account_handle=c.get("handle", "@creator"),
                    account_id=c.get("creator_id"),
                    display_name=c.get("name", "Creator"),
                    follower_count=c.get("follower_count", 0),
                    baseline_engagement_rate=float(c.get("baseline_engagement_rate", 0.05)),
                    avatar_url=c.get("avatar", ""),
                    status="active",
                )
                session.add(new_acc)
                session.flush()
                account_lookup[key] = new_acc
                stats["connected_social_accounts"] += 1
                if c.get("creator_id"):
                    creator_account_map[c["creator_id"]] = new_acc.id
            else:
                acc_obj = account_lookup[key]
                if c.get("creator_id"):
                    creator_account_map[c["creator_id"]] = acc_obj.id

    # 4. Seed Social Posts from posts.json and uploaded_posts.json
    posts_data = _load_file(data_dir, "posts.json")
    uploaded_posts_data = _load_file(data_dir, "uploaded_posts.json")

    existing_post_ids: Set[Tuple[str, str]] = set(
        session.execute(
            select(SocialPost.platform, SocialPost.external_post_id).where(SocialPost.workspace_id == ws_id)
        ).all()
    )

    # 4a. Sample posts (1,800)
    if isinstance(posts_data, list):
        for p in posts_data:
            ext_id = str(p.get("post_id") or p.get("external_id") or "")
            plat = p.get("platform", "unknown").lower()
            if not ext_id or (plat, ext_id) in existing_post_ids:
                continue

            acc_id = creator_account_map.get(p.get("creator_id"))
            views = int(p.get("views", 0))
            likes = int(p.get("likes", 0))
            comments = int(p.get("comments", 0))
            shares = int(p.get("shares", 0))
            impressions = int(p.get("impressions", views or 1))
            er = float(p.get("engagement_rate", 0.0))

            new_post = SocialPost(
                workspace_id=ws_id,
                account_id=acc_id,
                platform=plat,
                external_post_id=ext_id,
                caption=p.get("title") or p.get("caption") or "",
                post_type=p.get("post_type", "post"),
                published_at=_parse_datetime(p.get("published_at")),
                views=views,
                likes=likes,
                comments_count=comments,
                shares=shares,
                impressions=impressions,
                engagement_rate=er,
                breakout_score=1.0 if p.get("is_breakout") else 0.0,
                topic=p.get("topic") or p.get("category"),
                is_synthetic=True,
            )
            session.add(new_post)
            existing_post_ids.add((plat, ext_id))
            stats["social_posts"] += 1

    # 4b. Uploaded CSV posts (preserves workspace ownership & non-synthetic flag)
    if isinstance(uploaded_posts_data, list):
        for p in uploaded_posts_data:
            ext_id = str(p.get("post_id") or p.get("external_id") or "")
            plat = p.get("platform", "all").lower()
            if not ext_id or (plat, ext_id) in existing_post_ids:
                continue

            views = int(p.get("views", 0))
            likes = int(p.get("likes", 0))
            comments = int(p.get("comments", 0))
            shares = int(p.get("shares", 0))
            impressions = int(p.get("impressions", views or 1))
            er = float(p.get("engagement_rate", 0.0))

            new_post = SocialPost(
                workspace_id=ws_id,
                platform=plat,
                external_post_id=ext_id,
                caption=p.get("caption") or p.get("title") or "",
                post_type=p.get("post_type", "post"),
                published_at=_parse_datetime(p.get("published_at")),
                views=views,
                likes=likes,
                comments_count=comments,
                shares=shares,
                impressions=impressions,
                engagement_rate=er,
                breakout_score=1.0 if p.get("is_breakout") else 0.0,
                is_synthetic=False,
            )
            session.add(new_post)
            existing_post_ids.add((plat, ext_id))
            stats["social_posts"] += 1

    session.flush()

    # 5. Seed Metric Snapshots from metric_snapshots.json
    snapshots_data = _load_file(data_dir, "metric_snapshots.json")
    if isinstance(snapshots_data, list):
        existing_snapshots = set(
            (row[0].lower() if row[0] else "", _norm_date(row[1]))
            for row in session.execute(
                select(EngagementMetric.platform, EngagementMetric.snapshot_time)
                .where(EngagementMetric.workspace_id == ws_id)
            ).all()
        )

        for s in snapshots_data:
            plat = s.get("platform", "all").lower()
            snap_time = _parse_datetime(s.get("date"))
            norm_key = (plat, _norm_date(snap_time))
            if norm_key in existing_snapshots:
                continue

            metric = EngagementMetric(
                workspace_id=ws_id,
                platform=plat,
                snapshot_time=snap_time,
                views=int(s.get("views", 0)),
                likes=int(s.get("likes", 0)),
                comments=int(s.get("comments", 0)),
                shares=int(s.get("shares", 0)),
                impressions=int(s.get("views", 0)),
                engagement_rate=float(s.get("engagement_rate", 0.0)),
                followers_gained=int(s.get("followers_gained", 0)),
            )
            session.add(metric)
            existing_snapshots.add(norm_key)
            stats["engagement_metrics"] += 1

    session.flush()

    # 6. Seed Comments from comments.json
    comments_data = _load_file(data_dir, "comments.json")
    if isinstance(comments_data, list):
        existing_comments = set(
            session.execute(
                select(Comment.platform, Comment.external_comment_id).where(Comment.workspace_id == ws_id)
            ).all()
        )

        for c in comments_data:
            plat = c.get("platform", "youtube").lower()
            c_id = str(c.get("comment_id") or "")
            if not c_id or (plat, c_id) in existing_comments:
                continue

            new_comment = Comment(
                workspace_id=ws_id,
                platform=plat,
                external_comment_id=c_id,
                author=c.get("author", "Anonymous"),
                text=c.get("text", ""),
                sentiment=c.get("sentiment", "neutral"),
                sentiment_score=float(c.get("sentiment_score", 0.0)) if c.get("sentiment_score") is not None else None,
                likes=int(c.get("likes", 0)),
                theme=c.get("theme"),
                is_question=bool(c.get("is_question", False)),
                published_at=_parse_datetime(c.get("published_at")),
            )
            session.add(new_comment)
            existing_comments.add((plat, c_id))
            stats["comments"] += 1

    session.flush()

    # 7. Seed Predictions from predictions.json
    predictions_data = _load_file(data_dir, "predictions.json")
    if isinstance(predictions_data, list):
        existing_predictions = set(
            session.execute(
                select(Prediction.prediction_id).where(Prediction.workspace_id == ws_id)
            ).scalars().all()
        )

        for p in predictions_data:
            p_id = str(p.get("prediction_id") or "")
            if not p_id or p_id in existing_predictions:
                continue

            prob = float(p.get("predicted_prob", 0.5))
            low = float(p.get("range_low_percent", max(0.0, prob * 100 - 10))) / 100.0
            high = float(p.get("range_high_percent", min(100.0, prob * 100 + 10))) / 100.0
            actual_out = p.get("actual_outcome")
            sim_viral = None
            brier = None
            actual_views = None
            actual_er = None
            if isinstance(actual_out, bool):
                sim_viral = actual_out
                y_true = 1.0 if sim_viral else 0.0
                brier = round((prob - y_true) ** 2, 4)
            elif isinstance(actual_out, dict):
                sim_viral = bool(actual_out.get("went_viral", False))
                y_true = 1.0 if sim_viral else 0.0
                brier = round((prob - y_true) ** 2, 4)
                actual_views = actual_out.get("actual_views")
                actual_er = actual_out.get("actual_engagement_rate")

            new_pred = Prediction(
                prediction_id=p_id,
                workspace_id=ws_id,
                platform=p.get("platform", "general"),
                content_topic=p.get("title") or "General",
                format_type=p.get("post_type", "short"),
                p_success=prob,
                confidence_low=low,
                confidence_high=high,
                recommendation=p.get("strictness_label") or "Analyzed",
                top_features=p.get("top_reasons") or [],
                simulated_actual_viral=sim_viral,
                actual_views=actual_views,
                actual_engagement_rate=actual_er,
                brier_score=brier,
                metadata_json=p,
                created_at=_parse_datetime(p.get("created_at")),
            )
            session.add(new_pred)
            existing_predictions.add(p_id)
            stats["predictions"] += 1

    session.flush()

    # 8. Seed Content Drafts & Calendar from drafts.json
    drafts_data = _load_file(data_dir, "drafts.json")
    if isinstance(drafts_data, list):
        existing_draft_ids = set(
            session.execute(
                select(ContentDraft.draft_id).where(ContentDraft.workspace_id == ws_id)
            ).scalars().all()
        )
        existing_calendar_draft_ids = set(
            session.execute(
                select(ContentCalendar.draft_id).where(ContentCalendar.workspace_id == ws_id)
            ).scalars().all()
        )

        for d in drafts_data:
            d_id = str(d.get("draft_id") or d.get("id") or "")
            if not d_id or d_id in existing_draft_ids:
                continue

            content_val = d.get("content_payload") or d.get("hook") or d.get("title") or ""
            if isinstance(content_val, (dict, list)):
                content_text = json.dumps(content_val, ensure_ascii=False)
            else:
                content_text = str(content_val)

            new_draft = ContentDraft(
                draft_id=d_id,
                workspace_id=ws_id,
                user_id=existing_user.id,
                title=d.get("title", "Untitled Draft"),
                content=content_text,
                platform=d.get("platform", "youtube"),
                format_type="short",
                hook=d.get("hook"),
                language=d.get("language", "English"),
                tags=d.get("tags", []),
                status=d.get("status", "draft"),
                created_at=_parse_datetime(d.get("created_at")),
            )
            session.add(new_draft)
            existing_draft_ids.add(d_id)
            stats["content_drafts"] += 1

            # Seed calendar entry if scheduled_date exists
            sched_date = d.get("scheduled_date")
            if sched_date and d_id not in existing_calendar_draft_ids:
                cal_entry = ContentCalendar(
                    draft_id=d_id,
                    workspace_id=ws_id,
                    scheduled_date=_parse_datetime(sched_date),
                    status="scheduled",
                )
                session.add(cal_entry)
                existing_calendar_draft_ids.add(d_id)
                stats["content_calendar"] += 1

    session.flush()

    # 9. Seed Sentiment Reports & Sentiment Comments from vibecheck_reports.json
    reports_data = _load_file(data_dir, "vibecheck_reports.json")
    if isinstance(reports_data, list):
        existing_reports = set(
            session.execute(
                select(SentimentReport.report_id).where(SentimentReport.workspace_id == ws_id)
            ).scalars().all()
        )

        for r in reports_data:
            r_id = str(r.get("report_id") or "")
            if not r_id or r_id in existing_reports:
                continue

            full_an = r.get("full_analysis") or {}
            new_report = SentimentReport(
                report_id=r_id,
                workspace_id=ws_id,
                platform=r.get("platform", "youtube"),
                url=r.get("post_url") or "",
                title=r.get("title", "Audience Analysis"),
                creator=r.get("author", "Creator"),
                dominant_vibe=r.get("dominant_vibe"),
                total_comments=int(r.get("comment_count", 0)),
                sentiment_score=float(r.get("vibe_score", 50.0)),
                summary=r.get("summary"),
                sentiment_breakdown={
                    "positive_pct": r.get("positive_pct", 0.0),
                    "negative_pct": r.get("negative_pct", 0.0),
                    "neutral_pct": max(0.0, 100.0 - float(r.get("positive_pct", 0.0)) - float(r.get("negative_pct", 0.0))),
                },
                themes=full_an.get("key_themes", []),
                audience_voice=full_an.get("audience_voice", {}),
                analyzed_at=_parse_datetime(r.get("created_at")),
            )
            session.add(new_report)
            existing_reports.add(r_id)
            stats["sentiment_reports"] += 1

            # If report has analyzed comments inside full_analysis, seed them
            rep_comments = full_an.get("analyzed_comments") or full_an.get("sample_comments") or []
            if isinstance(rep_comments, list):
                for sc in rep_comments:
                    s_comment = SentimentComment(
                        report_id=r_id,
                        workspace_id=ws_id,
                        author=sc.get("author", "Viewer"),
                        text=sc.get("text", ""),
                        sentiment=sc.get("sentiment", "neutral"),
                        score=float(sc.get("score", 0.0)),
                        likes=int(sc.get("likes", 0)),
                    )
                    session.add(s_comment)
                    stats["sentiment_comments"] += 1

    session.flush()

    # 10. Seed Datasets & Trends
    trends_data = _load_file(data_dir, "trends.json")
    existing_dataset = session.execute(
        select(Dataset).where(Dataset.workspace_id == ws_id, Dataset.name == "Creator Benchmark 2026")
    ).scalar_one_or_none()

    if not existing_dataset:
        dataset = Dataset(
            workspace_id=ws_id,
            name="Creator Benchmark 2026",
            source_type="sample",
            description="Benchmark dataset of 1,800 social media posts and trends.",
            row_count=len(posts_data) if isinstance(posts_data, list) else 1800,
            bad_rows_count=0,
            is_synthetic=True,
        )
        session.add(dataset)
        session.flush()
        stats["datasets"] += 1

        v1 = DatasetVersion(
            dataset_id=dataset.id,
            version_number=1,
            row_count=dataset.row_count,
            metadata_json={"trends": trends_data if isinstance(trends_data, list) else []},
        )
        session.add(v1)
        session.flush()
        stats["dataset_versions"] += 1

    session.commit()
    logger.info(f"Database seeder completed successfully. Imported stats: {stats}")
    return stats
