"""
CreatorPulse AI - Data Access Layer (DAL)
------------------------------------------
ALL data reads and writes across the entire backend application MUST go exclusively
through this service. This guarantees that mock JSON storage can later be swapped
for PostgreSQL, Supabase, DynamoDB, or external APIs without modifying application logic.

Platform-neutral field schema maintained:
- platform, post_type, external_id / post_id, published_at, views, likes, comments, shares, impressions

Active Data Source Architecture:
- 'sample': simulated 1,800 posts for safe prototype exploration
- 'uploaded_csv': user-uploaded platform export (with column validation & bad row reporting)
- 'youtube': live imported videos from a connected YouTube channel via YouTube Data API v3
"""

import os
import json
import uuid
import csv
import io
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")

STATE_FILE = "data_source_state.json"

def _load_json(filename: str) -> Any:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_json(filename: str, data: Any) -> None:
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ----------------- Data Source State -----------------

def get_data_source_state() -> Dict[str, Any]:
    """Loads active data source configuration and provenance state."""
    state = _load_json(STATE_FILE)
    if not isinstance(state, dict) or "active_source" not in state:
        state = {
            "active_source": "sample",
            "last_refreshed": datetime.now(timezone.utc).isoformat(),
            "uploaded_meta": {
                "filename": None,
                "count": len(_load_json("uploaded_posts.json")),
                "imported_at": None,
                "bad_rows_count": 0
            },
            "youtube_meta": {
                "channel_id": None,
                "channel_title": None,
                "channel_handle": None,
                "count": len(_load_json("youtube_posts.json")),
                "imported_at": None
            }
        }
        _save_json(STATE_FILE, state)
    return state

def save_data_source_state(state: Dict[str, Any]) -> None:
    state["last_refreshed"] = datetime.now(timezone.utc).isoformat()
    _save_json(STATE_FILE, state)

def get_active_data_source() -> str:
    state = get_data_source_state()
    return state.get("active_source", "sample")

def set_active_data_source(source: str) -> Dict[str, Any]:
    valid_sources = ["sample", "uploaded_csv", "youtube"]
    if source not in valid_sources:
        raise ValueError(f"Invalid data source '{source}'. Must be one of: {valid_sources}")
    state = get_data_source_state()
    state["active_source"] = source
    save_data_source_state(state)
    return get_system_metadata()

# ----------------- System & Meta -----------------

def get_system_metadata() -> Dict[str, Any]:
    """Returns provenance metadata required by CreatorPulse AI principles."""
    state = get_data_source_state()
    active_source = state.get("active_source", "sample")

    sample_count = len(_load_json("posts.json"))
    uploaded_posts = _load_json("uploaded_posts.json")
    uploaded_count = len(uploaded_posts) if isinstance(uploaded_posts, list) else 0
    yt_posts = _load_json("youtube_posts.json")
    yt_count = len(yt_posts) if isinstance(yt_posts, list) else 0

    if active_source == "uploaded_csv":
        data_source_label = f"Uploaded CSV ({uploaded_count} posts)"
        is_synthetic = False
    elif active_source == "youtube":
        ch_title = state.get("youtube_meta", {}).get("channel_title") or "Channel"
        data_source_label = f"YouTube ({ch_title}, {yt_count} videos)"
        is_synthetic = False
    else:
        data_source_label = f"Sample data (simulated {sample_count} posts)"
        is_synthetic = True

    return {
        "active_source": active_source,
        "data_source": data_source_label,
        "last_refreshed": state.get("last_refreshed", datetime.now(timezone.utc).isoformat()),
        "is_synthetic": is_synthetic,
        "environment": "prototype",
        "counts": {
            "sample": sample_count,
            "uploaded_csv": uploaded_count,
            "youtube": yt_count
        },
        "uploaded_meta": state.get("uploaded_meta", {}),
        "youtube_meta": state.get("youtube_meta", {})
    }

# ----------------- Creators -----------------

