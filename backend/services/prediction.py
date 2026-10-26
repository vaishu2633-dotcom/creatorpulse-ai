"""
CreatorPulse AI - ViralScope Prediction Service
------------------------------------------------
Key Principles:
1. NEVER promise virality. Always output calibrated probability, base rate, and uncertainty interval.
2. Format: e.g. "18% (usual rate: 5%)" with multiplier ratio 3.6x.
3. Strictness selector adjusts probability threshold dynamically:
   - top 20% (relaxed)
   - top 10% (standard)
   - top 5% (high bar)
   - top 1% (extreme breakout)
4. Provides:
   - Low/High range [e.g. 14% - 22%]
   - Confidence level: Low / Medium / High
   - Top 3 explanatory reasons (impact factors)
   - 3 similar historical posts
5. Automatically saves prediction to prediction history.
"""

import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.services import data_access

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model.pkl")

# Cache loaded model in memory
_MODEL_CACHE = None

def _get_model():
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
        
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                _MODEL_CACHE = pickle.load(f)
                return _MODEL_CACHE
        except Exception as e:
            print(f"Warning: Failed to load model.pkl: {e}")
            return None
    return None

def _calculate_feature_reasons(
    platform: str,
    post_type: str,
    title: str,
    title_len: int,
    hashtag_count: int,
    duration_sec: int,
    post_hour: int,
    post_weekday: int
) -> List[str]:
    """Derives top 3 human-readable reasons explaining the prediction."""
    reasons = []
    
    # 1. Title dynamics
    if 40 <= title_len <= 80:
        reasons.append(f"Optimal title length ({title_len} chars) aligns with high-retention formats.")
    elif title_len < 30:
        reasons.append(f"Brief title ({title_len} chars) may lack curiosity hook or keyword punch.")
    else:
        reasons.append(f"Title length ({title_len} chars) is slightly long, test truncating the hook.")
        
    # 2. Timing dynamics
    weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_name = weekday_names[post_weekday % 7]
    
    if (9 <= post_hour <= 12) or (17 <= post_hour <= 20):
        reasons.append(f"Scheduled for peak activity window ({day_name} at {post_hour:02d}:00).")
    elif post_hour < 6 or post_hour > 22:
        reasons.append(f"Off-peak release time ({day_name} {post_hour:02d}:00) may slow initial velocity.")
    else:
        reasons.append(f"Mid-day release time ({day_name} {post_hour:02d}:00) provides steady baseline distribution.")
        
    # 3. Format & Hashtag moderation
    if platform == "twitter":
        if hashtag_count <= 2:
            reasons.append(f"Low hashtag count ({hashtag_count}) favors Twitter/X algorithm reach.")
        else:
            reasons.append(f"High hashtag count ({hashtag_count}) can reduce impressions on Twitter/X.")
    elif platform == "instagram":
        if 5 <= hashtag_count <= 12:
            reasons.append(f"Hashtag density ({hashtag_count}) matches optimal discoverability.")
        elif hashtag_count < 3:
            reasons.append("Consider adding 3-5 niche-specific hashtags for explore page indexation.")
        else:
            reasons.append(f"High hashtag count ({hashtag_count}) may appear promotional to viewers.")
    elif platform == "youtube":
        if post_type == "short" and (30 <= duration_sec <= 55):
            reasons.append(f"Shorts duration ({duration_sec}s) targets maximum 100%+ replay loops.")
        elif post_type == "long_video" and (480 <= duration_sec <= 900):
            reasons.append(f"Video length ({duration_sec//60} mins) is ideal for mid-roll engagement & retention.")
        else:
            reasons.append(f"Standard {post_type} video format.")
    elif platform == "linkedin":
        if post_type in ["carousel", "story_post"]:
            reasons.append(f"{post_type.title()} format yields 2.4x higher dwell-time on LinkedIn feeds.")
        else:
            reasons.append("Text post format performs best when paired with an engaging open-ended question.")
            
    return reasons[:3]

