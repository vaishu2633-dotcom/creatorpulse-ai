"""
CreatorPulse AI - VibeCheck AI Router
-------------------------------------
Social media sentiment analysis endpoints for YouTube and X (Twitter).
Connects official platform adapters to the traditional ML sentiment pipeline.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os

from backend.services import data_access
from backend.services.vibecheck import (
    YouTubeAdapter,
    TwitterAdapter,
    ManualAdapter,
    VibeAnalyzer
)
from backend.ml.classifier import get_model_metadata

router = APIRouter(prefix="/api/vibecheck", tags=["VibeCheck AI"])

# Initialize platform adapters (YouTube, X, and direct text input)
yt_adapter = YouTubeAdapter()
tw_adapter = TwitterAdapter()
manual_adapter = ManualAdapter()


@router.get("/status")
def get_vibecheck_status():
    """Returns platform API configuration status and winning ML model."""
    yt_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    x_token = os.getenv("TWITTER_BEARER_TOKEN", "").strip()
    model_name = VibeAnalyzer.get_selected_model_name()

    return {
        "status": "operational",
        "feature": "VibeCheck AI",
        "selected_ml_model": model_name,
        "youtube_api_configured": bool(yt_key and not yt_key.startswith("your_")),
        "x_api_configured": bool(x_token and not x_token.startswith("your_")),
        "supported_platforms": ["youtube", "twitter"],
        "message": f"VibeCheck AI active with {model_name}."
    }


@router.get("/models")
def get_ml_models_comparison():
    """
    Returns the rigorous evaluation and comparison metrics of the 3 traditional ML algorithms:
    1. Logistic Regression
    2. Multinomial Naive Bayes
    3. Linear Support Vector Machine (Linear SVM)
    Includes Accuracy, Precision, Recall, F1-score, and Confusion Matrices.
    """
    meta = get_model_metadata()
    if not meta or "models" not in meta:
        from backend.ml.trainer import train_and_evaluate_models
        meta = train_and_evaluate_models()
    return meta


@router.get("/supported-platforms")
def get_supported_platforms():
    """Returns capabilities and guidelines for the two supported platforms."""
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
                "notes": "Retrieves real top-level video comments through the official YouTube API v3."
            },
            {
                "id": "twitter",
                "name": "X (Twitter)",
                "icon": "Twitter",
                "status": "Active (Official X API v2)",
                "capabilities": ["Post Validation", "Public Preview", "Audience Replies / Post Text Sentiment"],
                "url_examples": [
                    "https://x.com/username/status/1234567890",
                    "https://twitter.com/username/status/1234567890"
                ],
                "notes": "Authenticates using official X API v2 Bearer Token. If developer credits are depleted (HTTP 402), users can paste comments directly for ML sentiment prediction."
            }
        ]
    }


class AnalyzeRequest(BaseModel):
    target: Optional[str] = Field(None, description="URL of the YouTube video or X post")
    input_type: str = Field("url", description="'url' or 'pasted_comments'")
    platform: Optional[str] = Field("youtube", description="Platform identifier: youtube or twitter")
    title: Optional[str] = Field(None, description="Optional custom title")
    raw_text: Optional[str] = Field(None, description="Optional audience comments or post text")
    save_to_history: bool = Field(True, description="Whether to persist report in history")


@router.post("/analyze")
def analyze_content(req: AnalyzeRequest):
    """
    Main VibeCheck AI analysis endpoint.
    Retrieves content from YouTube or X (Twitter), extracts text, runs preprocessing,
    and applies the trained traditional Machine Learning model for sentiment prediction.
    """
    target = (req.target or "").strip()
    input_type = req.input_type.strip().lower()

    try:
        if input_type == "url" and target:
            lower_target = target.lower()

            # Reject unsupported platforms
            if "instagram.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="CreatorPulse AI supports YouTube and X (Twitter) only. Instagram is not supported."
                )
            if "tiktok.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="CreatorPulse AI supports YouTube and X (Twitter) only. TikTok is not supported."
                )
            if "linkedin.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="CreatorPulse AI supports YouTube and X (Twitter) only. LinkedIn is not supported."
                )

            if yt_adapter.can_handle(target):
                payload = yt_adapter.fetch_data({"url": target})
            elif tw_adapter.can_handle(target):
                payload = tw_adapter.fetch_data({"url": target, "comments_text": req.raw_text})
            else:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid URL. Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...) "
                        "or X post URL (e.g., https://x.com/username/status/...)."
                    )
                )
        else:
            # Direct text or pasted comments
            raw_text = (req.raw_text or "").strip()
            if not raw_text:
                raise HTTPException(
                    status_code=400,
                    detail="No text or comments provided. Please enter a URL or paste text to analyze."
                )

            platform_choice = (req.platform or "youtube").lower()
            if platform_choice not in ("youtube", "twitter", "x"):
                platform_choice = "youtube"

            payload = manual_adapter.fetch_data({
                "input_type": "pasted_comments",
                "raw_text": raw_text,
                "platform": "twitter" if platform_choice in ("twitter", "x") else "youtube",
                "title": req.title or "Audience Feedback",
                "author": "Audience"
            })
    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)}")

    # Run ML analysis pipeline
    analysis = VibeAnalyzer.analyze(payload)

    # Save to history if requested and if analysis was successful
    if req.save_to_history and analysis.get("vibecheck_results", {}).get("has_prediction"):
        res = analysis["vibecheck_results"]
        saved_record = {
            "title": analysis["metadata"]["title"],
            "platform": analysis["metadata"]["platform"],
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
    """Returns saved analysis reports."""
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
    """Deletes an analysis report from history."""
    try:
        success = data_access.delete_vibecheck_report(report_id)
        return {"success": success, "report_id": report_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
