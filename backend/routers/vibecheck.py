"""
CreatorPulse AI - VibeCheck AI Router
-------------------------------------
Social media sentiment and content intelligence endpoints.
Connects multi-platform adapters (YouTube, Instagram, TikTok, Manual/Transcript/CSV)
to the VibeAnalyzer pipeline and persists report history via the DAL.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from backend.services import data_access
from backend.services.vibecheck import (
    YouTubeAdapter,
    InstagramAdapter,
    TikTokAdapter,
    ManualAdapter,
    VibeAnalyzer
)

router = APIRouter(prefix="/api/vibecheck", tags=["VibeCheck AI"])

# Initialize adapters
yt_adapter = YouTubeAdapter()
ig_adapter = InstagramAdapter()
tt_adapter = TikTokAdapter()
manual_adapter = ManualAdapter()


class AnalyzeRequest(BaseModel):
    target: Optional[str] = Field(None, description="URL of the video or post")
    input_type: str = Field("url", description="'url', 'pasted_comments', 'transcript', or 'csv_text'")
    platform: Optional[str] = Field("youtube", description="Platform identifier: youtube, instagram, tiktok, general")
    title: Optional[str] = Field(None, description="Optional custom post title")
    author: Optional[str] = Field(None, description="Optional custom creator name")
    raw_text: Optional[str] = Field(None, description="Raw text for pasted comments, transcript, or CSV")
    save_to_history: bool = Field(True, description="Whether to persist report in DAL history")


@router.get("/supported-platforms")
def get_supported_platforms():
    """Returns capabilities and coverage notices for all supported input modes."""
    return {
        "metadata": data_access.get_system_metadata(),
        "platforms": [
            {
                "id": "youtube",
                "name": "YouTube",
                "icon": "Youtube",
                "status": "Working now (API or Sample)",
                "capabilities": ["Video Metadata", "Live Top Comments", "Like Counts", "Pacing & Sentiment"],
                "limitations": "Requires YOUTUBE_API_KEY in backend/.env for live comments; falls back cleanly to realistic sample data.",
                "url_examples": ["https://www.youtube.com/watch?v=...", "https://youtu.be/..."]
            },
            {
                "id": "instagram",
                "name": "Instagram",
                "icon": "Instagram",
                "status": "Working now (oEmbed + Pasted)",
                "capabilities": ["oEmbed Thumbnail", "Author", "Caption", "Audience Vibe via Pasted Comments"],
                "limitations": "Meta Graph API limits third-party comment access without OAuth; paste comments into fallback tab for deep sentiment.",
                "url_examples": ["https://www.instagram.com/p/...", "https://www.instagram.com/reel/..."]
            },
            {
                "id": "tiktok",
                "name": "TikTok",
                "icon": "Video",
                "status": "Working now (oEmbed + Pasted)",
                "capabilities": ["oEmbed Preview", "Author Name", "Title", "Audience Vibe via Pasted Comments"],
                "limitations": "TikTok oEmbed does not include comment streams; paste comments or transcript for topic analysis.",
                "url_examples": ["https://www.tiktok.com/@creator/video/..."]
            },
            {
                "id": "manual",
                "name": "Pasted Comments & CSV",
                "icon": "MessageSquare",
                "status": "Working now (100% Real User Data)",
                "capabilities": ["Batch Sentiment", "8 Vibe Clusters", "Spam & Bot Filtering", "Question Identification", "Evidence Quotes"],
                "limitations": "None. Directly processes creator-supplied audience feedback.",
                "url_examples": []
            },
            {
                "id": "transcript",
                "name": "Audio / Video Transcript",
                "icon": "FileText",
                "status": "Working now (100% Real User Data)",
                "capabilities": ["Pacing Breakdown", "Key Topics", "Local Whisper Instructions (Zero Cloud Cost)"],
                "limitations": "Accepts plain text transcripts or SRT subtitle files with timestamp auto-stripping.",
                "url_examples": []
            }
        ]
    }


@router.post("/analyze")
def analyze_content(req: AnalyzeRequest):
    """
    Main entry point for VibeCheck AI.
    Fetches post metadata and comments through the appropriate adapter, runs VADER
    sentiment and 8-vibe classification, extracts topics, detects spam, and generates
    concrete recommendations citing exact numbers.
    """
    target = (req.target or "").strip()
    input_type = req.input_type.strip().lower()

    # Route to matching adapter
    if input_type == "url" and target:
        if yt_adapter.can_handle(target):
            payload = yt_adapter.fetch_data({"url": target})
        elif ig_adapter.can_handle(target):
            payload = ig_adapter.fetch_data({"url": target, "comments_text": req.raw_text})
        elif tt_adapter.can_handle(target):
            payload = tt_adapter.fetch_data({"url": target, "comments_text": req.raw_text})
        else:
            # Fallback to manual parser
            payload = manual_adapter.fetch_data({
                "input_type": "pasted_comments",
                "raw_text": req.raw_text or target,
                "platform": req.platform or "general",
                "title": req.title,
                "author": req.author
            })
    else:
        # Manual input (pasted comments, transcript, or CSV)
        payload = manual_adapter.fetch_data({
            "input_type": input_type,
            "raw_text": req.raw_text or "",
            "platform": req.platform or "general",
            "title": req.title,
            "author": req.author
        })

    # Run analysis pipeline
    analysis = VibeAnalyzer.analyze(payload)

    # Save to history if requested
    if req.save_to_history:
        saved_record = {
            "title": analysis["metadata"]["title"],
            "platform": analysis["metadata"]["platform"],
            "author": analysis["metadata"]["author"],
            "post_url": analysis["metadata"]["post_url"],
            "vibe_score": analysis["sentiment"]["vibe_score"],
            "dominant_vibe": analysis["sentiment"]["dominant_vibe"],
            "comment_count": analysis["engagement"]["total_comments"],
            "positive_pct": analysis["sentiment"]["breakdown"]["positive"],
            "negative_pct": analysis["sentiment"]["breakdown"]["negative"],
            "summary": analysis["summary"],
            "full_analysis": analysis
        }
        persisted = data_access.save_vibecheck_report(saved_record)
        analysis["report_id"] = persisted.get("report_id")

    return analysis


@router.get("/history")
def get_vibecheck_history(limit: int = 50):
    """Retrieves previous VibeCheck analysis reports."""
    reports = data_access.get_vibecheck_reports(limit=limit)
    return {
        "metadata": data_access.get_system_metadata(),
        "total": len(reports),
        "reports": reports
    }


@router.get("/history/{report_id}")
def get_vibecheck_report_detail(report_id: str):
    """Retrieves a single VibeCheck analysis report by ID."""
    report = data_access.get_vibecheck_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="VibeCheck report not found")
    return report


@router.delete("/history/{report_id}")
def delete_vibecheck_report_endpoint(report_id: str):
    """Deletes a stored VibeCheck report."""
    success = data_access.delete_vibecheck_report(report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True, "message": f"Deleted report {report_id}"}


@router.get("/whisper-guide")
def get_whisper_guide():
    """Provides local OpenAI Whisper transcription setup instructions."""
    return ManualAdapter.get_whisper_instructions()
