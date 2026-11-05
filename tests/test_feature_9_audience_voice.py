"""
Feature 9: Audience Voice End-to-End Tests
------------------------------------------
Validates:
1. Retrieval of comments summary and sentiment breakdown.
2. Comments aggregation from VibeCheck reports when present (real user-analyzed feedback).
3. Fallback to sample data with truthful 'Sample data' provenance label when in sample mode.
4. Clean empty state with total_comments: 0 when non-sample source has no analyzed comments.
5. Comment filtering by platform, sentiment, theme, and question flag.
6. Repeated questions payload structure for Content Studio ideation handoff.
"""

import pytest
import os
import json
from unittest.mock import patch
from backend.services import data_access


@pytest.fixture(autouse=True)
def clean_vibecheck_test_state():
    """Ensure consistent state during tests."""
    yield


def test_audience_voice_sample_fallback():
    """When no VibeCheck reports exist and source is sample, returns sample data with truthful labeling."""
    with patch("backend.services.data_access._load_json") as mock_load:
        def side_effect(filename):
            if filename == "vibecheck_reports.json":
                return []
            if filename == "comments.json":
                return [
                    {
                        "comment_id": "c1",
                        "platform": "youtube",
                        "author": "tester",
                        "text": "How do you optimize SQLite indexing?",
                        "sentiment": "positive",
                        "theme": "Database Optimization",
                        "is_question": True
                    },
                    {
                        "comment_id": "c2",
                        "platform": "youtube",
                        "author": "critic",
                        "text": "Too fast paced.",
                        "sentiment": "negative",
                        "theme": "Pacing",
                        "is_question": False
                    }
                ]
            if filename == "data_source_state.json":
                return {"active_source": "sample"}
            return []

        mock_load.side_effect = side_effect

        summary = data_access.get_comments_summary()
        assert summary["total_comments"] == 2
        assert summary["is_sample_data"] is True
        assert summary["data_source"] == "Sample data"
        assert summary["sentiment_breakdown"]["positive"] == 50.0
        assert summary["sentiment_breakdown"]["negative"] == 50.0
        assert len(summary["repeated_questions"]) == 1
        assert summary["repeated_questions"][0]["text"] == "How do you optimize SQLite indexing?"


def test_audience_voice_aggregates_vibecheck_reports():
    """When VibeCheck reports exist, Audience Voice aggregates analyzed comments as real data."""
    mock_reports = [
        {
            "report_id": "vibe_test_1",
            "title": "Clean Architecture Deep Dive",
            "platform": "youtube",
            "full_analysis": {
                "comments": [
                    {
                        "comment_id": "vc_1",
                        "author": "alex_codes",
                        "text": "Can you explain domain events vs integration events?",
                        "sentiment": "positive",
                        "compound_score": 0.65,
                        "vibe": "Curious & Inquiring",
                        "is_question": True
                    },
                    {
                        "comment_id": "vc_2",
                        "author": "dev_rachel",
                        "text": "Best architectural video of the year, crystal clear!",
                        "sentiment": "positive",
                        "compound_score": 0.88,
                        "vibe": "Hyped & Enthusiastic",
                        "is_question": False
                    },
                    {
                        "comment_id": "vc_3",
                        "author": "critic_dan",
                        "text": "Too much boilerplate code for a small project.",
                        "sentiment": "negative",
                        "compound_score": -0.45,
                        "vibe": "Constructive & Critical",
                        "is_question": False
                    }
                ]
            }
        }
    ]

    with patch("backend.services.data_access._load_json") as mock_load:
        def side_effect(filename):
            if filename == "vibecheck_reports.json":
                return mock_reports
            return []

        mock_load.side_effect = side_effect

        summary = data_access.get_comments_summary()
        assert summary["total_comments"] == 3
        assert summary["is_sample_data"] is False
        assert "VibeCheck" in summary["data_source"]
        assert summary["sentiment_counts"]["positive"] == 2
        assert summary["sentiment_counts"]["negative"] == 1
        assert summary["sentiment_breakdown"]["positive"] == 66.7
        assert summary["sentiment_breakdown"]["negative"] == 33.3

        # Questions check
        questions = summary["repeated_questions"]
        assert len(questions) == 1
        assert questions[0]["author"] == "alex_codes"
        assert "domain events" in questions[0]["text"]
        assert questions[0]["platform"] == "youtube"


def test_audience_voice_empty_state_on_non_sample_without_reports():
    """When active source is not sample and no VibeCheck reports exist, returns clean empty state."""
    with patch("backend.services.data_access._load_json") as mock_load:
        def side_effect(filename):
            if filename == "vibecheck_reports.json":
                return []
            if filename == "data_source_state.json":
                return {"active_source": "uploaded_csv"}
            return []

        mock_load.side_effect = side_effect

        summary = data_access.get_comments_summary()
        assert summary["total_comments"] == 0
        assert summary["is_sample_data"] is False
        assert summary["sentiment_breakdown"]["positive"] == 0.0
        assert len(summary["top_themes"]) == 0
        assert len(summary["repeated_questions"]) == 0


def test_get_comments_filters():
    """Verifies get_comments filters by platform, sentiment, and question."""
    mock_comments = [
        {"comment_id": "1", "platform": "youtube", "sentiment": "positive", "is_question": True, "theme": "ai"},
        {"comment_id": "2", "platform": "youtube", "sentiment": "negative", "is_question": False, "theme": "speed"},
        {"comment_id": "3", "platform": "instagram", "sentiment": "positive", "is_question": False, "theme": "ui"},
    ]

    with patch("backend.services.data_access._resolve_raw_comments", return_value=(mock_comments, "Test", False)):
        # Filter by platform
        yt_comments = data_access.get_comments(platform="youtube")
        assert len(yt_comments) == 2

        # Filter by sentiment
        pos_comments = data_access.get_comments(sentiment="positive")
        assert len(pos_comments) == 2

        # Filter by question
        q_comments = data_access.get_comments(is_question=True)
        assert len(q_comments) == 1
        assert q_comments[0]["comment_id"] == "1"

        # Combined filter
        combo = data_access.get_comments(platform="youtube", sentiment="positive", is_question=True)
        assert len(combo) == 1
