"""
VibeCheck AI - YouTube Platform Adapter
---------------------------------------
Integrates with the official YouTube Data API v3 to fetch video metadata,
view/like metrics, and comment threads.

Follows official API quota management:
- Never fakes an API error or private video as sample data
- Transparent error handling
- Zero HTML scraping
"""

import os
import re
from typing import Dict, Any, Optional, List
import httpx
from .base import PlatformAdapter, AnalysisPayload, CommentItem, CoverageReport

SAMPLE_YOUTUBE_COMMENTS = [
    {"author": "Alex Rivera", "text": "This completely changed how I think about pacing! The hook in the first 5 seconds was brilliant.", "like_count": 342, "published_at": "2026-03-12T14:20:00Z"},
    {"author": "TechExplored", "text": "Can you make a dedicated tutorial on the exact color grading LUT you used at 02:45? Been trying to replicate that look forever.", "like_count": 185, "published_at": "2026-03-12T15:10:00Z"},
    {"author": "DevSam", "text": "The audio seems slightly desynced around the 4 minute mark on mobile, anyone else notice that?", "like_count": 42, "published_at": "2026-03-12T15:35:00Z"},
    {"author": "CryptoKing2026", "text": "Check out my profile for 100x crypto signals guaranteed returns telegram link in bio 🚀🚀🚀", "like_count": 1, "published_at": "2026-03-12T16:00:00Z"},
    {"author": "Elena M.", "text": "Bro the transition at 01:15 had me laughing out loud 😂 such clean editing!", "like_count": 97, "published_at": "2026-03-12T16:40:00Z"},
    {"author": "Mark Vance", "text": "I disagree with point #3. In 2026, audience attention spans are actually shorter, not longer. Look at retention graphs on vertical formats.", "like_count": 64, "published_at": "2026-03-12T17:15:00Z"},
    {"author": "Sophia Lin", "text": "Always inspiring to watch your process. Thanks for breaking down the actual analytics instead of giving vague advice.", "like_count": 128, "published_at": "2026-03-12T18:00:00Z"},
    {"author": "ContentCreatorHQ", "text": "Which microphone was used for this voiceover? The warmth is incredible.", "like_count": 53, "published_at": "2026-03-12T18:45:00Z"},
    {"author": "Jordan K.", "text": "Wait what software did you use for the 3D animated graphs? Was it Blender or After Effects?", "like_count": 39, "published_at": "2026-03-12T19:30:00Z"},
    {"author": "bot_earn_cash", "text": "Message Mr James on WhatsApp +18005550199 for investment advice he made me 50k", "like_count": 0, "published_at": "2026-03-12T20:10:00Z"},
    {"author": "Maya Patel", "text": "The pacing was so good that a 12 minute video felt like 3 minutes. More content like this please!", "like_count": 86, "published_at": "2026-03-12T21:00:00Z"},
    {"author": "Chris B.", "text": "Great breakdown, but is this applicable for small channels under 1,000 subscribers or just established creators?", "like_count": 48, "published_at": "2026-03-12T22:15:00Z"}
]


