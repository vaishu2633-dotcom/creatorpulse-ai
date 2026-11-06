"""
Unit tests for VibeCheck Sentiment Engine Inference
---------------------------------------------------
Verifies:
1. Transformer inference is genuinely executed when pipeline is active.
2. Honest fallback to VADER rule-based polarity when transformer is disabled.
3. Reported model name matches the actual engine used.
"""

import pytest
from unittest.mock import MagicMock, patch
from backend.services.vibecheck.analysis import VibeAnalyzer
from backend.services.vibecheck.base import AnalysisPayload, CommentItem, CoverageReport


def test_vader_fallback_when_transformer_disabled():
    """When transformer is disabled, uses VADER and accurately reports rule-based engine."""
    with patch.dict("os.environ", {"USE_TRANSFORMER_SENTIMENT": "false"}):
        with patch("backend.services.vibecheck.analysis._xlm_roberta_pipeline", None):
            engine, notice, is_multi = VibeAnalyzer.get_sentiment_engine()
            assert "VADER" in engine
            assert is_multi is False

            payload = AnalysisPayload(
                platform="youtube",
                title="Test Post",
                author="dev",
                comments=[
                    CommentItem(comment_id="c1", author="alice", text="This tutorial is absolutely fantastic!", like_count=10),
                    CommentItem(comment_id="c2", author="bob", text="Terrible video, complete waste of time.", like_count=0)
                ],
                coverage=CoverageReport(comments_fetched=2, source_type="pasted_comments")
            )

            res = VibeAnalyzer.analyze(payload)
            assert res["sentiment"]["model_used"] == "VADER (Rule-based)"
            assert res["sentiment"]["is_multilingual"] is False
            assert res["comments"][0]["sentiment"] == "positive"
            assert res["comments"][1]["sentiment"] == "negative"


def test_transformer_inference_when_pipeline_active():
    """When transformer pipeline is active, genuinely uses transformer predictions."""
    mock_pipeline = MagicMock()
    # Mock returns for the two comments
    mock_pipeline.side_effect = [
        [{"label": "LABEL_2", "score": 0.95}],  # Positive
        [{"label": "LABEL_0", "score": 0.92}]   # Negative
    ]

    with patch("backend.services.vibecheck.analysis._xlm_roberta_pipeline", mock_pipeline):
        engine, notice, is_multi = VibeAnalyzer.get_sentiment_engine()
        assert "XLM-RoBERTa" in engine
        assert is_multi is True

        payload = AnalysisPayload(
            platform="youtube",
            title="Multilingual Post",
            author="dev",
            comments=[
                CommentItem(comment_id="c1", author="alice", text="बहुत ही बढ़िया वीडियो!", like_count=15),
                CommentItem(comment_id="c2", author="bob", text="बिल्कुल बेकार लगा", like_count=1)
            ],
            coverage=CoverageReport(comments_fetched=2, source_type="pasted_comments")
        )

        res = VibeAnalyzer.analyze(payload)
        assert res["sentiment"]["model_used"] == "XLM-RoBERTa (Multilingual)"
        assert res["sentiment"]["is_multilingual"] is True
        assert mock_pipeline.call_count == 2
        assert res["comments"][0]["sentiment"] == "positive"
        assert res["comments"][1]["sentiment"] == "negative"
