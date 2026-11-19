"""
CreatorPulse AI - YouTube Comment Sentiment Analyzer Service
------------------------------------------------------------
Dedicated to YouTube comment analysis via official YouTube Data API v3
and traditional Machine Learning algorithms.
"""

from .base import PlatformAdapter, AnalysisPayload, CommentItem, CoverageReport
from .youtube_adapter import YouTubeAdapter
from .manual_adapter import ManualAdapter
from .analysis import VibeAnalyzer

__all__ = [
    "PlatformAdapter",
    "AnalysisPayload",
    "CommentItem",
    "CoverageReport",
    "YouTubeAdapter",
    "ManualAdapter",
    "VibeAnalyzer"
]
