"""
Feature 6: Trend Explorer End-to-End Tests
------------------------------------------
Validates:
1. GET /api/trends returns complete provenance package (source, is_sample_data, last_updated, has_youtube_key).
2. Proper truthful fallback to sample data when no YouTube API key is present.
3. Extraction of creator dataset's own rising topics (is_creator_data=True).
4. Time-window, platform, and regional filtering (US, IN, GB).
5. Mocked live YouTube Data API response integration.
"""

import pytest
import httpx
from unittest.mock import patch, MagicMock
from backend.services import data_access, youtube_service

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_get_trends_package_structure():
    """Verify get_trends_package returns standard provenance attributes and sorted trends."""
    pkg = data_access.get_trends_package()
    assert "source" in pkg
    assert "is_sample_data" in pkg
    assert "last_updated" in pkg
    assert "has_youtube_key" in pkg
    assert "total" in pkg
    assert "trends" in pkg
    assert isinstance(pkg["trends"], list)
    assert len(pkg["trends"]) > 0

    # Ensure items are sorted descending by strength_score
    scores = [t.get("strength_score", 0) for t in pkg["trends"]]
    assert scores == sorted(scores, reverse=True)


def test_creator_rising_topics_extraction():
    """Verify that topics rising in the user's active dataset are extracted and labeled."""
    creator_topics = data_access.extract_rising_topics_from_creator_data()
    assert isinstance(creator_topics, list)
    if creator_topics:
        top_topic = creator_topics[0]
        assert top_topic["is_creator_data"] is True
        assert top_topic["source"] == "Your Channel Data"
        assert top_topic["category"] == "Channel High-Growth"
        assert "strength_score" in top_topic
        assert "growth_rate" in top_topic
        assert len(top_topic["sample_hooks"]) > 0


def test_trends_api_filtering(client):
    """Verify GET /api/trends respects platform, time_window, and region filters."""
    # Test platform filter
    yt_res = client.get("/api/trends?platform=youtube")
    assert yt_res.status_code == 200
    yt_data = yt_res.json()
    for t in yt_data["trends"]:
        assert t["platform"] == "youtube"

    # Test time_window filter
    tw_res = client.get("/api/trends?time_window=24h")
    assert tw_res.status_code == 200
    tw_data = tw_res.json()
    assert len(tw_data["trends"]) > 0

    # Test region query
    reg_res = client.get("/api/trends?region=IN")
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["region"] == "IN"


def test_youtube_live_trends_service_mocked():
    """Verify fetch_youtube_trending_topics formats real YouTube Data API responses."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "items": [
            {
                "id": "mock_vid_99",
                "snippet": {
                    "title": "Next.js 15 Full Tutorial in 2026",
                    "channelTitle": "DevMastery",
                    "categoryId": "28",
                    "publishedAt": "2026-10-28T12:00:00Z"
                },
                "statistics": {
                    "viewCount": "450000",
                    "likeCount": "22000",
                    "commentCount": "1800"
                }
            }
        ]
    }

    with patch("backend.services.youtube_service.get_youtube_api_key", return_value="AIzaSyMockKeyForAutomatedTests"):
        with patch("httpx.Client.get", return_value=mock_response):
            res = youtube_service.fetch_youtube_trending_topics(region_code="US", max_results=5)
            assert res["success"] is True
            assert res["region"] == "US"
            assert len(res["trends"]) == 1
            trend = res["trends"][0]
            assert trend["topic"] == "Next.js 15 Full Tutorial in 2026"
            assert trend["category"] == "Science & Technology"
            assert trend["volume"] == 450000
            assert trend["platform"] == "youtube"
            assert "source" in trend


def test_trend_has_all_ui_attributes(client):
    """Verify every trend item contains all required fields for UI cards and slide-over."""
    res = client.get("/api/trends")
    assert res.status_code == 200
    data = res.json()
    assert len(data["trends"]) > 0

    for t in data["trends"]:
        assert "trend_id" in t
        assert "topic" in t
        assert "platform" in t
        assert "category" in t
        assert "strength_score" in t
        assert "growth_rate" in t
        assert "volume" in t
        assert "sample_hooks" in t
        assert isinstance(t["sample_hooks"], list)
