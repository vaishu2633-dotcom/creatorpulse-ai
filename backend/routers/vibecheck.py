"""
creatorPulse - VibeCheck Router
-------------------------------
FastAPI router for ML-based YouTube comment sentiment analysis.
Endpoints:
1. GET  /api/vibecheck/status              - Service operational status & active ML model
2. GET  /api/vibecheck/models              - Evaluation benchmark for all 4 ML models
3. GET  /api/vibecheck/supported-platforms - Explicitly confirms YouTube-only support
4. POST /api/vibecheck/analyze             - Performs sentiment analysis on URL or pasted text
5. GET  /api/vibecheck/history             - Retrieves historical sentiment analysis reports
6. DEL  /api/vibecheck/history/{report_id} - Deletes a report from history
"""

import os
import sys
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Ensure project root is in sys.path
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from backend.services import data_access
from backend.services.vibecheck import (
    YouTubeAdapter,
    ManualAdapter,
    VibeAnalyzer
)
from backend.ml.classifier import get_model_metadata

router = APIRouter(prefix="/api/vibecheck", tags=["VibeCheck AI"])

# Adapters: YouTube Data API v3 adapter and direct user text/pasted comments adapter
yt_adapter = YouTubeAdapter()
manual_adapter = ManualAdapter()

UNSUPPORTED_DOMAINS = {
    "twitter.com": "X (Twitter)",
    "x.com": "X (Twitter)",
    "instagram.com": "Instagram",
    "tiktok.com": "TikTok",
    "linkedin.com": "LinkedIn"
}


def _validate_url_target(target: str) -> None:
    """
    Validates URL input and rejects unsupported social media platforms
    with clear, explanatory error messages.
    """
    lower = target.lower()
    for domain, platform_name in UNSUPPORTED_DOMAINS.items():
        if domain in lower:
            raise HTTPException(
                status_code=400,
                detail=f"{platform_name} is not supported. creatorPulse focuses exclusively on YouTube video comment sentiment analysis."
            )

    if not yt_adapter.can_handle(target):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid URL. Please enter a valid YouTube video URL "
                "(e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)."
            )
        )


@router.get("/status")
def get_vibecheck_status():
    """Returns YouTube Data API configuration status and the selected best ML model."""
    yt_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    model_name = VibeAnalyzer.get_selected_model_name()

    return {
        "status": "operational",
        "feature": "VibeCheck AI",
        "selected_ml_model": model_name,
        "youtube_api_configured": bool(yt_key and not yt_key.startswith("your_")),
        "supported_platforms": ["youtube"],
        "message": f"VibeCheck AI active with {model_name} for YouTube comments."
    }


@router.get("/models")
def get_ml_models_comparison():
    """
    Returns comparative evaluation metrics of all four traditional Machine Learning models:
    1. Multinomial Naive Bayes
    2. Logistic Regression
    3. Linear Support Vector Machine (Linear SVM)
    4. Random Forest Classifier
    Reports Accuracy, Precision, Recall, F1-score, and Confusion Matrices.
    """
    meta = get_model_metadata()
    if not meta or "models" not in meta or "Random Forest" not in meta.get("models", {}):
        from backend.ml.trainer import train_and_evaluate_models
        meta = train_and_evaluate_models()
    return meta


@router.get("/supported-platforms")
def get_supported_platforms():
    """Returns metadata and guidelines confirming YouTube-only platform support."""
    return {
        "supported_platforms": [
            {
                "id": "youtube",
                "name": "YouTube",
                "icon": "Youtube",
                "status": "Active (Official YouTube Data API v3)",
                "capabilities": ["Video Metadata", "Live Top Comments", "Audience Sentiment", "Keyword Extraction"],
                "url_examples": [
                    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "https://youtu.be/dQw4w9WgXcQ"
                ],
                "notes": "Retrieves real top-level video comments through the official YouTube Data API v3."
            }
        ]
    }


class AnalyzeRequest(BaseModel):
    target: Optional[str] = Field(None, description="URL of the YouTube video")
    input_type: str = Field("url", description="'url' or 'pasted_comments'")
    platform: Optional[str] = Field("youtube", description="Platform identifier: youtube")
    title: Optional[str] = Field(None, description="Optional custom title")
    raw_text: Optional[str] = Field(None, description="Optional audience comments text fallback")
    save_to_history: bool = Field(True, description="Whether to persist report in history")


@router.post("/analyze")
def analyze_content(req: AnalyzeRequest):
    """
    Main sentiment analysis endpoint:
    1. Accepts a YouTube video URL or pasted comment text.
    2. Retrieves video comments through YouTube Data API v3 or parses pasted text.
    3. Cleans comments and extracts TF-IDF feature vectors.
    4. Performs classification using the best-performing trained ML model.
    5. Returns overall reaction, sentiment distribution, and key themes.
    """
    target = (req.target or "").strip()
    input_type = req.input_type.strip().lower()

    try:
        if input_type == "url" and target:
            _validate_url_target(target)
            payload = yt_adapter.fetch_data({"url": target})
        else:
            raw_text = (req.raw_text or "").strip()
            if not raw_text:
                raise HTTPException(
                    status_code=400,
                    detail="No text or comments provided. Please enter a YouTube video URL or paste comments to analyze."
                )

            payload = manual_adapter.fetch_data({
                "input_type": "pasted_comments",
                "raw_text": raw_text,
                "platform": "youtube",
                "title": req.title or "YouTube Video Comments",
                "author": "YouTube Audience"
            })
    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")

    # Run ML sentiment analysis pipeline
    analysis = VibeAnalyzer.analyze(payload)

    # Persist report to history when requested and prediction exists
    if req.save_to_history and analysis.get("vibecheck_results", {}).get("has_prediction"):
        res = analysis["vibecheck_results"]
        saved_record = {
            "title": analysis["metadata"]["title"],
            "platform": "youtube",
            "overall_sentiment": res["overall_vibe"],
            "overall_score": res["sentiment_distribution"]["positive_percentage"],
            "dominant_vibe": res["overall_vibe"],
            "total_comments": analysis["metadata"]["comments_analyzed"],
            "data_source": analysis["metadata"].get("data_source") or "url",
            "created_at": analysis["metadata"].get("analyzed_at"),
            "summary": res["analysis_summary"]
        }
        try:
            data_access.save_vibecheck_report(saved_record)
        except Exception:
            pass

    return analysis


@router.get("/history")
def get_vibecheck_history():
    """Returns past sentiment analysis reports from persistent storage."""
    try:
        history = data_access.get_vibecheck_history()
    except Exception:
        history = []
    return {
        "total_reports": len(history),
        "reports": history
    }


@router.delete("/history/{report_id}")
def delete_report(report_id: str):
    """Deletes an analysis report from persistent storage by ID."""
    try:
        success = data_access.delete_vibecheck_report(report_id)
        return {"success": success, "report_id": report_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
