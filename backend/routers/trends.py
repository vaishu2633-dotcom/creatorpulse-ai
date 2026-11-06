"""
CreatorPulse AI - Trend Explorer Router
-----------------------------------------
Delivers platform-specific trending topics with time-window filters (24h, 7d, 30d),
regional YouTube trends (US, IN, GB), and rising topics from the creator's own active dataset.
"""

from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from backend.services import data_access

router = APIRouter(prefix="/api/trends", tags=["Trends"])

@router.get("")
@router.get("/")
def get_trends(
    platform: Optional[str] = Query("all"),
    time_window: Optional[str] = Query("all"),
    region: Optional[str] = Query("all"),
    include_creator_topics: bool = Query(True)
):
    """
    Returns platform-tailored trending topics with provenance:
    - Real YouTube Data API trends when YOUTUBE_API_KEY is configured
    - Topics rising in the user's active creator dataset
    - Truthful fallback to sample trends with 'Sample data' label when no key is present
    """
    return data_access.get_trends_package(
        platform=platform,
        time_window=time_window,
        region=region,
        include_creator_topics=include_creator_topics
    )

@router.get("/regions")
def get_trending_regions() -> Dict[str, Any]:
    """Returns supported regional markets for trend analysis."""
    return {
        "metadata": data_access.get_system_metadata(),
        "regions": [
            {"code": "all", "label": "Global (All Regions)"},
            {"code": "US", "label": "United States (US)"},
            {"code": "IN", "label": "India (IN)"},
            {"code": "GB", "label": "United Kingdom (GB)"}
        ]
    }

@router.get("/categories")
def get_trending_categories() -> Dict[str, Any]:
    """Returns available topic categories."""
    return {
        "metadata": data_access.get_system_metadata(),
        "categories": [
            "All Categories",
            "Tech & Engineering",
            "Design & UI/UX",
            "AI & Future Tech",
            "Creator Economy",
            "Channel High-Growth"
        ]
    }