def _find_similar_posts(platform: str, post_type: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Retrieves similar past historical posts to anchor creator expectations."""
    posts = data_access.get_posts(platform=platform, post_type=post_type, limit=50)
    if not posts:
        posts = data_access.get_posts(platform=platform, limit=50)
        
    # Pick top breakout and representative posts
    sample = sorted(posts, key=lambda p: p.get("views", 0), reverse=True)[:limit]
    return [
        {
            "post_id": p.get("post_id"),
            "title": p.get("title"),
            "views": p.get("views"),
            "engagement_rate": p.get("engagement_rate"),
            "is_breakout": p.get("is_breakout"),
            "published_at": p.get("published_at")
        }
        for p in sample
    ]

def predict_breakout(
    platform: str,
    post_type: str,
    title: str,
    hashtag_count: int = 3,
    duration_sec: int = 0,
    post_hour: int = 14,
    post_weekday: int = 2,
    strictness: str = "top_10%",
    creator_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes breakout probability, base rate, confidence interval,
    and returns top 3 reasons + similar past posts.
    """
    # 1. Base rate determination
    base_rate = data_access.get_creator_base_rate(platform, creator_id)
    
    # Strictness multiplier adjusting for percentile definitions
    # top_20% has higher baseline (~20%), top_10% (~10%), top_5% (~5%), top_1% (~1%)
    strictness_configs = {
        "top_20%": {"base_factor": 2.0, "strictness_label": "Top 20% of creator's posts"},
        "top_10%": {"base_factor": 1.0, "strictness_label": "Top 10% of creator's posts"},
        "top_5%":  {"base_factor": 0.5, "strictness_label": "Top 5% of creator's posts (Hit)"},
        "top_1%":  {"base_factor": 0.1, "strictness_label": "Top 1% of creator's posts (Super Hit)"}
    }
    
    selected_strictness = strictness_configs.get(strictness, strictness_configs["top_10%"])
    adjusted_base_rate = round(base_rate * selected_strictness["base_factor"], 4)
    
    title_len = len(title.strip()) if title else 45
    model_obj = _get_model()
    
    # 2. Probability computation
    if model_obj and "calibrated_model" in model_obj:
        try:
            # Build feature dataframe
            # numerical: title_length, hashtag_count, duration_sec, post_hour, post_weekday, creator_avg_engagement, follower_count
            # categorical: platform, post_type
            creators = data_access.get_creators(platform)
            follower_count = creators[0]["follower_count"] if creators else 50000
            
            row = pd.DataFrame([{
                "title_length": title_len,
                "hashtag_count": hashtag_count,
                "duration_sec": duration_sec,
                "post_hour": post_hour,
                "post_weekday": post_weekday,
                "creator_avg_engagement": base_rate,
                "follower_count": follower_count,
                "platform": platform.lower(),
                "post_type": post_type.lower()
            }])
            
            calibrated = model_obj["calibrated_model"]
            raw_prob = float(calibrated.predict_proba(row)[0, 1])
            # Adjust raw prob by strictness factor
            scaled_prob = raw_prob * selected_strictness["base_factor"]
            prob = max(0.01, min(0.95, scaled_prob))
        except Exception as e:
            print(f"Prediction inference error: {e}")
            prob = max(0.01, min(0.95, adjusted_base_rate * 1.5))
    else:
        # Graceful heuristic fallback if model.pkl is missing
        prob = max(0.01, min(0.95, adjusted_base_rate * 1.4))

    # Calculate probability ratio (multiplier vs base rate)
    ratio = round(prob / max(0.001, adjusted_base_rate), 1)
    
    # Low / High confidence interval (e.g. +/- 20% relative or 3-4% absolute)
    margin = max(0.02, prob * 0.18)
    range_low = max(0.005, round(prob - margin, 3))
    range_high = min(0.98, round(prob + margin, 3))
    
    # Confidence level based on margin of uncertainty and data volume
    if title_len >= 30 and (0.05 <= prob <= 0.85):
        confidence_level = "medium" if ratio < 4.0 else "high"
    else:
        confidence_level = "low"
        
    # Top 3 explanations
    top_reasons = _calculate_feature_reasons(
        platform=platform,
        post_type=post_type,
        title=title,
        title_len=title_len,
        hashtag_count=hashtag_count,
        duration_sec=duration_sec,
        post_hour=post_hour,
        post_weekday=post_weekday
    )
    
    # Similar past posts
    similar_posts = _find_similar_posts(platform=platform, post_type=post_type, limit=3)
    
    prediction_record = {
        "platform": platform,
        "post_type": post_type,
        "title": title,
        "predicted_prob": round(prob, 4),
        "predicted_prob_percent": round(prob * 100, 1),
        "base_rate": round(adjusted_base_rate, 4),
        "base_rate_percent": round(adjusted_base_rate * 100, 1),
        "probability_ratio": ratio,
        "ratio_display": f"{ratio}x creator base rate",
        "prob_display": f"{round(prob * 100, 1)}% (usual rate: {round(adjusted_base_rate * 100, 1)}%)",
        "range_low_percent": round(range_low * 100, 1),
        "range_high_percent": round(range_high * 100, 1),
        "range_display": f"{round(range_low * 100, 1)}% – {round(range_high * 100, 1)}%",
        "confidence_level": confidence_level,
        "strictness": strictness,
        "strictness_label": selected_strictness["strictness_label"],
        "top_reasons": top_reasons,
        "similar_posts": similar_posts,
        "actual_outcome": None, # Pending evaluation
        "metadata": data_access.get_system_metadata()
    }
    
    # Save to prediction history
    saved_record = data_access.save_prediction(prediction_record)
    return saved_record
