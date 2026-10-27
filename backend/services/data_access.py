"""
CreatorPulse AI - Data Access Layer (DAL)
------------------------------------------
ALL data reads and writes across the entire backend application MUST go exclusively
through this service. This guarantees that mock JSON storage can later be swapped
for PostgreSQL, Supabase, DynamoDB, or external APIs without modifying application logic.

Platform-neutral field schema maintained:
- platform, post_type, external_id / post_id, published_at, views, likes, comments, shares, impressions
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")

# Track in-memory or file-based last refreshed timestamp
LAST_REFRESHED = datetime.now(timezone.utc).isoformat()

def _load_json(filename: str) -> List[Dict[str, Any]]:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_json(filename: str, data: Any) -> None:
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ----------------- System & Meta -----------------

def get_system_metadata() -> Dict[str, Any]:
    """Returns provenance metadata required by CreatorPulse AI principles."""
    return {
        "data_source": "mock data (JSON storage)",
        "last_refreshed": LAST_REFRESHED,
        "is_synthetic": True,
        "environment": "prototype"
    }

# ----------------- Creators -----------------

def get_creators(platform: Optional[str] = None) -> List[Dict[str, Any]]:
    creators = _load_json("creators.json")
    if platform and platform.lower() != "all":
        return [c for c in creators if c.get("platform", "").lower() == platform.lower()]
    return creators

def get_creator_by_id(creator_id: str) -> Optional[Dict[str, Any]]:
    creators = _load_json("creators.json")
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
    return 0.05 # fallback

# ----------------- Posts & Dashboard -----------------

def get_posts(
    platform: Optional[str] = None,
    post_type: Optional[str] = None,
    limit: Optional[int] = None,
    sort_by: str = "published_at",
    descending: bool = True
) -> List[Dict[str, Any]]:
    posts = _load_json("posts.json")
    
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
    snapshots = _load_json("metric_snapshots.json")
    if platform and platform.lower() != "all":
        snapshots = [s for s in snapshots if s.get("platform", "").lower() == platform.lower()]
    return snapshots

def get_dashboard_summary(platform: Optional[str] = None) -> Dict[str, Any]:
    creators = get_creators(platform)
    posts = get_posts(platform=platform)
    
    total_followers = sum(c.get("follower_count", 0) for c in creators)
    total_views = sum(p.get("views", 0) for p in posts)
    total_likes = sum(p.get("likes", 0) for p in posts)
    total_comments = sum(p.get("comments", 0) for p in posts)
    total_shares = sum(p.get("shares", 0) for p in posts)
    
    avg_er = (total_likes + total_comments + total_shares) / max(1, total_views)
    breakout_count = sum(1 for p in posts if p.get("is_breakout", False))
    breakout_rate = breakout_count / max(1, len(posts))
    
    return {
        "metadata": get_system_metadata(),
        "total_followers": total_followers,
        "total_posts": len(posts),
        "total_views": total_views,
        "total_engagements": total_likes + total_comments + total_shares,
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
    # sort by strength score descending
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
    
    # Themes aggregation
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
    # Evaluate evaluated items where actual_outcome is known
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
        
    # Compute metrics
    brier_sum = 0.0
    actual_positives = 0
    tp = fp = fn = tn = 0
    
    # 5 Calibration Bins: 0-20%, 20-40%, 40-60%, 60-80%, 80-100%
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
        
        pred_label = 1 if prob >= 0.15 else 0 # Breakout threshold
        if pred_label == 1 and actual == 1:
            tp += 1
        elif pred_label == 1 and actual == 0:
            fp += 1
        elif pred_label == 0 and actual == 1:
            fn += 1
        else:
            tn += 1
            
        # Add to calibration bin
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

    # Base rate of breakout occurrences in sample
    base_rate = actual_positives / n if n > 0 else 0.05
    # Naive baseline forecasting Brier score: predicting constant p = base_rate
    # E[Brier_baseline] = p * (1-p)
    baseline_brier = round(base_rate * (1.0 - base_rate), 4)

    # Truthful evaluation label comparing against naive guessing
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
    
    # Prepend to history
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

# ----------------- CSV Import for Settings -----------------

def import_posts_from_csv(csv_content: str) -> Dict[str, Any]:
    """
    Parses user-uploaded CSV of social media posts, validates columns,
    normalizes to CreatorPulse DAL schema, appends to posts.json, and updates metadata.
    """
    import csv
    import io

    posts = _load_json("posts.json")
    existing_ids = {p.get("post_id") for p in posts}

    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        if not reader.fieldnames:
            return {"success": False, "error": "CSV file contains no header row."}
        
        # Field mapping
        cols = {f.lower().strip(): f for f in reader.fieldnames}
        
        imported_count = 0
        skipped_count = 0
        now_iso = datetime.now(timezone.utc).isoformat()

        for idx, row in enumerate(reader):
            # Extract platform
            platform = "instagram"
            for p_cand in ["platform", "network", "channel"]:
                if p_cand in cols and row[cols[p_cand]].strip():
                    platform = row[cols[p_cand]].strip().lower()
                    break

            # Extract views
            views = 0
            for v_cand in ["views", "impressions", "reach"]:
                if v_cand in cols and row[cols[v_cand]].strip():
                    try:
                        views = int(float(row[cols[v_cand]]))
                        break
                    except (ValueError, TypeError):
                        pass

            # Extract likes
            likes = 0
            for l_cand in ["likes", "like_count", "reactions"]:
                if l_cand in cols and row[cols[l_cand]].strip():
                    try:
                        likes = int(float(row[cols[l_cand]]))
                        break
                    except (ValueError, TypeError):
                        pass

            # Extract comments
            comments = 0
            for c_cand in ["comments", "comment_count", "replies"]:
                if c_cand in cols and row[cols[c_cand]].strip():
                    try:
                        comments = int(float(row[cols[c_cand]]))
                        break
                    except (ValueError, TypeError):
                        pass

            # Extract shares
            shares = 0
            for s_cand in ["shares", "retweets", "reposts"]:
                if s_cand in cols and row[cols[s_cand]].strip():
                    try:
                        shares = int(float(row[cols[s_cand]]))
                        break
                    except (ValueError, TypeError):
                        pass

            # Extract text / title
            caption = ""
            for t_cand in ["caption", "content", "text", "title", "post_text"]:
                if t_cand in cols and row[cols[t_cand]].strip():
                    caption = row[cols[t_cand]].strip()
                    break

            # Extract post_type
            post_type = "post"
            for pt_cand in ["post_type", "type", "format"]:
                if pt_cand in cols and row[cols[pt_cand]].strip():
                    post_type = row[cols[pt_cand]].strip().lower()
                    break

            # Extract published_at
            published_at = now_iso
            for d_cand in ["published_at", "date", "created_at", "timestamp"]:
                if d_cand in cols and row[cols[d_cand]].strip():
                    published_at = row[cols[d_cand]].strip()
                    break

            # Post ID
            post_id = f"csv_post_{uuid.uuid4().hex[:8]}"

            # Calculate engagement rate
            total_eng = likes + comments + shares
            engagement_rate = round(total_eng / max(1, views), 4)

            # Determine breakout status (relative to 6% benchmark)
            is_breakout = engagement_rate >= 0.06 or (views > 10000 and total_eng > 600)

            post_record = {
                "post_id": post_id,
                "platform": platform,
                "post_type": post_type,
                "caption": caption or f"Imported post #{idx + 1}",
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

            posts.insert(0, post_record)
            imported_count += 1

        if imported_count > 0:
            _save_json("posts.json", posts)
            global LAST_REFRESHED
            LAST_REFRESHED = now_iso

        return {
            "success": True,
            "imported_count": imported_count,
            "skipped_count": skipped_count,
            "total_posts": len(posts),
            "message": f"Successfully parsed and imported {imported_count} posts into CreatorPulse dataset."
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse CSV file: {str(e)}"
        }
