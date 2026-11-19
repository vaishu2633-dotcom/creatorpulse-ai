"""
CreatorPulse AI - Backend Test Suite
-------------------------------------
Tests root, health, VibeCheck AI, and Machine Learning endpoints.
"""

import pytest
from backend.main import root, health
from backend.routers.vibecheck import (
    get_vibecheck_status,
    get_supported_platforms,
    get_ml_models_comparison,
    analyze_content,
    AnalyzeRequest
)


def test_root_and_health():
    """Verify root and health endpoints return status with YouTube-only platform support."""
    data = root()
    assert data["status"] == "operational"
    assert "supported_platforms" in data
    assert data["supported_platforms"] == ["youtube"]

    h = health()
    assert h["status"] == "healthy"
    assert h["supported_platforms"] == ["youtube"]


def test_vibecheck_status():
    """Verify vibecheck status endpoint."""
    data = get_vibecheck_status()
    assert data["status"] == "operational"
    assert "selected_ml_model" in data
    assert data["selected_ml_model"] == "Multinomial Naive Bayes"


def test_vibecheck_supported_platforms():
    """Verify only YouTube is supported."""
    data = get_supported_platforms()
    platforms = [p["id"] for p in data["supported_platforms"]]
    assert platforms == ["youtube"]


def test_vibecheck_ml_models():
    """Verify ML model comparison endpoint returns all 4 algorithms."""
    data = get_ml_models_comparison()
    assert "best_model" in data
    assert "Logistic Regression" in data["models"]
    assert "Multinomial Naive Bayes" in data["models"]
    assert "Linear SVM" in data["models"]
    assert "Random Forest" in data["models"]
    assert len(data["models"]) == 4


def test_vibecheck_analyze_pasted_comments():
    """Verify sentiment analysis on user comments with ML model."""
    raw = "The tutorial was super informative and clear!\nI was confused on step 3.\nWorst video ever made, completely broken."
    data = analyze_content(AnalyzeRequest(
        raw_text=raw,
        input_type="pasted_comments",
        platform="youtube",
        save_to_history=False
    ))
    results = data["vibecheck_results"]
    assert results["has_prediction"] is True
    assert results["overall_vibe"] in ["Positive", "Negative", "Neutral"]
    assert results["counts"]["total"] == 3
    assert len(data["comments"]) == 3