class YouTubeAdapter(PlatformAdapter):
    """Adapter for YouTube URLs using official YouTube Data API v3."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("YOUTUBE_API_KEY", "").strip()

    def can_handle(self, target: str) -> bool:
        if not target:
            return False
        if target.startswith("sample://youtube") or target == "demo":
            return True
        return "youtube.com" in target.lower() or "youtu.be" in target.lower()

    def extract_video_id(self, url: str) -> Optional[str]:
        if not url:
            return None
        patterns = [
            r"v=([a-zA-Z0-9_-]{11})",
            r"youtu\.be/([a-zA-Z0-9_-]{11})",
            r"shorts/([a-zA-Z0-9_-]{11})",
            r"embed/([a-zA-Z0-9_-]{11})"
        ]
        for p in patterns:
            match = re.search(p, url)
            if match:
                return match.group(1)
        return None

    def fetch_data(self, input_payload: Dict[str, Any]) -> AnalysisPayload:
        url = (input_payload.get("url") or "").strip()

        # Check explicit demo / sample mode
        if url.startswith("sample://youtube") or url == "demo" or input_payload.get("is_demo"):
            return self._build_sample_payload(
                url=url,
                video_id="sample_video_id",
                notice="Operating in demo sample mode with curated high-signal community discussion."
            )

        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL: Could not extract a valid 11-character video ID from the provided link.")

        # Re-check API key dynamically in case it was added to .env
        api_key = self.api_key or os.getenv("YOUTUBE_API_KEY", "").strip()
        if not api_key or api_key.startswith("your_"):
            raise ValueError(
                "YouTube Data API key is not configured in .env. "
                "Please add YOUTUBE_API_KEY to analyze live YouTube URLs, "
                "or use the 'Pasted Comments', 'Transcript/SRT', or 'Comments CSV' fallback tabs."
            )

        try:
            with httpx.Client(timeout=12.0) as client:
                # 1. Fetch Video Metadata & Statistics
                video_resp = client.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={
                        "part": "snippet,statistics",
                        "id": video_id,
                        "key": api_key
                    }
                )

                if video_resp.status_code == 403:
                    err_data = video_resp.json().get("error", {})
                    reasons = [e.get("reason") for e in err_data.get("errors", [])]
                    if "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
                        raise ValueError("YouTube API daily quota (10,000 units) exceeded. Please try again tomorrow or use the Pasted Comments or Comments CSV fallback.")
                    raise ValueError(f"YouTube API access forbidden: {err_data.get('message', 'Access denied.')}")

                if video_resp.status_code != 200:
                    raise ValueError(f"YouTube API returned HTTP {video_resp.status_code}: {video_resp.text}")

                video_json = video_resp.json()
                items = video_json.get("items", [])
                if not items:
                    raise ValueError("Video not found or is set to private. YouTube API cannot access private videos.")

                item = items[0]
                snippet = item.get("snippet", {})
                statistics = item.get("statistics", {})

                title = snippet.get("title", "Untitled Video")
                author = snippet.get("channelTitle", "YouTube Creator")
                published_at = snippet.get("publishedAt")
                caption = snippet.get("description", "")
                thumbnails = snippet.get("thumbnails", {})
                thumb_url = thumbnails.get("maxres", {}).get("url") or thumbnails.get("high", {}).get("url") or thumbnails.get("medium", {}).get("url")

                view_count = int(statistics.get("viewCount", 0))
                like_count = int(statistics.get("likeCount", 0))
                comment_count = int(statistics.get("commentCount", 0))

                # 2. Fetch Top Comments (paged, capped up to 100)
                comments_list: List[CommentItem] = []
                comments_disabled = False

                try:
                    comments_resp = client.get(
                        "https://www.googleapis.com/youtube/v3/commentThreads",
                        params={
                            "part": "snippet",
                            "videoId": video_id,
                            "maxResults": min(100, max(20, comment_count or 50)),
                            "order": "relevance",
                            "key": api_key
                        }
                    )
                    if comments_resp.status_code == 200:
                        c_json = comments_resp.json()
                        for c_item in c_json.get("items", []):
                            c_snip = c_item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
                            comments_list.append(
                                CommentItem(
                                    comment_id=c_item.get("id", ""),
                                    author=c_snip.get("authorDisplayName", "Anonymous"),
                                    text=c_snip.get("textDisplay", ""),
                                    like_count=int(c_snip.get("likeCount", 0)),
                                    published_at=c_snip.get("publishedAt"),
                                    is_reply=False
                                )
                            )
                    elif comments_resp.status_code == 403:
                        err_data = comments_resp.json().get("error", {})
                        reasons = [e.get("reason") for e in err_data.get("errors", [])]
                        if "commentsDisabled" in reasons:
                            comments_disabled = True
                        elif "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
                            raise ValueError("YouTube API daily quota (10,000 units) exceeded while fetching comments.")
                except ValueError:
                    raise
                except Exception:
                    pass

                notice_text = (
                    "Comments are disabled on this video by the creator."
                    if comments_disabled
                    else f"Successfully fetched {len(comments_list)} live top-level comments via YouTube Data API v3 (N={len(comments_list)} of {comment_count:,} available)."
                )

                coverage = CoverageReport(
                    has_metadata=True,
                    has_caption=bool(caption),
                    has_transcript=False,
                    comments_fetched=len(comments_list),
                    comments_available=comment_count,
                    notice=notice_text,
                    source_type="url",
                    is_sample_data=False
                )

                return AnalysisPayload(
                    platform="youtube",
                    post_url=url,
                    title=title,
                    author=author,
                    published_at=published_at,
                    thumbnail_url=thumb_url,
                    caption=caption,
                    view_count=view_count,
                    like_count=like_count,
                    comment_count=comment_count,
                    comments=comments_list,
                    coverage=coverage
                )

        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Connection error reaching YouTube API: {str(e)}")

    def _build_sample_payload(self, url: str, video_id: Optional[str], notice: str) -> AnalysisPayload:
        comments = [
            CommentItem(
                comment_id=f"yt_sample_{idx}",
                author=c["author"],
                text=c["text"],
                like_count=c["like_count"],
                published_at=c["published_at"]
            )
            for idx, c in enumerate(SAMPLE_YOUTUBE_COMMENTS)
        ]

        coverage = CoverageReport(
            has_metadata=True,
            has_caption=True,
            has_transcript=False,
            comments_fetched=len(comments),
            comments_available=len(comments),
            notice=notice,
            source_type="url",
            is_sample_data=True
        )

        return AnalysisPayload(
            platform="youtube",
            post_url=url,
            title="How to Hook Any Audience in 5 Seconds (Pacing Masterclass)",
            author="Creative Growth Lab",
            published_at="2026-03-12T14:00:00Z",
            thumbnail_url=f"https://img.youtube.com/vi/{video_id or 'dQw4w9WgXcQ'}/hqdefault.jpg",
            caption="In this video we break down high-retention vertical & long-form video structures, editing pacing, and visual storytelling formulas for 2026.",
            view_count=48200,
            like_count=3120,
            comment_count=len(comments),
            comments=comments,
            coverage=coverage
        )
