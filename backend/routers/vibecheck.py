"""
CreatorPulse AI - VibeCheck AI Router
-------------------------------------
YouTube comment sentiment analysis endpoints.
Connects official YouTube Data API v3 adapter to the traditional ML sentiment pipeline.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import os

from backend.services import data_access
from backend.services.vibecheck import (
    YouTubeAdapter,
    ManualAdapter,
    VibeAnalyzer
)
from backend.ml.classifier import get_model_metadata

router = APIRouter(prefix="/api/vibecheck", tags=["VibeCheck AI"])

# Initialize platform adapters (YouTube and direct comments text input)
yt_adapter = YouTubeAdapter()
manual_adapter = ManualAdapter()


@router.get("/status")
def get_vibecheck_status():
    """Returns YouTube API configuration status and winning ML model."""
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
    Returns the rigorous evaluation and comparison metrics of the 4 traditional ML algorithms:
    1. Multinomial Naive Bayes
    2. Logistic Regression
    3. Linear Support Vector Machine (Linear SVM)
    4. Random Forest Classifier
    Includes Accuracy, Precision, Recall, F1-score, and Confusion Matrices.
    """
    meta = get_model_metadata()
    if not meta or "models" not in meta or "Random Forest" not in meta.get("models", {}):
        from backend.ml.trainer import train_and_evaluate_models
        meta = train_and_evaluate_models()
    return meta


@router.get("/supported-platforms")
def get_supported_platforms():
    """Returns capabilities and guidelines for YouTube comment sentiment analysis."""
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
    Main VibeCheck AI analysis endpoint for YouTube.
    Retrieves video details and top comments via official YouTube Data API v3,
    runs preprocessing, and applies the trained traditional Machine Learning model.
    """
    target = (req.target or "").strip()
    input_type = req.input_type.strip().lower()

    try:
        if input_type == "url" and target:
            lower_target = target.lower()

            # Reject unsupported platforms with clear messaging
            if "twitter.com" in lower_target or "x.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="X (Twitter) is not supported. CreatorPulse AI focuses exclusively on YouTube video comment sentiment analysis."
                )
            if "instagram.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="Instagram is not supported. CreatorPulse AI focuses exclusively on YouTube video comment sentiment analysis."
                )
            if "tiktok.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="TikTok is not supported. CreatorPulse AI focuses exclusively on YouTube video comment sentiment analysis."
                )
            if "linkedin.com" in lower_target:
                raise HTTPException(
                    status_code=400,
                    detail="LinkedIn is not supported. CreatorPulse AI focuses exclusively on YouTube video comment sentiment analysis."
                )

            if yt_adapter.can_handle(target):
                payload = yt_adapter.fetch_data({"url": target})
            else:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid URL. Please enter a valid YouTube video URL "
                        "(e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)."
                    )
                )
        else:
            # Direct text or pasted comments fallback
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

    # Run ML analysis pipeline
    analysis = VibeAnalyzer.analyze(payload)

    # Save to history if requested and if analysis was successful
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
