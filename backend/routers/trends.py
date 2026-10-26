"""
CreatorPulse AI - Trend Explorer Router
-----------------------------------------
Delivers platform-specific trending topics with time-window filters (24h, 7d, 30d).
"""

from fastapi import APIRouter, Query
from typing import Optional
from backend.services import data_access

router = APIRouter(prefix="/api/trends", tags=["Trends"])

@router.get("")
def get_trends(
    platform: Optional[str] = Query("all"),
    time_window: Optional[str] = Query("all")
):
    trends = data_access.get_trends(platform=platform, time_window=time_window)
    return {
        "metadata": data_access.get_system_metadata(),
        "total": len(trends),
        "trends": trends
    }
