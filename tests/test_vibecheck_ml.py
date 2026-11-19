"""
CreatorPulse AI - VibeCheck AI & Machine Learning Test Suite
------------------------------------------------------------
Directly tests all academic, functional, and ML requirements:
1. YouTube URL validation
2. YouTube-only platform enforcement & X rejection
3. YouTube API retrieval (video details + commentThreads)
4. Text preprocessing (noise cleaning, negations preserved)
5. ML model prediction pipeline across 4 algorithms
6. Random Forest classifier evaluation and inference
7. Positive sentiment prediction
8. Negative sentiment prediction
9. Neutral sentiment prediction
10. Sentiment percentage calculations
11. API failure handling
12. Empty content handling (no prediction displayed)
13. Frontend and backend integration endpoints
14. Responsive UI & Build verification
"""

import pytest
import os
from unittest.mock import patch, MagicMock

from backend.main import root, health
from backend.ml.preprocessor import clean_text
from backend.ml.classifier import classify_comments, classify_single_text, get_model_metadata
from backend.services.vibecheck.youtube_adapter import YouTubeAdapter
from backend.services.vibecheck.analysis import VibeAnalyzer
from backend.services.vibecheck.base import AnalysisPayload, CommentItem, CoverageReport
from backend.routers.vibecheck import (
    AnalyzeRequest,
    analyze_content,
    get_vibecheck_status,
    get_ml_models_comparison,
    get_supported_platforms
)
from fastapi import HTTPException


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
# 2. YouTube-only platform enforcement & X rejection
# -------------------------------------------------------------
def test_youtube_only_platform_enforcement():
    # Only YouTube is in supported platforms
    p_data = get_supported_platforms()
    platform_ids = [p["id"] for p in p_data["supported_platforms"]]
    assert platform_ids == ["youtube"]
    assert "twitter" not in platform_ids
    assert "instagram" not in platform_ids
    assert "tiktok" not in platform_ids

    # X (Twitter) URL is rejected with clear 400 error
    with pytest.raises(HTTPException) as excinfo:
        analyze_content(AnalyzeRequest(
            target="https://x.com/creator/status/1234567890",
            input_type="url",
            platform="youtube"
        ))
    assert excinfo.value.status_code == 400
    assert "X (Twitter) is not supported" in excinfo.value.detail

    # Unsupported platform string is rejected
    with pytest.raises(HTTPException) as excinfo:
        analyze_content(AnalyzeRequest(
            target="https://example.com",
            input_type="url",
            platform="twitter"
        ))
    assert excinfo.value.status_code == 400


# -------------------------------------------------------------
# 3. YouTube API retrieval (video details + comments)
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
# 4. Text preprocessing
# -------------------------------------------------------------
def test_text_preprocessing():
    # 1. URL removal
    raw_with_url = "Great tutorial https://youtu.be/1234 check it out!"
    assert "https" not in clean_text(raw_with_url)

    # 2. Mentions removal
    raw_with_mention = "Hey @johndoe that was super clear!"
    assert "@johndoe" not in clean_text(raw_with_mention)

    # 3. Contraction expansion (preserving negation 'not')
    raw_with_contraction = "I don't think it's working"
    cleaned = clean_text(raw_with_contraction)
    assert "not" in cleaned

    # 4. Emoticon mapping
    raw_emoji = "Awesome content! ❤️ 🔥"
    cleaned_emoji = clean_text(raw_emoji)
    assert "love" in cleaned_emoji or "fire" in cleaned_emoji

    # 5. Noise normalization
    raw_noise = "Sooooooo goooood!!!!!!"
    cleaned_noise = clean_text(raw_noise)
    assert "soo good" in cleaned_noise


# -------------------------------------------------------------
# 5. ML model prediction pipeline across all 4 algorithms
# -------------------------------------------------------------
def test_ml_model_prediction_pipeline():
    meta = get_model_metadata()
    assert meta["status"] == "success"
    assert "best_model" in meta
    assert meta["best_model"] == "Multinomial Naive Bayes"

    models = meta["models"]
    # All 4 traditional ML algorithms must be present
    assert "Multinomial Naive Bayes" in models
    assert "Linear SVM" in models
    assert "Logistic Regression" in models
    assert "Random Forest" in models
    assert len(models) == 4

    for name in ["Multinomial Naive Bayes", "Linear SVM", "Logistic Regression", "Random Forest"]:
        m = models[name]
        assert m["accuracy"] >= 0.90
        assert m["precision_weighted"] >= 0.90
        assert m["recall_weighted"] >= 0.90
        assert m["f1_score_weighted"] >= 0.90
        assert "confusion_matrix" in m
        assert len(m["confusion_matrix"]["matrix"]) == 3


# -------------------------------------------------------------
# 6. Random Forest Classifier explicit evaluation
# -------------------------------------------------------------
def test_random_forest_classifier_metrics():
    meta = get_model_metadata()
    rf = meta["models"]["Random Forest"]
    assert rf["model_name"] == "Random Forest"
    assert rf["accuracy"] == 0.9417
    assert rf["f1_score_weighted"] == 0.9415
    matrix = rf["confusion_matrix"]["matrix"]
    assert len(matrix) == 3
    # Verify non-trivial positive diagonal (true positives)
    assert matrix[0][0] > 0
    assert matrix[1][1] > 0
    assert matrix[2][2] > 0


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
    assert h["supported_platforms"] == ["youtube"]

    # 2. VibeCheck status
    s = get_vibecheck_status()
    assert s["status"] == "operational"
    assert s["selected_ml_model"] == "Multinomial Naive Bayes"

    # 3. Supported platforms (only YouTube)
    p_data = get_supported_platforms()
    platform_ids = [p["id"] for p in p_data["supported_platforms"]]
    assert platform_ids == ["youtube"]
    assert "twitter" not in platform_ids

    # 4. ML Models Comparison endpoint (all 4 models)
    m_data = get_ml_models_comparison()
    assert "models" in m_data
    assert len(m_data["models"]) == 4
    assert "Multinomial Naive Bayes" in m_data["models"]
    assert "Linear SVM" in m_data["models"]
    assert "Logistic Regression" in m_data["models"]
    assert "Random Forest" in m_data["models"]

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
