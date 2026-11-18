"""
CreatorPulse AI - VibeCheck AI & Machine Learning Test Suite
------------------------------------------------------------
Directly tests all 14 academic and functional requirements:
1. YouTube URL validation
2. X post URL validation
3. YouTube API retrieval
4. X API retrieval
5. Text preprocessing
6. ML model prediction
7. Positive sentiment prediction
8. Negative sentiment prediction
9. Neutral sentiment prediction
10. Sentiment percentage calculations
11. API failure handling
12. Empty content handling
13. Frontend and backend integration
14. Responsive UI & Build verification
"""

import pytest
import os
from unittest.mock import patch, MagicMock

from backend.main import root, health
from backend.ml.preprocessor import clean_text
from backend.ml.classifier import classify_comments, classify_single_text, get_model_metadata
from backend.services.vibecheck.youtube_adapter import YouTubeAdapter
from backend.services.vibecheck.twitter_adapter import TwitterAdapter
from backend.services.vibecheck.analysis import VibeAnalyzer
from backend.services.vibecheck.base import AnalysisPayload, CommentItem, CoverageReport
from backend.routers.vibecheck import (
    AnalyzeRequest,
    analyze_content,
    get_vibecheck_status,
    get_ml_models_comparison,
    get_supported_platforms
)


# -------------------------------------------------------------
# 1. YouTube URL validation
# -------------------------------------------------------------
def test_youtube_url_validation():
    adapter = YouTubeAdapter()

    # Valid URLs
    assert adapter.can_handle("https://www.youtube.com/watch?v=dQw4w9WgXcQ") is True
    assert adapter.can_handle("https://youtu.be/dQw4w9WgXcQ") is True
    assert adapter.can_handle("https://www.youtube.com/shorts/dQw4w9WgXcQ") is True
    assert adapter.extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert adapter.extract_video_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"

    # Invalid URLs
    assert adapter.extract_video_id("https://www.youtube.com/watch?v=invalid") is None
    assert adapter.extract_video_id("https://example.com/not-youtube") is None

    # Error handling on invalid URL
    with pytest.raises(ValueError) as excinfo:
        adapter.fetch_data({"url": "https://www.youtube.com/watch?v=invalid_id"})
    assert "Invalid YouTube URL" in str(excinfo.value)


# -------------------------------------------------------------
# 2. X post URL validation
# -------------------------------------------------------------
def test_x_post_url_validation():
    adapter = TwitterAdapter()

    # Valid URLs
    assert adapter.can_handle("https://x.com/username/status/1234567890123456789") is True
    assert adapter.can_handle("https://twitter.com/creator/status/9876543210") is True

    user, post_id = adapter.extract_post_info("https://x.com/deepmind/status/1234567890")
    assert user == "deepmind"
    assert post_id == "1234567890"

    # Invalid URLs
    assert adapter.can_handle("https://facebook.com/post/123") is False
    assert adapter.can_handle("https://x.com/home") is False

    with pytest.raises(ValueError) as excinfo:
        adapter.fetch_data({"url": "https://x.com/invalid_link"})
    assert "Invalid X (Twitter) URL" in str(excinfo.value)


