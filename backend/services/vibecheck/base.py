"""
VibeCheck AI - Base Adapter and Models
--------------------------------------
All platform adapters implement this contract.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class CommentItem(BaseModel):
    comment_id: str
    author: str
    text: str
    like_count: int = 0
    published_at: Optional[str] = None
    is_reply: bool = False


class CoverageReport(BaseModel):
    has_metadata: bool = False
    has_caption: bool = False
    has_transcript: bool = False
    comments_fetched: int = 0
    comments_available: Optional[int] = None
    notice: str = ""
    source_type: str = "url"  # "url", "pasted_comments", "transcript", "csv_file"
    is_sample_data: bool = False


class AnalysisPayload(BaseModel):
    platform: str
    post_url: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    transcript: Optional[str] = None
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    comment_count: Optional[int] = None
    comments: List[CommentItem] = Field(default_factory=list)
    coverage: CoverageReport


class PlatformAdapter:
    """Base interface for platform adapters."""

    def can_handle(self, target: str) -> bool:
        """Determines if this adapter can process the given input or URL."""
        raise NotImplementedError

    def fetch_data(self, input_payload: Dict[str, Any]) -> AnalysisPayload:
        """Retrieves metadata and comments for the target."""
        raise NotImplementedError
