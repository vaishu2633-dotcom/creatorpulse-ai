"""
CreatorPulse AI - Dashboard Router
------------------------------------
Provides aggregated analytics, follower growth, engagement snapshots,
and top/bottom performing posts.
"""

from fastapi import APIRouter, Query
from typing import Optional
from backend.services import data_access

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_summary(platform: Optional[str] = Query("all")):
    return data_access.get_dashboard_summary(platform=platform)

@router.get("/snapshots")
def get_snapshots(platform: Optional[str] = Query("all"), days: int = Query(30)):
    return {
        "metadata": data_access.get_system_metadata(),
        "snapshots": data_access.get_metric_snapshots(platform=platform, days=days)
    }

@router.get("/posts")
def get_recent_posts(
    platform: Optional[str] = Query("all"),
    post_type: Optional[str] = Query("all"),
    limit: int = Query(25),
    sort_by: str = Query("published_at"),
    descending: bool = Query(True)
):
    posts = data_access.get_posts(
        platform=platform,
        post_type=post_type,
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
def get_top_posts(platform: Optional[str] = Query("all"), limit: int = Query(5)):
    return {
        "metadata": data_access.get_system_metadata(),
        "posts": data_access.get_top_posts(platform=platform, limit=limit)
    }

@router.get("/bottom-posts")
def get_bottom_posts(platform: Optional[str] = Query("all"), limit: int = Query(5)):
    return {
        "metadata": data_access.get_system_metadata(),
        "posts": data_access.get_bottom_posts(platform=platform, limit=limit)
    }

@router.get("/creators")
def get_creators(platform: Optional[str] = Query("all")):
    return {
        "metadata": data_access.get_system_metadata(),
        "creators": data_access.get_creators(platform=platform)
    }