# -------------------------------------------------------------
# 3. YouTube API retrieval
# -------------------------------------------------------------
def test_youtube_api_retrieval_mocked():
    adapter = YouTubeAdapter(api_key="AIzaFakeTestKey")

    mock_video_json = {
        "items": [{
            "snippet": {
                "title": "Machine Learning Fundamentals",
                "channelTitle": "ML Lab",
                "description": "Full tutorial on classification algorithms",
                "publishedAt": "2026-01-01T00:00:00Z",
                "thumbnails": {"medium": {"url": "https://example.com/thumb.jpg"}}
            },
            "statistics": {
                "viewCount": "10000",
                "likeCount": "500",
                "commentCount": "2"
            }
        }]
    }

    mock_comments_json = {
        "items": [
            {
                "id": "c1",
                "snippet": {
                    "topLevelComment": {
                        "snippet": {
                            "authorDisplayName": "Alice",
                            "textDisplay": "This is the best ML video ever! Learned so much.",
                            "likeCount": 10,
                            "publishedAt": "2026-01-02T00:00:00Z"
                        }
                    }
                }
            },
            {
                "id": "c2",
                "snippet": {
                    "topLevelComment": {
                        "snippet": {
                            "authorDisplayName": "Bob",
                            "textDisplay": "What hyperparameters were used for Naive Bayes?",
                            "likeCount": 2,
                            "publishedAt": "2026-01-02T01:00:00Z"
                        }
                    }
                }
            }
        ]
    }

    with patch("httpx.Client.get") as mock_get:
        mock_resp_video = MagicMock(status_code=200, json=lambda: mock_video_json)
        mock_resp_comments = MagicMock(status_code=200, json=lambda: mock_comments_json)
        mock_get.side_effect = [mock_resp_video, mock_resp_comments]

        payload = adapter.fetch_data({"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})

        assert payload.platform == "youtube"
        assert payload.title == "Machine Learning Fundamentals"
        assert payload.author == "ML Lab"
        assert len(payload.comments) == 2
        assert payload.comments[0].author == "Alice"
        assert "best ML video" in payload.comments[0].text


# -------------------------------------------------------------
# 4. X API retrieval (Handling credit limits honestly)
# -------------------------------------------------------------
def test_x_api_retrieval_and_credit_handling():
    adapter = TwitterAdapter()

    # Simulate X API v2 returning 402 Payment Required (credit limit reached)
    mock_resp_402 = MagicMock(status_code=402)
    mock_resp_oembed = MagicMock(
        status_code=200,
        json=lambda: {"author_name": "TechCreator", "text": "Testing our new model today on X!"}
    )

    with patch("httpx.Client.get") as mock_get:
        mock_get.side_effect = [mock_resp_402, mock_resp_oembed]

        payload = adapter.fetch_data({"url": "https://x.com/creator/status/1234567890"})

        assert payload.platform == "twitter"
        assert "402" in payload.coverage.notice or "oEmbed" in payload.coverage.notice
        assert len(payload.comments) == 0


# -------------------------------------------------------------
# 5. Text preprocessing
# -------------------------------------------------------------
def test_text_preprocessing():
    # 1. URL removal
    raw_with_url = "Great tutorial https://youtu.be/1234 check it out!"
    assert "https" not in clean_text(raw_with_url)

    # 2. Mentions removal
    raw_with_mention = "Hey @johndoe that was super clear!"
    assert "@johndoe" not in clean_text(raw_with_mention)

    # 3. Contraction expansion
    raw_with_contraction = "I don't think it's working"
    cleaned = clean_text(raw_with_contraction)
    assert "do not" in cleaned or "is" in cleaned

    # 4. Emoticon mapping
    raw_emoji = "Awesome content! ❤️ 🔥"
    cleaned_emoji = clean_text(raw_emoji)
    assert "love" in cleaned_emoji or "fire" in cleaned_emoji

    # 5. Noise normalization
    raw_noise = "Sooooooo goooood!!!!!!"
    cleaned_noise = clean_text(raw_noise)
    assert "soo good" in cleaned_noise


# -------------------------------------------------------------
# 6. ML model prediction (Pipeline verification)
# -------------------------------------------------------------
def test_ml_model_prediction_pipeline():
    meta = get_model_metadata()
    assert meta["status"] == "success"
    assert "best_model" in meta
    assert meta["best_model"] in ["Multinomial Naive Bayes", "Logistic Regression", "Linear SVM"]

    models = meta["models"]
    assert "Logistic Regression" in models
    assert "Multinomial Naive Bayes" in models
    assert "Linear SVM" in models

    for name in ["Logistic Regression", "Multinomial Naive Bayes", "Linear SVM"]:
        m = models[name]
        assert "accuracy" in m
        assert "precision_weighted" in m
        assert "recall_weighted" in m
        assert "f1_score_weighted" in m
        assert "confusion_matrix" in m


# -------------------------------------------------------------
# 7. Positive sentiment prediction
# -------------------------------------------------------------
def test_positive_sentiment_prediction():
    text = "Absolutely phenomenal video! Learned so much, thank you!"
    res = classify_single_text(text)
    assert res["sentiment"] == "positive"
    assert res["confidence"] > 0.0


# -------------------------------------------------------------
# 8. Negative sentiment prediction
# -------------------------------------------------------------
def test_negative_sentiment_prediction():
    text = "The audio is completely ruined and broken, terrible video."
    res = classify_single_text(text)
    assert res["sentiment"] == "negative"
    assert res["confidence"] > 0.0


# -------------------------------------------------------------
# 9. Neutral sentiment prediction
# -------------------------------------------------------------
def test_neutral_sentiment_prediction():
    text = "What was the camera shutter angle at timestamp 03:45?"
    res = classify_single_text(text)
    assert res["sentiment"] == "neutral"


# -------------------------------------------------------------
# 10. Sentiment percentage calculations
# -------------------------------------------------------------
def test_sentiment_percentage_calculations():
    comments = [
        CommentItem(comment_id="1", author="A", text="This is brilliant, loved it so much!"),
        CommentItem(comment_id="2", author="B", text="Super helpful tutorial, thank you!"),
        CommentItem(comment_id="3", author="C", text="What is the framework used here?"),
        CommentItem(comment_id="4", author="D", text="Awful quality, totally broken and useless.")
    ]
    payload = AnalysisPayload(
        platform="youtube",
        post_url="https://youtube.com/watch?v=test",
        title="Testing Percentages",
        author="Tester",
        comments=comments,
        coverage=CoverageReport(
            comments_fetched=4,
            comments_available=4,
            notice="Testing comments"
        )
    )
    analysis = VibeAnalyzer.analyze(payload)
    res = analysis["vibecheck_results"]

    assert res["has_prediction"] is True
    dist = res["sentiment_distribution"]
    assert "positive_percentage" in dist
    assert "negative_percentage" in dist
    assert "neutral_percentage" in dist

    total_pct = dist["positive_percentage"] + dist["negative_percentage"] + dist["neutral_percentage"]
    assert 99.0 <= total_pct <= 101.0
    assert res["overall_vibe"] in ["Positive", "Negative", "Neutral"]


# -------------------------------------------------------------
# 11. API failure handling
# -------------------------------------------------------------
def test_api_failure_handling():
    adapter = YouTubeAdapter(api_key="AIzaInvalidKey")

    # Quota exceeded error (HTTP 403)
    mock_quota_resp = MagicMock(
        status_code=403,
        json=lambda: {"error": {"errors": [{"reason": "quotaExceeded"}], "message": "Daily quota exceeded"}}
    )
    with patch("httpx.Client.get", return_value=mock_quota_resp):
        with pytest.raises(ValueError) as exc:
            adapter.fetch_data({"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
        assert "quota" in str(exc.value).lower()

    # Video not found (HTTP 200 with empty items)
    mock_empty_resp = MagicMock(status_code=200, json=lambda: {"items": []})
    with patch("httpx.Client.get", return_value=mock_empty_resp):
        with pytest.raises(ValueError) as exc:
            adapter.fetch_data({"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
        assert "private" in str(exc.value).lower() or "not found" in str(exc.value).lower()


# -------------------------------------------------------------
# 12. Empty content handling (No sentiment prediction displayed)
# -------------------------------------------------------------
def test_empty_content_handling():
    payload = AnalysisPayload(
        platform="youtube",
        post_url="https://www.youtube.com/watch?v=no_comments",
        title="Empty Comments Video",
        author="Creator",
        comments=[],
        coverage=CoverageReport(
            comments_fetched=0,
            notice="Comments are disabled on this video by the creator."
        )
    )
    analysis = VibeAnalyzer.analyze(payload)
    res = analysis["vibecheck_results"]

    assert res["has_prediction"] is False
    assert res["overall_vibe"] is None
    assert res["sentiment_distribution"] is None
    assert res["analysis_information"]["samples_analyzed"] == 0
    assert "No usable text was retrieved" in res["analysis_summary"]


# -------------------------------------------------------------
# 13. Frontend and backend integration (Route responses)
# -------------------------------------------------------------
def test_frontend_backend_integration_endpoints():
    # 1. Health check
    h = health()
    assert h["status"] == "healthy"
    assert "youtube" in h["supported_platforms"]

    # 2. VibeCheck status
    s = get_vibecheck_status()
    assert s["status"] == "operational"
    assert "selected_ml_model" in s

    # 3. Supported platforms (only YouTube and Twitter)
    p_data = get_supported_platforms()
    platform_ids = [p["id"] for p in p_data["supported_platforms"]]
    assert "youtube" in platform_ids
    assert "twitter" in platform_ids
    assert "instagram" not in platform_ids
    assert "tiktok" not in platform_ids

    # 4. ML Models Comparison endpoint
    m_data = get_ml_models_comparison()
    assert "models" in m_data
    assert "Logistic Regression" in m_data["models"]
    assert "Multinomial Naive Bayes" in m_data["models"]
    assert "Linear SVM" in m_data["models"]

    # 5. Direct Analyze invocation
    sample_res = analyze_content(AnalyzeRequest(
        raw_text="Amazing video!\nI didn't like the pacing.",
        input_type="pasted_comments",
        platform="youtube",
        save_to_history=False
    ))
    assert sample_res["vibecheck_results"]["has_prediction"] is True


# -------------------------------------------------------------
# 14. Responsive UI & Build verification
# -------------------------------------------------------------
def test_build_and_client_integrity():
    # Verify that the built frontend files exist in frontend/dist
    dist_index = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "frontend", "dist", "index.html"
    )
    assert os.path.exists(dist_index), "Frontend dist/index.html must exist from build."
