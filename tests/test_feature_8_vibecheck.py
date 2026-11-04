"""
Feature 8: VibeCheck AI End-to-End Tests
----------------------------------------
Validates:
1. Valid video analysis with real/mocked YouTube Data API response.
2. Private or removed video error handling (never faking sample data).
3. YouTube API quota error handling (clean error message with fallback recommendation).
4. Invalid YouTube URL rejection (clean error message).
5. User-pasted comments fallback analysis (sentiment, 8 vibes, questions, spam detection).
6. Multilingual sentiment model metadata reporting (VADER fallback with English notice).
7. Report persistence, history retrieval, and deletion.
"""

import pytest
import httpx
from unittest.mock import patch, MagicMock
from backend.services.vibecheck.youtube_adapter import YouTubeAdapter
from backend.services.vibecheck.analysis import VibeAnalyzer
from backend.services.vibecheck.base import AnalysisPayload, CommentItem, CoverageReport

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_invalid_youtube_url(client):
    """Verify that an invalid YouTube URL returns a clear error and never fakes sample data."""
    res = client.post("/api/vibecheck/analyze", json={
        "target": "https://www.youtube.com/not-a-valid-video-link",
        "input_type": "url"
    })
    assert res.status_code == 400
    assert "Invalid YouTube URL" in res.json().get("detail", "")


def test_private_video_error():
    """Verify private or missing video raises a clean error instead of returning sample data."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"items": []}  # empty items indicates video not found or private

    adapter = YouTubeAdapter(api_key="AIzaSyMockKeyForAutomatedTests")
    with patch("httpx.Client.get", return_value=mock_resp):
        with pytest.raises(ValueError, match="private"):
            adapter.fetch_data({"url": "https://www.youtube.com/watch?v=12345678901"})


def test_quota_error():
    """Verify quota exceeded returns an honest error rather than sample data."""
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_resp.json.return_value = {
        "error": {
            "errors": [{"reason": "quotaExceeded"}],
            "message": "The request cannot be completed because you have exceeded your quota."
        }
    }

    adapter = YouTubeAdapter(api_key="AIzaSyMockKeyForAutomatedTests")
    with patch("httpx.Client.get", return_value=mock_resp):
        with pytest.raises(ValueError, match="quota"):
            adapter.fetch_data({"url": "https://www.youtube.com/watch?v=12345678901"})


def test_valid_youtube_adapter_mocked():
    """Verify YouTube adapter fetches metadata, comments, and parses payload cleanly."""
    mock_video_resp = MagicMock()
    mock_video_resp.status_code = 200
    mock_video_resp.json.return_value = {
        "items": [
            {
                "id": "abc123xyz89",
                "snippet": {
                    "title": "High Scale System Architecture in 2026",
                    "channelTitle": "EngineeringExcellence",
                    "publishedAt": "2026-10-25T10:00:00Z",
                    "description": "Comprehensive tutorial on distributed systems and microservices.",
                    "thumbnails": {"high": {"url": "https://img.youtube.com/vi/abc123xyz89/hqdefault.jpg"}}
                },
                "statistics": {
                    "viewCount": "125000",
                    "likeCount": "8400",
                    "commentCount": "2"
                }
            }
        ]
    }

    mock_comments_resp = MagicMock()
    mock_comments_resp.status_code = 200
    mock_comments_resp.json.return_value = {
        "items": [
            {
                "id": "c1",
                "snippet": {
                    "topLevelComment": {
                        "snippet": {
                            "authorDisplayName": "Alice Dev",
                            "textDisplay": "This breakdown of event-driven architecture was brilliant and so clear!",
                            "likeCount": 45,
                            "publishedAt": "2026-10-25T11:00:00Z"
                        }
                    }
                }
            },
            {
                "id": "c2",
                "snippet": {
                    "topLevelComment": {
                        "snippet": {
                            "authorDisplayName": "Bob Tech",
                            "textDisplay": "Can you explain how to handle distributed transactions without 2PC?",
                            "likeCount": 12,
                            "publishedAt": "2026-10-25T12:00:00Z"
                        }
                    }
                }
            }
        ]
    }

    def mock_get(url, **kwargs):
        if "commentThreads" in url:
            return mock_comments_resp
        return mock_video_resp

    adapter = YouTubeAdapter(api_key="AIzaSyMockKeyForAutomatedTests")
    with patch("httpx.Client.get", side_effect=mock_get):
        payload = adapter.fetch_data({"url": "https://www.youtube.com/watch?v=abc123xyz89"})
        assert payload.title == "High Scale System Architecture in 2026"
        assert payload.view_count == 125000
        assert payload.like_count == 8400
        assert len(payload.comments) == 2

        # Run pipeline
        analysis = VibeAnalyzer.analyze(payload)
        assert analysis["sentiment"]["vibe_score"] > 60
        assert analysis["sentiment"]["model_used"] in ["VADER (Rule-based)", "XLM-RoBERTa (Multilingual)"]
        assert len(analysis["comments"]) == 2


def test_pasted_comments_analysis(client):
    """Verify analysis of user-supplied pasted comments via API."""
    raw_comments = (
        "Sarah: Fantastic video, learned so much in just 10 minutes!\n"
        "Dave: Why did the second demo fail? Can you provide GitHub repo?\n"
        "PromoBot: Join our crypto signals telegram for guaranteed 100x return!"
    )
    res = client.post("/api/vibecheck/analyze", json={
        "raw_text": raw_comments,
        "input_type": "pasted_comments",
        "title": "Local Microservices Setup",
        "save_to_history": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["metadata"]["title"] == "Local Microservices Setup"
    assert data["engagement"]["total_comments"] >= 3
    assert data["sentiment"]["model_used"] in ["VADER (Rule-based)", "XLM-RoBERTa (Multilingual)"]
    if data["sentiment"]["model_used"] == "VADER (Rule-based)":
        assert "Sentiment works best for English comments" in data["sentiment"]["model_notice"]

    # Verify report was saved to history
    report_id = data.get("report_id")
    assert report_id is not None

    # Retrieve history
    hist_res = client.get("/api/vibecheck/history")
    assert hist_res.status_code == 200
    report_ids = [r["report_id"] for r in hist_res.json()["reports"]]
    assert report_id in report_ids

    # Delete report
    del_res = client.delete(f"/api/vibecheck/history/{report_id}")
    assert del_res.status_code == 200
