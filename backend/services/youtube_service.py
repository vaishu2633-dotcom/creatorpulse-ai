"""
CreatorPulse AI - YouTube Platform Service
-------------------------------------------
Official YouTube Data API v3 client for channel video ingestion,
metadata extraction, duration parsing, and quota management.

Strict adherence to rules:
- Uses official YouTube Data API endpoints exclusively (zero scraping)
- Transparent quota and credential checks
- Handles handles (@handle), channel URLs, and channel IDs
"""

import os
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import httpx

def get_youtube_api_key() -> str:
    """Retrieves YOUTUBE_API_KEY from environment or backend/.env."""
    key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not key:
        # Check backend/.env explicitly if not loaded in os.environ
        env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("YOUTUBE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val and not val.startswith("your_"):
                            key = val
                            break
    return key

def check_youtube_api_status() -> Dict[str, Any]:
    """Returns whether the YouTube Data API key is configured."""
    key = get_youtube_api_key()
    configured = bool(key and not key.startswith("your_"))
    return {
        "configured": configured,
        "masked_key": f"{key[:4]}...{key[-4:]}" if (configured and len(key) > 8) else None,
        "message": "YouTube Data API key is ready." if configured else "YouTube Data API key is not configured in .env. Please set YOUTUBE_API_KEY to import live YouTube channel data."
    }

def parse_iso8601_duration(duration_str: str) -> int:
    """Parses ISO 8601 duration (e.g. PT1H15M33S) into total seconds."""
    if not duration_str:
        return 0
    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    match = re.match(pattern, duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

def format_duration(seconds: int) -> str:
    """Formats seconds into readable mm:ss or hh:mm:ss string."""
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

def extract_channel_query(channel_input: str) -> Dict[str, str]:
    """
    Extracts query parameter from user input:
    - @handle -> {'forHandle': '@handle'}
    - https://www.youtube.com/@handle -> {'forHandle': '@handle'}
    - https://www.youtube.com/channel/UC... -> {'id': 'UC...'}
    - UC... -> {'id': 'UC...'}
    """
    cleaned = channel_input.strip()
    
    # Check for full URL with @handle
    handle_match = re.search(r"youtube\.com/@([a-zA-Z0-9_\-\.]+)", cleaned)
    if handle_match:
        return {"forHandle": f"@{handle_match.group(1)}"}
        
    # Check for full URL with channel ID
    channel_id_match = re.search(r"youtube\.com/channel/(UC[a-zA-Z0-9_\-]{22})", cleaned)
    if channel_id_match:
        return {"id": channel_id_match.group(1)}

    # Check for standalone handle
    if cleaned.startswith("@"):
        return {"forHandle": cleaned}
        
    # Check for standalone channel ID
    if cleaned.startswith("UC") and len(cleaned) == 24:
        return {"id": cleaned}
        
    # If it's a plain word, try handle first
    if not cleaned.startswith("http"):
        return {"forHandle": f"@{cleaned}" if not cleaned.startswith("@") else cleaned}

    return {"forHandle": cleaned}

def fetch_youtube_channel_data(channel_input: str, max_videos: int = 50) -> Dict[str, Any]:
    """
    Connects to YouTube Data API v3, resolves channel details and uploads playlist,
    then fetches up to `max_videos` videos with statistics and durations.
    """
    api_key = get_youtube_api_key()
    if not api_key or api_key.startswith("your_"):
        return {
            "success": False,
            "error_type": "missing_key",
            "error": "YouTube Data API key is not configured. Add YOUTUBE_API_KEY to your .env file to import live YouTube channel data."
        }

    query_params = extract_channel_query(channel_input)
    
    try:
        with httpx.Client(timeout=12.0) as client:
            # 1. Fetch channel profile and uploads playlist
            channel_params = {
                "part": "snippet,contentDetails,statistics",
                "key": api_key,
                **query_params
            }
            resp = client.get("https://www.googleapis.com/youtube/v3/channels", params=channel_params)
            
            if resp.status_code == 403:
                err_data = resp.json().get("error", {})
                reasons = [e.get("reason") for e in err_data.get("errors", [])]
                if "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
                    return {
                        "success": False,
                        "error_type": "quota_exceeded",
                        "error": "YouTube API daily quota (10,000 units) exceeded. Please try again tomorrow or upload your YouTube Studio CSV export."
                    }
                return {
                    "success": False,
                    "error_type": "permission_denied",
                    "error": f"YouTube API error: {err_data.get('message', 'Access denied.')}"
                }
                
            if resp.status_code != 200:
                return {
                    "success": False,
                    "error_type": "api_error",
                    "error": f"YouTube API returned HTTP {resp.status_code}."
                }
                
            channel_json = resp.json()
            items = channel_json.get("items", [])
            if not items:
                # If forHandle failed, try forUsername as fallback
                if "forHandle" in query_params:
                    alt_name = query_params["forHandle"].lstrip("@")
                    alt_resp = client.get(
                        "https://www.googleapis.com/youtube/v3/channels",
                        params={"part": "snippet,contentDetails,statistics", "forUsername": alt_name, "key": api_key}
                    )
                    if alt_resp.status_code == 200 and alt_resp.json().get("items"):
                        items = alt_resp.json().get("items", [])
                
                if not items:
                    return {
                        "success": False,
                        "error_type": "not_found",
                        "error": f"No YouTube channel found matching '{channel_input}'. Please check the channel URL or handle."
                    }

            ch_item = items[0]
            snippet = ch_item.get("snippet", {})
            stats = ch_item.get("statistics", {})
            content_details = ch_item.get("contentDetails", {})
            
            uploads_playlist_id = content_details.get("relatedPlaylists", {}).get("uploads")
            if not uploads_playlist_id:
                return {
                    "success": False,
                    "error_type": "no_uploads",
                    "error": "No uploads playlist found for this channel."
                }

            channel_info = {
                "channel_id": ch_item.get("id"),
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "custom_url": snippet.get("customUrl", ""),
                "thumbnail_url": snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                "subscriber_count": int(stats.get("subscriberCount", 0)),
                "video_count": int(stats.get("videoCount", 0)),
                "view_count": int(stats.get("viewCount", 0)),
                "uploads_playlist_id": uploads_playlist_id
            }

            # 2. Fetch recent videos from uploads playlist
            pl_resp = client.get(
                "https://www.googleapis.com/youtube/v3/playlistItems",
                params={
                    "part": "snippet,contentDetails",
                    "playlistId": uploads_playlist_id,
                    "maxResults": min(max_videos, 50),
                    "key": api_key
                }
            )
            
            if pl_resp.status_code != 200:
                return {
                    "success": False,
                    "error_type": "playlist_error",
                    "error": f"Could not fetch playlist items (HTTP {pl_resp.status_code})."
                }
                
            pl_json = pl_resp.json()
            pl_items = pl_json.get("items", [])
            video_ids = [
                it.get("contentDetails", {}).get("videoId") 
                for it in pl_items 
                if it.get("contentDetails", {}).get("videoId")
            ]
            
            if not video_ids:
                return {
                    "success": True,
                    "channel": channel_info,
                    "videos": [],
                    "count": 0,
                    "message": "Connected successfully, but channel has no public videos."
                }

            # 3. Batch fetch video details & metrics
            v_resp = client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "snippet,contentDetails,statistics",
                    "id": ",".join(video_ids),
                    "key": api_key
                }
            )
            
            if v_resp.status_code != 200:
                return {
                    "success": False,
                    "error_type": "videos_error",
                    "error": f"Could not fetch video statistics (HTTP {v_resp.status_code})."
                }

            v_json = v_resp.json()
            videos = []
            
            for v_item in v_json.get("items", []):
                v_id = v_item.get("id")
                v_snip = v_item.get("snippet", {})
                v_stats = v_item.get("statistics", {})
                v_cd = v_item.get("contentDetails", {})
                
                duration_iso = v_cd.get("duration", "")
                duration_sec = parse_iso8601_duration(duration_iso)
                
                # In YouTube terminology, videos <= 60 seconds are shorts
                post_type = "short" if (0 < duration_sec <= 60) else "long_video"
                
                views = int(v_stats.get("viewCount", 0))
                likes = int(v_stats.get("likeCount", 0))
                comments = int(v_stats.get("commentCount", 0))
                shares = 0
                
                total_eng = likes + comments + shares
                er = round(total_eng / max(1, views), 4)
                
                # Check breakout status against 6% baseline
                is_breakout = er >= 0.06 or (views >= 10000 and total_eng >= 600)
                
                thumb = (
                    v_snip.get("thumbnails", {}).get("medium", {}).get("url")
                    or v_snip.get("thumbnails", {}).get("default", {}).get("url")
                    or ""
                )
                
                videos.append({
                    "post_id": f"yt_{v_id}",
                    "external_id": v_id,
                    "platform": "youtube",
                    "post_type": post_type,
                    "caption": v_snip.get("title", "Untitled Video"),
                    "description": v_snip.get("description", "")[:400],
                    "published_at": v_snip.get("publishedAt", datetime.now(timezone.utc).isoformat()),
                    "views": views,
                    "likes": likes,
                    "comments": comments,
                    "shares": shares,
                    "impressions": views,
                    "engagement_rate": er,
                    "is_breakout": is_breakout,
                    "duration_seconds": duration_sec,
                    "duration_formatted": format_duration(duration_sec),
                    "thumbnail_url": thumb,
                    "source": "youtube_api"
                })

            return {
                "success": True,
                "channel": channel_info,
                "videos": videos,
                "count": len(videos),
                "message": f"Successfully imported {len(videos)} videos from '{channel_info['title']}'."
            }

    except httpx.RequestError as exc:
        return {
            "success": False,
            "error_type": "network_error",
            "error": f"Network error connecting to YouTube API: {str(exc)}"
        }
    except Exception as exc:
        return {
            "success": False,
            "error_type": "unknown_error",
            "error": f"An unexpected error occurred: {str(exc)}"
        }


