"""
VibeCheck AI - X (Twitter) Platform Adapter
-------------------------------------------
Official X API v2 integration with graceful public oEmbed fallback.

Capabilities:
1. URL validation & numeric post ID extraction for:
   - x.com/username/status/POST_ID
   - twitter.com/username/status/POST_ID
2. Official X API v2 lookup via Bearer Token.
3. Proper handling of HTTP 402 (credits depleted), 401 (unauthorized),
   403 (forbidden/restricted tier), and 429 (rate limited).
4. Official public X oEmbed preview fallback when API credits are depleted.
5. Real Pasted Comments sentiment analysis.
6. Zero fabricated comments or synthetic metrics.
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import httpx
from .base import PlatformAdapter, AnalysisPayload, CommentItem, CoverageReport
from backend.services import integrations_manager


class TwitterAdapter(PlatformAdapter):
    """Adapter for X (Twitter) posts, threads, and user-pasted comments."""

    STATUS_URL_REGEX = re.compile(
        r"(?:https?://)?(?:www\.)?(?:twitter\.com|x\.com)/([a-zA-Z0-9_]{1,20})/status/(\d+)",
        re.IGNORECASE
    )

    def can_handle(self, target: str) -> bool:
        if not target:
            return False
        if target.startswith("sample://x") or target.startswith("sample://twitter") or target == "demo_x":
            return True
        return bool(self.STATUS_URL_REGEX.search(target))

    def extract_post_info(self, url: str) -> Tuple[Optional[str], Optional[str]]:
        """Extracts (username, numeric_post_id) from an X or Twitter status link."""
        if not url:
            return None, None
        match = self.STATUS_URL_REGEX.search(url)
        if match:
            return match.group(1), match.group(2)
        return None, None

    def fetch_data(self, input_payload: Dict[str, Any]) -> AnalysisPayload:
        url = (input_payload.get("url") or "").strip()

        # Handle explicit demo mode
        if url.startswith("sample://x") or url.startswith("sample://twitter") or url == "demo_x" or input_payload.get("is_demo"):
            return self._build_sample_payload(url=url)

        username, post_id = self.extract_post_info(url)
        if not post_id:
            raise ValueError(
                "Invalid X (Twitter) URL. Please provide a valid post link in the format: "
                "https://x.com/username/status/1234567890123456789 or https://twitter.com/username/status/1234567890123456789"
            )

        # Standardize canonical URL
        canonical_url = f"https://x.com/{username or 'user'}/status/{post_id}"
        bearer_token = integrations_manager.get_secret("TWITTER_BEARER_TOKEN").strip()

        api_data = None
        api_notice = None
        api_status = None
        data_source = "official_x_oembed_preview"

        # 1. Attempt official X API v2 lookup if Bearer Token is configured
        if bearer_token and not bearer_token.startswith("your_"):
            try:
                api_data, api_status, api_notice = self._fetch_x_api_v2(post_id, bearer_token)
                if api_status == 200 and api_data:
                    data_source = "official_x_api"
            except Exception as e:
                api_notice = f"Could not reach X API v2 ({str(e)}). Falling back to official X oEmbed."
        else:
            api_notice = "X Bearer Token is not configured. Falling back to official public X oEmbed for post preview."

        # 2. If official API didn't return 200, use official public X oEmbed for post preview
        oembed_data = None
        if not api_data:
            oembed_data = self._fetch_x_oembed(canonical_url)

        # Build post metadata
        if api_data:
            author_handle = f"@{api_data.get('username', username or 'creator')}"
            author_name = api_data.get("name") or author_handle
            caption = api_data.get("text", "")
            title = f"Post by {author_handle}"
            view_count = api_data.get("views")
            like_count = api_data.get("likes", 0)
            comment_count = api_data.get("replies", 0)
            published_at = api_data.get("created_at")
            notice = "Retrieved live post metrics from official X API v2."
        elif oembed_data:
            author_name = oembed_data.get("author_name") or f"@{username}"
            author_handle = f"@{username}" if username else author_name
            caption = oembed_data.get("text", "")
            title = f"Post by {author_handle}"
            view_count = None  # Metrics unavailable via oEmbed
            like_count = None
            comment_count = None
            published_at = None
            notice = (
                f"{api_notice} "
                "Post preview loaded via official X oEmbed. Public oEmbed provides post text and author details only. "
                "To analyze audience sentiment, paste actual replies into the 'Pasted Comments' tab."
            )
        else:
            # Fallback if both failed
            author_handle = f"@{username}" if username else "X Creator"
            author_name = author_handle
            caption = ""
            title = f"Post on X ({post_id})"
            view_count = None
            like_count = None
            comment_count = None
            published_at = None
            notice = (
                f"{api_notice} "
                "Could not retrieve oEmbed preview from X servers. Please paste the post text or audience comments directly."
            )

        # 3. Parse user-supplied comments (if provided)
        custom_comments_raw = (input_payload.get("comments_text") or input_payload.get("raw_text") or "").strip()
        comments: List[CommentItem] = []

        if custom_comments_raw:
            for idx, line in enumerate(custom_comments_raw.splitlines()):
                clean_line = line.strip()
                # Ignore empty or separator lines
                if clean_line and not clean_line.startswith("---"):
                    comments.append(
                        CommentItem(
                            comment_id=f"x_user_{idx + 1}",
                            author=f"Audience #{idx + 1}",
                            text=clean_line,
                            like_count=0
                        )
                    )
            data_source = "pasted_comments"
            notice = f"Analyzed {len(comments)} actual audience comments supplied via manual input."
        else:
            # When no comments are provided, DO NOT fabricate comments
            comments = []

        coverage = CoverageReport(
            has_metadata=bool(caption or author_handle),
            has_caption=bool(caption),
            has_transcript=False,
            comments_fetched=len(comments),
            comments_available=comment_count or len(comments),
            notice=notice,
            source_type=data_source,
            is_sample_data=False
        )

        return AnalysisPayload(
            platform="twitter",
            post_url=canonical_url,
            title=title,
            author=author_handle,
            thumbnail_url=None,
            caption=caption or f"Post on X by {author_handle}",
            view_count=view_count or 0,
            like_count=like_count or 0,
            comment_count=len(comments),
            comments=comments,
            coverage=coverage
        )

    def _fetch_x_api_v2(self, post_id: str, bearer_token: str) -> Tuple[Optional[Dict[str, Any]], int, str]:
        """
        Calls official X API v2 /2/tweets/:id with structured status code handling.
        Never exposes the Bearer Token.
        """
        endpoint = f"https://api.x.com/2/tweets/{post_id}"
        params = {
            "tweet.fields": "public_metrics,created_at,text,author_id",
            "expansions": "author_id",
            "user.fields": "name,username,verified,profile_image_url"
        }
        headers = {
            "Authorization": f"Bearer {bearer_token}",
            "User-Agent": "CreatorPulse-AI/1.0"
        }

        with httpx.Client(timeout=8.0) as client:
            resp = client.get(endpoint, params=params, headers=headers)
            status = resp.status_code

            if status == 200:
                body = resp.json()
                tweet = body.get("data", {})
                includes = body.get("includes", {})
                users = includes.get("users", [])
                user = users[0] if users else {}

                metrics = tweet.get("public_metrics", {})
                return {
                    "id": tweet.get("id"),
                    "text": tweet.get("text", ""),
                    "created_at": tweet.get("created_at"),
                    "views": metrics.get("impression_count", 0),
                    "likes": metrics.get("like_count", 0),
                    "retweets": metrics.get("retweet_count", 0),
                    "replies": metrics.get("reply_count", 0),
                    "quotes": metrics.get("quote_count", 0),
                    "bookmarks": metrics.get("bookmark_count", 0),
                    "author_id": tweet.get("author_id"),
                    "username": user.get("username"),
                    "name": user.get("name")
                }, 200, "Official X API v2 returned live tweet metadata and metrics."

            elif status == 402:
                return None, 402, "Official X API v2 returned HTTP 402 (Payment Required: credits depleted)."
            elif status == 401:
                return None, 401, "Official X API v2 returned HTTP 401 (Unauthorized: Bearer Token invalid or expired)."
            elif status == 403:
                return None, 403, "Official X API v2 returned HTTP 403 (Forbidden: App lacks required access tier)."
            elif status == 429:
                return None, 429, "Official X API v2 returned HTTP 429 (Too Many Requests: Rate limit reached)."
            else:
                return None, status, f"Official X API v2 returned unexpected status HTTP {status}."

    def _fetch_x_oembed(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Fetches public preview HTML and author information from official X publish oEmbed service.
        Zero auth required, public, free.
        """
        oembed_url = "https://publish.twitter.com/oembed"
        params = {"url": url, "omit_script": "true"}

        try:
            with httpx.Client(timeout=6.0) as client:
                resp = client.get(oembed_url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_html = data.get("html", "")
                    # Clean HTML tags to extract raw tweet text
                    clean_text = re.sub(r"<[^>]+>", " ", raw_html)
                    caption = " ".join(clean_text.split())
                    return {
                        "author_name": data.get("author_name"),
                        "author_url": data.get("author_url"),
                        "text": caption
                    }
        except Exception:
            pass
        return None

    def _build_sample_payload(self, url: str) -> AnalysisPayload:
        sample_comments = [
            CommentItem(comment_id="x_s_1", author="@dev_alex", text="The pacing insight in tweet #3 is golden! Bookmarking this thread.", like_count=45),
            CommentItem(comment_id="x_s_2", author="@growth_marketer", text="Are you seeing higher reach on text-only posts vs image attachments currently?", like_count=18),
            CommentItem(comment_id="x_s_3", author="@saas_founder", text="100% agree. Retention curves drop drastically if the hook is longer than 15 words.", like_count=62),
            CommentItem(comment_id="x_s_4", author="@crypto_spammer", text="Check bio for 100x gains telegram signals guaranteed", like_count=0),
            CommentItem(comment_id="x_s_5", author="@ux_designer", text="Clean breakdown. Would love a part 2 on thumbnail contrast.", like_count=29)
        ]
        coverage = CoverageReport(
            has_metadata=True,
            has_caption=True,
            has_transcript=False,
            comments_fetched=len(sample_comments),
            comments_available=len(sample_comments),
            notice="Operating in sample demo mode for X.",
            source_type="sample_data",
            is_sample_data=True
        )
        return AnalysisPayload(
            platform="twitter",
            post_url=url,
            title="Post by @creative_pulse",
            author="@creative_pulse",
            thumbnail_url=None,
            caption="5 Creative Pacing Rules That Increased Our Audience Retention by 42%. A quick breakdown for 2026 creators.",
            view_count=14200,
            like_count=890,
            comment_count=len(sample_comments),
            comments=sample_comments,
            coverage=coverage
        )
