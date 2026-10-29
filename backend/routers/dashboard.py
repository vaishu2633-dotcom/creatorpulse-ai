"""
CreatorPulse AI - Dashboard Router
------------------------------------
Provides aggregated analytics, follower growth, engagement snapshots,
and top/bottom performing posts computed from the active data source.
Supports platform filtering, time range filtering (days), and sorting.
"""

from fastapi import APIRouter, Query
from typing import Optional
from backend.services import data_access

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_summary(
    platform: Optional[str] = Query("all"),
    days: Optional[int] = Query(None)
):
    """
    Returns high-level totals, engagement rates, breakout counts,
    and sparkline telemetry computed strictly from the active data source.
    """
    return data_access.get_dashboard_summary(platform=platform, days=days)

@router.get("/snapshots")
def get_snapshots(
    platform: Optional[str] = Query("all"),
    days: int = Query(30)
):
    """Returns time-series daily metrics for area charts and trajectory."""
    return {
        "metadata": data_access.get_system_metadata(),
        "snapshots": data_access.get_metric_snapshots(platform=platform, days=days)
    }

@router.get("/posts")
def get_recent_posts(
    platform: Optional[str] = Query("all"),
    post_type: Optional[str] = Query("all"),
    days: Optional[int] = Query(None),
    limit: int = Query(25),
    sort_by: str = Query("published_at"),
    descending: bool = Query(True)
):
    """
    Returns filtered and sorted posts from active dataset with dynamic status chips.
    """
    posts = data_access.get_posts(
        platform=platform,
        post_type=post_type,
        days=days,
        limit=limit,
        sort_by=sort_by,
        descending=descending
    )
    return {
        "metadata": data_access.get_system_metadata(),
        "total": len(posts),
        "posts": posts
    }

@router.get("/top-posts")
def get_top_posts(
    platform: Optional[str] = Query("all"),
    days: Optional[int] = Query(None),
    limit: int = Query(5)
):
    """Returns top performing posts by engagement rate."""
    return {
        "metadata": data_access.get_system_metadata(),
        "posts": data_access.get_top_posts(platform=platform, days=days, limit=limit)
    }

@router.get("/bottom-posts")
def get_bottom_posts(
    platform: Optional[str] = Query("all"),
    days: Optional[int] = Query(None),
    limit: int = Query(5)
):
    """Returns bottom performing posts for improvement diagnostics."""
    return {
        "metadata": data_access.get_system_metadata(),
        "posts": data_access.get_bottom_posts(platform=platform, days=days, limit=limit)
    }

@router.get("/creators")
def get_creators(platform: Optional[str] = Query("all")):
    return {
        "metadata": data_access.get_system_metadata(),
        "creators": data_access.get_creators(platform=platform)
    }
