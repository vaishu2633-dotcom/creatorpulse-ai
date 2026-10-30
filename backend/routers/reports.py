"""
CreatorPulse AI - Channel Reports & Analytics Router
------------------------------------------------------
Provides deep channel analytics moved from Dashboard:
- KPI Totals: Views, Likes, Comments, Engagement Rate, Breakout Hit Rate
- Trend charts with sparklines (views and engagement over time)
- Top and bottom performing posts
- Date filters (7d, 30d, 90d, all)
- Platform filtering and sorting
- CSV and summary export matching active data source
"""

import io
import csv
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, Response
from backend.services import data_access

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/analytics")
def get_channel_analytics(
    platform: Optional[str] = Query("all"),
    days: Optional[int] = Query(None),
    sort_by: Optional[str] = Query("published_at"),
    descending: Optional[bool] = Query(True),
    limit: Optional[int] = Query(50)
):
    """
    Returns full channel analytics for the Reports page matching active data source:
    Totals, trend snapshots, top hits, lowest posts, and sorted posts.
    """
    summary = data_access.get_dashboard_summary(platform=platform, days=days)
    snapshots = data_access.get_metric_snapshots(platform=platform, days=days or 30)
    top_posts = data_access.get_top_posts(platform=platform, days=days, limit=10)
    bottom_posts = data_access.get_bottom_posts(platform=platform, days=days, limit=10)
    all_posts = data_access.get_posts(
        platform=platform,
        post_type="all",
        limit=limit or 50,
        sort_by=sort_by or "published_at",
        descending=descending if descending is not None else True,
        days=days
    )
    
    return {
        "summary": summary,
        "snapshots": snapshots if isinstance(snapshots, list) else snapshots.get("snapshots", []),
        "top_posts": top_posts if isinstance(top_posts, list) else top_posts.get("top_posts", []),
        "bottom_posts": bottom_posts if isinstance(bottom_posts, list) else bottom_posts.get("bottom_posts", []),
        "posts": all_posts,
        "total_posts_count": len(all_posts),
        "active_data_source": data_access.get_active_data_source(),
        "metadata": data_access.get_system_metadata()
    }


@router.get("/export/csv")
def export_channel_csv(
    platform: Optional[str] = Query("all"),
    days: Optional[int] = Query(None)
):
    """
    Generates a downloadable CSV containing active posts and KPI metrics
    matching the on-screen numbers.
    """
    posts = data_access.get_posts(
        platform=platform,
        post_type="all",
        limit=10000,
        sort_by="published_at",
        descending=True,
        days=days
    )
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Post ID",
        "Platform",
        "Post Type",
        "Title",
        "Views",
        "Likes",
        "Comments",
        "Engagement Rate (%)",
        "Published At",
        "Is Breakout"
    ])
    
    for p in posts:
        er_pct = round(float(p.get("engagement_rate", 0)) * 100, 2)
        writer.writerow([
            p.get("post_id", ""),
            p.get("platform", ""),
            p.get("post_type", ""),
            p.get("title", ""),
            p.get("views", 0),
            p.get("likes", 0),
            p.get("comments", 0),
            f"{er_pct}%",
            p.get("published_at", ""),
            "Yes" if p.get("is_breakout") else "No"
        ])
        
    csv_bytes = output.getvalue().encode("utf-8")
    filename = f"creatorpulse_reports_{platform}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"
    
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