def get_creators(platform: Optional[str] = None) -> List[Dict[str, Any]]:
    active_source = get_active_data_source()

    if active_source == "youtube":
        state = get_data_source_state()
        yt_meta = state.get("youtube_meta", {})
        posts = _load_json("youtube_posts.json")
        avg_er = 0.05
        if posts:
            total_views = sum(p.get("views", 0) for p in posts)
            total_eng = sum(p.get("likes", 0) + p.get("comments", 0) for p in posts)
            avg_er = round(total_eng / max(1, total_views), 4)

        creators = [{
            "creator_id": yt_meta.get("channel_id") or "yt_connected_channel",
            "name": yt_meta.get("channel_title") or "Connected YouTube Channel",
            "handle": yt_meta.get("channel_handle") or "@channel",
            "platform": "youtube",
            "follower_count": yt_meta.get("subscriber_count", 0),
            "baseline_engagement_rate": avg_er,
            "category": "YouTube Creator",
            "avatar": ""
        }]
    elif active_source == "uploaded_csv":
        state = get_data_source_state()
        fn = state.get("uploaded_meta", {}).get("filename") or "Uploaded Dataset"
        posts = _load_json("uploaded_posts.json")
        avg_er = 0.05
        if posts:
            total_views = sum(p.get("views", 0) for p in posts)
            total_eng = sum(p.get("likes", 0) + p.get("comments", 0) + p.get("shares", 0) for p in posts)
            avg_er = round(total_eng / max(1, total_views), 4)

        creators = [{
            "creator_id": "c_uploaded_01",
            "name": fn.replace(".csv", "").title(),
            "handle": "@uploaded_creator",
            "platform": "all",
            "follower_count": 0,
            "baseline_engagement_rate": avg_er,
            "category": "Creator Analytics",
            "avatar": ""
        }]
    else:
        creators = _load_json("creators.json")

    if platform and platform.lower() != "all":
        return [c for c in creators if c.get("platform", "").lower() in [platform.lower(), "all"]]
    return creators

def get_creator_by_id(creator_id: str) -> Optional[Dict[str, Any]]:
    creators = get_creators()
    for c in creators:
        if c.get("creator_id") == creator_id:
            return c
    return None

def get_creator_base_rate(platform: str, creator_id: Optional[str] = None) -> float:
    """Returns default or specific creator's historical breakout base rate."""
    creators = get_creators(platform)
    if creator_id:
        for c in creators:
            if c["creator_id"] == creator_id:
                return float(c.get("baseline_engagement_rate", 0.05))
    if creators:
        return float(creators[0].get("baseline_engagement_rate", 0.05))
    return 0.05

# ----------------- Posts & Dashboard -----------------

def get_active_posts_raw() -> List[Dict[str, Any]]:
    """Loads all raw posts for current active data source."""
    active_source = get_active_data_source()
    if active_source == "uploaded_csv":
        return _load_json("uploaded_posts.json")
    elif active_source == "youtube":
        return _load_json("youtube_posts.json")
    else:
        return _load_json("posts.json")

def get_posts(
    platform: Optional[str] = None,
    post_type: Optional[str] = None,
    limit: Optional[int] = None,
    sort_by: str = "published_at",
    descending: bool = True
) -> List[Dict[str, Any]]:
    posts = get_active_posts_raw()
    
    if platform and platform.lower() != "all":
        posts = [p for p in posts if p.get("platform", "").lower() == platform.lower()]
        
    if post_type and post_type.lower() != "all":
        posts = [p for p in posts if p.get("post_type", "").lower() == post_type.lower()]
        
    if sort_by:
        posts = sorted(posts, key=lambda x: x.get(sort_by, 0), reverse=descending)
        
    if limit and limit > 0:
        posts = posts[:limit]
        
    return posts