YOUTUBE_CATEGORIES = {
    "1": "Film & Animation",
    "2": "Autos & Vehicles",
    "10": "Music",
    "15": "Pets & Animals",
    "17": "Sports",
    "20": "Gaming",
    "22": "People & Blogs",
    "23": "Comedy",
    "24": "Entertainment",
    "25": "News & Politics",
    "26": "Howto & Style",
    "27": "Education",
    "28": "Science & Technology"
}

def fetch_youtube_trending_topics(region_code: str = "US", max_results: int = 15) -> Dict[str, Any]:
    """
    Fetches real trending videos for a specified region from YouTube Data API v3.
    Extracts high-velocity topics, view counts, and engagement strength.
    """
    api_key = get_youtube_api_key()
    if not api_key or api_key.startswith("your_"):
        return {
            "success": False,
            "error_type": "missing_key",
            "error": "YouTube Data API key is not configured in .env."
        }

    valid_region = region_code.upper() if region_code and len(region_code) == 2 else "US"

    try:
        with httpx.Client(timeout=12.0) as client:
            resp = client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "snippet,statistics",
                    "chart": "mostPopular",
                    "regionCode": valid_region,
                    "maxResults": min(max_results, 50),
                    "key": api_key
                }
            )

            if resp.status_code == 403:
                err_data = resp.json().get("error", {})
                reasons = [e.get("reason") for e in err_data.get("errors", [])]
                if "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
                    return {
                        "success": False,
                        "error_type": "quota_exceeded",
                        "error": "YouTube API daily quota exceeded."
                    }
                return {
                    "success": False,
                    "error_type": "permission_denied",
                    "error": f"YouTube API access denied: {err_data.get('message', '')}"
                }

            if resp.status_code != 200:
                return {
                    "success": False,
                    "error_type": "api_error",
                    "error": f"YouTube API returned HTTP {resp.status_code}"
                }

            data = resp.json()
            items = data.get("items", [])
            trends = []

            for idx, item in enumerate(items):
                snip = item.get("snippet", {})
                stats = item.get("statistics", {})
                title = snip.get("title", "")
                views = int(stats.get("viewCount", 0))
                likes = int(stats.get("likeCount", 0))
                comments = int(stats.get("commentCount", 0))
                cat_id = str(snip.get("categoryId", "28"))
                category = YOUTUBE_CATEGORIES.get(cat_id, "Trending")

                er = round(((likes + comments) / views * 100), 2) if views > 0 else 3.5
                strength = min(99, max(60, int(75 + (views / 1_500_000) * 5 + er * 2)))
                growth_rate = f"+{min(240, max(25, int(er * 18)))}%"

                trends.append({
                    "trend_id": f"yt_live_{item.get('id', idx)}",
                    "platform": "youtube",
                    "topic": title,
                    "category": category,
                    "time_window": "24h",
                    "volume": views,
                    "growth_rate": growth_rate,
                    "strength_score": strength,
                    "sentiment": "bullish" if er > 4.0 else "neutral",
                    "region": valid_region,
                    "source": f"YouTube Data API ({valid_region})",
                    "is_creator_data": False,
                    "channel_title": snip.get("channelTitle", ""),
                    "published_at": snip.get("publishedAt", ""),
                    "sample_hooks": [
                        f"Why '{title[:55]}' is exploding in reach right now",
                        f"The storytelling hook behind {snip.get('channelTitle', 'this video')}'s momentum"
                    ]
                })

            return {
                "success": True,
                "region": valid_region,
                "count": len(trends),
                "trends": trends
            }
    except Exception as exc:
        return {
            "success": False,
            "error_type": "exception",
            "error": str(exc)
        }

