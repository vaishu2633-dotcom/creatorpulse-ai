"""
Feature 8: VibeCheck AI End-to-End Tests
----------------------------------------
Validates:
1. Valid video analysis with real/mocked YouTube Data API response.
2. Private or removed video error handling (never faking sample data).
3. YouTube API quota error handling (clean error message).
4. Invalid YouTube URL rejection (clean error message).
5. User-pasted comments fallback analysis (sentiment, distribution, questions, spam detection).
6. Traditional ML model metadata reporting.
"""

import pytest
from unittest.mock import patch, MagicMock

from backend.services.vibecheck.youtube_adapter import YouTubeAdapter
from backend.services.vibecheck.analysis import VibeAnalyzer
from backend.routers.vibecheck import analyze_content, AnalyzeRequest
from fastapi import HTTPException


def test_invalid_youtube_url():
    """Verify that an invalid YouTube URL returns a clear error and never fakes sample data."""
    with pytest.raises(HTTPException) as exc:
        analyze_content(AnalyzeRequest(
            target="https://www.youtube.com/not-a-valid-video-link",
            input_type="url"
        ))
    assert exc.value.status_code == 400
    assert "Invalid URL" in exc.value.detail or "Invalid YouTube URL" in exc.value.detail


def test_private_video_error():
    """Verify private or missing video raises a clean error instead of returning sample data."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"items": []}

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
        res = analysis["vibecheck_results"]
        assert res["has_prediction"] is True
        assert res["overall_vibe"] in ["Positive", "Neutral", "Negative"]
        assert len(analysis["comments"]) == 2


def test_pasted_comments_analysis():
    """Verify analysis of user-supplied pasted comments via API."""
    raw_comments = (
        "Sarah: Fantastic video, learned so much in just 10 minutes!\n"
        "Dave: Why did the second demo fail? Can you provide GitHub repo?\n"
        "PromoBot: Join our crypto signals telegram for guaranteed 100x return!"
    )
    data = analyze_content(AnalyzeRequest(
        raw_text=raw_comments,
        input_type="pasted_comments",
        title="Local Microservices Setup",
        save_to_history=True
    ))
    assert data["metadata"]["title"] == "Local Microservices Setup"
    assert len(data["comments"]) == 3
    results = data["vibecheck_results"]
    assert results["has_prediction"] is True
    assert results["analysis_information"]["selected_ml_model"] in [
        "Multinomial Naive Bayes", "Logistic Regression", "Linear SVM"
    ]
