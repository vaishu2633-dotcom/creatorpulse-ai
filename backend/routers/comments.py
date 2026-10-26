"""
CreatorPulse AI - Comment Insights Router
-------------------------------------------
Provides audience sentiment breakdowns, discussion themes, and repeated questions.
"""

from fastapi import APIRouter, Query
from typing import Optional
from backend.services import data_access

router = APIRouter(prefix="/api/comments", tags=["Comments"])

@router.get("")
def get_comments(
    platform: Optional[str] = Query("all"),
    sentiment: Optional[str] = Query("all"),
    theme: Optional[str] = Query("all"),
    is_question: Optional[bool] = Query(None)
):
    comments = data_access.get_comments(
        platform=platform,
        sentiment=sentiment,
        theme=theme,
        is_question=is_question
    )
    return {
        "metadata": data_access.get_system_metadata(),
        "total": len(comments),
        "comments": comments
    }

@router.get("/summary")
def get_comments_summary(platform: Optional[str] = Query("all")):
    return data_access.get_comments_summary(platform=platform)