def get_top_posts(platform: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
    return get_posts(platform=platform, limit=limit, sort_by="engagement_rate", descending=True)

def get_bottom_posts(platform: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
    return get_posts(platform=platform, limit=limit, sort_by="engagement_rate", descending=False)

def get_metric_snapshots(platform: Optional[str] = None, days: int = 30) -> List[Dict[str, Any]]:
    active_source = get_active_data_source()
    if active_source == "sample":
        snapshots = _load_json("metric_snapshots.json")
        if platform and platform.lower() != "all":
            snapshots = [s for s in snapshots if s.get("platform", "").lower() == platform.lower()]
        return snapshots

    # Build dynamic timeline snapshots from active posts
    posts = get_posts(platform=platform)
    if not posts:
        return []

    # Group posts by date
    daily_stats: Dict[str, Dict[str, Any]] = {}
    for p in sorted(posts, key=lambda x: x.get("published_at", "")):
        pub = p.get("published_at", "")[:10] or "2026-03-01"
        if pub not in daily_stats:
            daily_stats[pub] = {
                "date": pub,
                "platform": platform or "all",
                "views": 0,
                "engagements": 0,
                "posts_count": 0
            }
        daily_stats[pub]["views"] += p.get("views", 0)
        daily_stats[pub]["engagements"] += p.get("likes", 0) + p.get("comments", 0) + p.get("shares", 0)
        daily_stats[pub]["posts_count"] += 1

    snapshots = []
    for d, s in sorted(daily_stats.items()):
        er = round(s["engagements"] / max(1, s["views"]), 4)
        snapshots.append({
            "date": d,
            "platform": s["platform"],
            "views": s["views"],
            "engagements": s["engagements"],
            "engagement_rate": er,
            "posts_count": s["posts_count"]
        })
    return snapshots[-days:]

def get_dashboard_summary(platform: Optional[str] = None) -> Dict[str, Any]:
    creators = get_creators(platform)
    posts = get_posts(platform=platform)
    
    total_followers = sum(c.get("follower_count", 0) for c in creators)
    total_views = sum(p.get("views", 0) for p in posts)
    total_likes = sum(p.get("likes", 0) for p in posts)
    total_comments = sum(p.get("comments", 0) for p in posts)
    total_shares = sum(p.get("shares", 0) for p in posts)
    
    total_engagements = total_likes + total_comments + total_shares
    avg_er = total_engagements / max(1, total_views)
    breakout_count = sum(1 for p in posts if p.get("is_breakout", False))
    breakout_rate = breakout_count / max(1, len(posts))
    
    return {
        "metadata": get_system_metadata(),
        "total_followers": total_followers,
        "total_posts": len(posts),
        "total_views": total_views,
        "total_engagements": total_engagements,
        "average_engagement_rate": round(avg_er, 4),
        "breakout_rate": round(breakout_rate, 4),
        "breakout_count": breakout_count,
        "creators_monitored": len(creators)
    }

# ----------------- Trends -----------------

def get_trends(platform: Optional[str] = None, time_window: Optional[str] = None) -> List[Dict[str, Any]]:
    trends = _load_json("trends.json")
    if platform and platform.lower() != "all":
        trends = [t for t in trends if t.get("platform", "").lower() == platform.lower()]
    if time_window and time_window.lower() != "all":
        trends = [t for t in trends if t.get("time_window", "").lower() == time_window.lower()]
    trends.sort(key=lambda x: x.get("strength_score", 0), reverse=True)
    return trends

# ----------------- Comments -----------------

def get_comments(
    platform: Optional[str] = None,
    sentiment: Optional[str] = None,
    theme: Optional[str] = None,
    is_question: Optional[bool] = None
) -> List[Dict[str, Any]]:
    comments = _load_json("comments.json")
    if platform and platform.lower() != "all":
        comments = [c for c in comments if c.get("platform", "").lower() == platform.lower()]
    if sentiment and sentiment.lower() != "all":
        comments = [c for c in comments if c.get("sentiment", "").lower() == sentiment.lower()]
    if theme and theme.lower() != "all":
        comments = [c for c in comments if theme.lower() in c.get("theme", "").lower()]
    if is_question is not None:
        comments = [c for c in comments if c.get("is_question") == is_question]
    return comments

def get_comments_summary(platform: Optional[str] = None) -> Dict[str, Any]:
    comments = get_comments(platform=platform)
    total = len(comments)
    if total == 0:
        return {
            "metadata": get_system_metadata(),
            "total_comments": 0,
            "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
            "top_themes": [],
            "repeated_questions": []
        }
        
    pos = sum(1 for c in comments if c.get("sentiment") == "positive")
    neu = sum(1 for c in comments if c.get("sentiment") == "neutral")
    neg = sum(1 for c in comments if c.get("sentiment") == "negative")
    
    theme_counts = {}
    for c in comments:
        th = c.get("theme", "general")
        theme_counts[th] = theme_counts.get(th, 0) + 1
    
    top_themes = [
        {"theme": k, "count": v, "percentage": round(v / total * 100, 1)}
        for k, v in sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)
    ]
    
    questions = [c for c in comments if c.get("is_question")]
    
    return {
        "metadata": get_system_metadata(),
        "total_comments": total,
        "sentiment_breakdown": {
            "positive": round(pos / total * 100, 1),
            "neutral": round(neu / total * 100, 1),
            "negative": round(neg / total * 100, 1)
        },
        "top_themes": top_themes,
        "repeated_questions": questions
    }

# ----------------- Prediction History -----------------

def get_predictions(platform: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    predictions = _load_json("predictions.json")
    if platform and platform.lower() != "all":
        predictions = [p for p in predictions if p.get("platform", "").lower() == platform.lower()]
    predictions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return predictions[:limit]

def save_prediction(prediction_data: Dict[str, Any]) -> Dict[str, Any]:
    predictions = _load_json("predictions.json")
    if "prediction_id" not in prediction_data:
        prediction_data["prediction_id"] = f"pred_{uuid.uuid4().hex[:8]}"
    if "created_at" not in prediction_data:
        prediction_data["created_at"] = datetime.now(timezone.utc).isoformat()
        
    predictions.insert(0, prediction_data)
    _save_json("predictions.json", predictions)
    return prediction_data

def get_accuracy_scoreboard(platform: Optional[str] = None) -> Dict[str, Any]:
    preds = get_predictions(platform=platform, limit=200)
    evaluated = [p for p in preds if p.get("actual_outcome") is not None]
    
    if not evaluated:
        return {
            "metadata": get_system_metadata(),
            "total_predictions": len(preds),
            "evaluated_count": 0,
            "brier_score": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "calibration_bins": []
        }
        
    brier_sum = 0.0
    actual_positives = 0
    tp = fp = fn = tn = 0
    
    bins = [
        {"bin": "0-20%", "min": 0.0, "max": 0.20, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "20-40%", "min": 0.20, "max": 0.40, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "40-60%", "min": 0.40, "max": 0.60, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "60-80%", "min": 0.60, "max": 0.80, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "80-100%", "min": 0.80, "max": 1.00, "count": 0, "predicted_sum": 0.0, "actual_sum": 0}
    ]
    
    for p in evaluated:
        prob = p.get("predicted_prob", 0.0)
        actual = 1 if p.get("actual_outcome") else 0
        if actual == 1:
            actual_positives += 1
        brier_sum += (prob - actual) ** 2
        
        pred_label = 1 if prob >= 0.15 else 0
        if pred_label == 1 and actual == 1:
            tp += 1
        elif pred_label == 1 and actual == 0:
            fp += 1
        elif pred_label == 0 and actual == 1:
            fn += 1
        else:
            tn += 1
            
        for b in bins:
            if b["min"] <= prob <= b["max"] or (b["max"] == 1.0 and prob >= 1.0):
                b["count"] += 1
                b["predicted_sum"] += prob
                b["actual_sum"] += actual
                break

    calibration_bins = []
    for b in bins:
        count = b["count"]
        mean_pred = (b["predicted_sum"] / count) if count > 0 else (b["min"] + b["max"]) / 2
        actual_rate = (b["actual_sum"] / count) if count > 0 else 0.0
        calibration_bins.append({
            "bin": b["bin"],
            "count": count,
            "mean_predicted_prob": round(mean_pred * 100, 1),
            "actual_breakout_rate": round(actual_rate * 100, 1)
        })

    n = len(evaluated)
    brier = round(brier_sum / n, 4)
    precision = round(tp / max(1, tp + fp), 3)
    recall = round(tp / max(1, tp + fn), 3)

    base_rate = actual_positives / n if n > 0 else 0.05
    baseline_brier = round(base_rate * (1.0 - base_rate), 4)

    if brier < baseline_brier - 0.015:
        brier_label = "Better than guessing"
    elif abs(brier - baseline_brier) <= 0.015:
        brier_label = "About the same as guessing"
    else:
        brier_label = "Worse than guessing"

    return {
        "metadata": get_system_metadata(),
        "total_predictions": len(preds),
        "evaluated_count": n,
        "sample_size": n,
        "low_sample_warning": n < 30,
        "pending_count": len(preds) - n,
        "brier_score": brier,
        "baseline_brier_score": baseline_brier,
        "brier_evaluation_label": brier_label,
        "baseline_rate": round(base_rate, 4),
        "precision": precision,
        "recall": recall,
        "calibration_bins": calibration_bins,
        "recent_history": preds
    }

# ----------------- Drafts & Calendar -----------------

def get_drafts(platform: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
    drafts = _load_json("drafts.json")
    if platform and platform.lower() != "all":
        drafts = [d for d in drafts if d.get("platform", "").lower() == platform.lower()]
    if status and status.lower() != "all":
        drafts = [d for d in drafts if d.get("status", "").lower() == status.lower()]
    drafts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return drafts

def save_draft(draft: Dict[str, Any]) -> Dict[str, Any]:
    drafts = _load_json("drafts.json")
    if "draft_id" not in draft:
        draft["draft_id"] = f"draft_{uuid.uuid4().hex[:8]}"
    if "created_at" not in draft:
        draft["created_at"] = datetime.now(timezone.utc).isoformat()
    if "status" not in draft:
        draft["status"] = "idea"
        
    drafts.insert(0, draft)
    _save_json("drafts.json", drafts)
    return draft

def update_draft(draft_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    drafts = _load_json("drafts.json")
    for idx, d in enumerate(drafts):
        if d.get("draft_id") == draft_id:
            drafts[idx].update(updates)
            _save_json("drafts.json", drafts)
            return drafts[idx]
    return None

def delete_draft(draft_id: str) -> bool:
    drafts = _load_json("drafts.json")
    new_drafts = [d for d in drafts if d.get("draft_id") != draft_id]
    if len(new_drafts) < len(drafts):
        _save_json("drafts.json", new_drafts)
        return True
    return False

# ----------------- Imbalance Lab Results -----------------

def get_imbalance_lab_results() -> Dict[str, Any]:
    results_path = os.path.join(ML_DIR, "results.json")
    if not os.path.exists(results_path):
        return {"error": "results.json not found. Run train.py first."}
    with open(results_path, "r", encoding="utf-8") as f:
        return json.load(f)

# ----------------- VibeCheck Reports Storage -----------------

def get_vibecheck_reports(limit: int = 50) -> List[Dict[str, Any]]:
    reports = _load_json("vibecheck_reports.json")
    reports.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return reports[:limit]

def get_vibecheck_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    reports = _load_json("vibecheck_reports.json")
    for r in reports:
        if r.get("report_id") == report_id:
            return r
    return None

def save_vibecheck_report(report_data: Dict[str, Any]) -> Dict[str, Any]:
    reports = _load_json("vibecheck_reports.json")
    if "report_id" not in report_data:
        report_data["report_id"] = f"vibe_{uuid.uuid4().hex[:8]}"
    if "created_at" not in report_data:
        report_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    reports.insert(0, report_data)
    _save_json("vibecheck_reports.json", reports)
    return report_data

def delete_vibecheck_report(report_id: str) -> bool:
    reports = _load_json("vibecheck_reports.json")
    new_reports = [r for r in reports if r.get("report_id") != report_id]
    if len(new_reports) < len(reports):
        _save_json("vibecheck_reports.json", new_reports)
        return True
    return False

# ----------------- CSV Validation, Preview & Import -----------------

SAMPLE_CSV_TEMPLATE = (
    "platform,post_type,caption,published_at,views,likes,comments,shares\n"
    "youtube,long_video,Why 90% of Junior Devs Fail Technical Interviews,2026-03-01T14:00:00Z,45200,3200,410,120\n"
    "instagram,reel,Clean Architecture in 60 Seconds,2026-03-03T18:30:00Z,89000,7400,290,1500\n"
    "twitter,thread,10 rules for writing resilient async code in 2026,2026-03-05T09:15:00Z,31200,1950,185,420\n"
    "linkedin,post,Lessons from scaling our first AI microservice to 1M users,2026-03-08T11:00:00Z,18500,980,112,65\n"
    "youtube,short,Top 3 VS Code shortcuts you never knew existed,2026-03-10T16:45:00Z,124000,9800,530,2200\n"
)

def get_sample_csv_template() -> str:
    """Returns downloadable sample CSV template string."""
    return SAMPLE_CSV_TEMPLATE

def _parse_row_to_post(row: Dict[str, str], row_idx: int) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Validates a single CSV row and converts it to CreatorPulse schema.
    Returns (post_record, None) if valid, or (None, error_reason) if bad.
    """
    cols = {k.lower().strip(): k for k in row.keys() if k}
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Caption / Title check
    caption = ""
    for cand in ["caption", "title", "content", "text", "post_text", "video_title", "name"]:
        if cand in cols and row[cols[cand]].strip():
            caption = row[cols[cand]].strip()
            break
    if not caption:
        return None, "Missing post title or caption"

    # 2. Views check
    views = None
    for cand in ["views", "impressions", "reach", "view_count"]:
        if cand in cols and row[cols[cand]].strip():
            try:
                val = float(row[cols[cand]].strip().replace(",", ""))
                if val < 0:
                    return None, f"Views cannot be negative ({val})"
                views = int(val)
                break
            except ValueError:
                return None, f"Invalid views value '{row[cols[cand]]}' (must be a number)"
    if views is None:
        views = 0

    # 3. Likes check
    likes = 0
    for cand in ["likes", "like_count", "reactions"]:
        if cand in cols and row[cols[cand]].strip():
            try:
                val = float(row[cols[cand]].strip().replace(",", ""))
                if val < 0:
                    return None, f"Likes cannot be negative ({val})"
                likes = int(val)
                break
            except ValueError:
                return None, f"Invalid likes value '{row[cols[cand]]}' (must be a number)"

    # 4. Comments check
    comments = 0
    for cand in ["comments", "comment_count", "replies"]:
        if cand in cols and row[cols[cand]].strip():
            try:
                val = float(row[cols[cand]].strip().replace(",", ""))
                if val < 0:
                    return None, f"Comments cannot be negative ({val})"
                comments = int(val)
                break
            except ValueError:
                return None, f"Invalid comments value '{row[cols[cand]]}' (must be a number)"

    # 5. Shares check
    shares = 0
    for cand in ["shares", "share_count", "retweets", "reposts"]:
        if cand in cols and row[cols[cand]].strip():
            try:
                val = float(row[cols[cand]].strip().replace(",", ""))
                shares = max(0, int(val))
                break
            except ValueError:
                pass

    # 6. Platform normalization
    platform = "instagram"
    for cand in ["platform", "network", "channel"]:
        if cand in cols and row[cols[cand]].strip():
            p_val = row[cols[cand]].strip().lower()
            if "you" in p_val or "yt" in p_val:
                platform = "youtube"
            elif "insta" in p_val or "ig" in p_val:
                platform = "instagram"
            elif "tweet" in p_val or "x" in p_val or "tw" in p_val:
                platform = "twitter"
            elif "link" in p_val:
                platform = "linkedin"
            else:
                platform = p_val
            break

    # 7. Post type normalization
    post_type = "post"
    for cand in ["post_type", "type", "format"]:
        if cand in cols and row[cols[cand]].strip():
            post_type = row[cols[cand]].strip().lower()
            break
    if platform == "youtube" and post_type == "post":
        post_type = "long_video"

    # 8. Published date
    published_at = now_iso
    for cand in ["published_at", "date", "created_at", "timestamp", "time"]:
        if cand in cols and row[cols[cand]].strip():
            published_at = row[cols[cand]].strip()
            break

    # Computed metrics
    total_eng = likes + comments + shares
    engagement_rate = round(total_eng / max(1, views), 4)
    is_breakout = engagement_rate >= 0.06 or (views >= 10000 and total_eng >= 600)

    post_record = {
        "post_id": f"csv_{row_idx}_{uuid.uuid4().hex[:6]}",
        "platform": platform,
        "post_type": post_type,
        "caption": caption,
        "published_at": published_at,
        "views": views,
        "likes": likes,
        "comments": comments,
        "shares": shares,
        "impressions": views,
        "engagement_rate": engagement_rate,
        "is_breakout": is_breakout,
        "source": "user_csv_upload"
    }

    return post_record, None

def validate_and_preview_csv(csv_content: str) -> Dict[str, Any]:
    """
    Validates CSV headers, parses rows, separates valid posts from bad rows,
    and returns a preview (first 5 posts) plus row statistics and bad row diagnostics.
    """
    if not csv_content or not csv_content.strip():
        return {
            "is_valid": False,
            "error": "CSV content is empty.",
            "total_rows": 0,
            "valid_count": 0,
            "bad_count": 0,
            "bad_rows": [],
            "preview": [],
            "headers": []
        }

    try:
        # Detect delimiter (comma, semicolon, or tab)
        sample_chunk = csv_content[:2048]
        delimiter = ","
        for d in [",", ";", "\t"]:
            if d in sample_chunk:
                delimiter = d
                break

        reader = csv.DictReader(io.StringIO(csv_content), delimiter=delimiter)
        if not reader.fieldnames:
            return {
                "is_valid": False,
                "error": "CSV contains no header row.",
                "total_rows": 0,
                "valid_count": 0,
                "bad_count": 0,
                "bad_rows": [],
                "preview": [],
                "headers": []
            }

        headers = [h.strip() for h in reader.fieldnames if h]
        valid_posts = []
        bad_rows = []

        for idx, row in enumerate(reader):
            post, err = _parse_row_to_post(row, idx + 1)
            if post:
                valid_posts.append(post)
            else:
                bad_rows.append({
                    "row_number": idx + 2, # +2 accounting for header and 1-based index
                    "reason": err,
                    "data": {k: v for k, v in row.items() if k}
                })

        total = len(valid_posts) + len(bad_rows)
        return {
            "is_valid": len(valid_posts) > 0,
            "total_rows": total,
            "valid_count": len(valid_posts),
            "bad_count": len(bad_rows),
            "bad_rows": bad_rows[:15], # cap bad rows sample
            "preview": valid_posts[:5],
            "headers": headers,
            "delimiter": delimiter
        }
    except Exception as e:
        return {
            "is_valid": False,
            "error": f"Failed to parse CSV file: {str(e)}",
            "total_rows": 0,
            "valid_count": 0,
            "bad_count": 0,
            "bad_rows": [],
            "preview": [],
            "headers": []
        }

def import_posts_from_csv(
    csv_content: str,
    filename: Optional[str] = "upload.csv",
    set_as_active: bool = True
) -> Dict[str, Any]:
    """
    Parses, validates, and imports posts from CSV into `uploaded_posts.json`.
    Updates provenance metadata and switches active data source to 'uploaded_csv'.
    """
    val = validate_and_preview_csv(csv_content)
    if not val.get("is_valid") and val.get("valid_count", 0) == 0:
        return {
            "success": False,
            "error": val.get("error") or "No valid posts found in CSV file."
        }

    # Extract all valid rows
    reader = csv.DictReader(io.StringIO(csv_content), delimiter=val.get("delimiter", ","))
    valid_posts = []
    bad_rows = []
    for idx, row in enumerate(reader):
        post, err = _parse_row_to_post(row, idx + 1)
        if post:
            valid_posts.append(post)
        else:
            bad_rows.append({"row_number": idx + 2, "reason": err})

    # Save to uploaded_posts.json
    _save_json("uploaded_posts.json", valid_posts)

    # Update state
    state = get_data_source_state()
    state["uploaded_meta"] = {
        "filename": filename or "upload.csv",
        "count": len(valid_posts),
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "bad_rows_count": len(bad_rows)
    }
    if set_as_active:
        state["active_source"] = "uploaded_csv"

    save_data_source_state(state)

    return {
        "success": True,
        "imported_count": len(valid_posts),
        "bad_rows_count": len(bad_rows),
        "bad_rows": bad_rows[:10],
        "active_source": state["active_source"],
        "metadata": get_system_metadata(),
        "message": f"Successfully imported {len(valid_posts)} posts from '{filename}' into CreatorPulse dataset."
    }

# ----------------- YouTube Channel Ingestion -----------------

def import_youtube_channel_posts(
    channel_url: str,
    set_as_active: bool = True
) -> Dict[str, Any]:
    """
    Invokes youtube_service to fetch channel videos and saves to `youtube_posts.json`.
    Updates provenance metadata and switches active source to 'youtube'.
    """
    from backend.services import youtube_service

    result = youtube_service.fetch_youtube_channel_data(channel_url)
    if not result.get("success"):
        return result

    videos = result.get("videos", [])
    channel_info = result.get("channel", {})

    _save_json("youtube_posts.json", videos)

    state = get_data_source_state()
    state["youtube_meta"] = {
        "channel_id": channel_info.get("channel_id"),
        "channel_title": channel_info.get("title"),
        "channel_handle": channel_info.get("custom_url"),
        "subscriber_count": channel_info.get("subscriber_count", 0),
        "video_count": channel_info.get("video_count", 0),
        "count": len(videos),
        "imported_at": datetime.now(timezone.utc).isoformat()
    }
    if set_as_active:
        state["active_source"] = "youtube"

    save_data_source_state(state)

    return {
        "success": True,
        "channel": channel_info,
        "imported_count": len(videos),
        "active_source": state["active_source"],
        "metadata": get_system_metadata(),
        "message": f"Successfully connected '{channel_info.get('title')}' and imported {len(videos)} videos."
    }

# ==========================================
# COMPETITOR ANALYSIS DATA ACCESS METHODS
# ==========================================

COMPETITORS_FILE = os.path.join(DATA_DIR, "competitors.json")

def get_competitors() -> List[Dict[str, Any]]:
    """Loads current competitor list (up to 3 competitors)."""
    if not os.path.exists(COMPETITORS_FILE):
        return []
    with open(COMPETITORS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_competitors(competitors: List[Dict[str, Any]]) -> None:
    """Saves updated competitors list to JSON."""
    with open(COMPETITORS_FILE, "w", encoding="utf-8") as f:
        json.dump(competitors, f, indent=2)

def add_competitor(competitor: Dict[str, Any]) -> Dict[str, Any]:
    """Adds a new competitor profile (enforces max 3)."""
    current = get_competitors()
    if len(current) >= 3:
        raise ValueError("Maximum of 3 competitor channels allowed for comparison.")
    
    handle = competitor.get("handle", "").lower().strip()
    if any(c.get("handle", "").lower().strip() == handle for c in current):
        raise ValueError(f"Competitor with handle '{handle}' is already added.")

    current.append(competitor)
    save_competitors(current)
    return competitor

def delete_competitor(comp_id: str) -> bool:
    """Removes a competitor by ID."""
    current = get_competitors()
    filtered = [c for c in current if c.get("id") != comp_id]
    if len(filtered) < len(current):
        save_competitors(filtered)
        return True
    return False

def get_user_channel_benchmark() -> Dict[str, Any]:
    """Retrieves the active user channel profile for head-to-head benchmarking."""
    creators = get_creators(platform="youtube")
    user = creators[0] if creators else {
        "name": "DevPulse with Alex",
        "handle": "@devpulse_alex",
        "follower_count": 84500,
        "baseline_engagement_rate": 0.052
    }
    
    posts = get_posts(platform="youtube", limit=100)
    avg_views = int(sum(p.get("views", 0) for p in posts) / max(len(posts), 1)) if posts else 42300
    
    return {
        "id": "user_channel",
        "name": user.get("name", "DevPulse with Alex"),
        "handle": user.get("handle", "@devpulse_alex"),
        "platform": "youtube",
        "subscriber_count": user.get("follower_count", 84500),
        "avg_views": avg_views,
        "posts_per_week": 3.2,
        "engagement_rate": user.get("baseline_engagement_rate", 0.052),
        "avatar": "",
        "top_posts": [
            {
                "title": p.get("caption", "Untitled Post"),
                "views": p.get("views", 0),
                "likes": p.get("likes", 0),
                "comments": p.get("comments", 0),
                "published_at": p.get("published_at", ""),
                "engagement_rate": p.get("engagement_rate", 0.05)
            } for p in sorted(posts, key=lambda x: x.get("views", 0), reverse=True)[:3]
        ] if posts else [],
        "is_sample": get_active_data_source() == "sample"
    }
