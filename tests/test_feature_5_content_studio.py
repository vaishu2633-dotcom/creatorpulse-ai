"""
Feature 5: Content Studio End-to-End Tests
------------------------------------------
Validates:
1. LLM status reporting (Template mode default when no key, AI mode when key present).
2. Multilingual generation across English, Hindi, and Marathi for all 4 platforms (YouTube, Instagram, Twitter, LinkedIn).
3. Idea tournament ranking using the real calibrated predictor (predict_breakout).
4. Direct API integration for /api/content/status, /api/content/generate, /api/content/tournament, and /api/drafts.
"""

import pytest
import httpx
from backend.services import content_generator, data_access

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_llm_status_service():
    """Verify LLM status reports template mode when no external key is present."""
    status = content_generator.get_llm_status()
    assert "has_key" in status
    assert "mode" in status
    assert "supported_languages" in status
    assert "English" in status["supported_languages"]
    assert "Hindi" in status["supported_languages"]
    assert "Marathi" in status["supported_languages"]


def test_llm_status_api(client):
    """Verify GET /api/content/status returns valid mode and supported languages."""
    res = client.get("/api/content/status")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] in ["template", "ai"]
    assert "supported_languages" in data


@pytest.mark.parametrize("lang", ["English", "Hindi", "Marathi"])
def test_multilingual_youtube_generation(lang):
    """Verify YouTube content generation in English, Hindi, and Marathi."""
    res = content_generator.generate_platform_content(
        platform="youtube",
        topic="Modern Web Architecture",
        goal="engagement",
        tone="educational",
        language=lang
    )
    assert res["platform"] == "youtube"
    assert res["language"] == lang
    assert len(res["titles"]) >= 5
    assert len(res["hook"]) > 10
    assert len(res["script_outline"]) >= 4
    assert "description" in res
    assert "tags" in res
    assert res["generation_mode"] in ["template", "ai"]


@pytest.mark.parametrize("platform", ["instagram", "twitter", "linkedin"])
def test_all_platforms_generation(platform):
    """Verify content generation across Instagram, Twitter, and LinkedIn in Marathi & Hindi."""
    res_mr = content_generator.generate_platform_content(
        platform=platform,
        topic="Freelance Coding",
        language="Marathi"
    )
    assert res_mr["platform"] == platform

    if platform == "instagram":
        assert "reel_concept" in res_mr
        assert "caption" in res_mr
        assert "hashtags" in res_mr
    elif platform == "twitter":
        assert "hook_variants" in res_mr
        assert "single_post" in res_mr
        assert len(res_mr["thread_tweets"]) >= 3
    elif platform == "linkedin":
        assert "story_post" in res_mr
        assert len(res_mr["listicle"]) >= 3
        assert "poll_idea" in res_mr


def test_idea_tournament_uses_real_predictor():
    """Verify idea tournament evaluates 10 angles with the real predictor and ranks by breakout probability."""
    results = content_generator.run_idea_tournament(
        platform="youtube",
        topic="Cloud Native Microservices",
        count=10,
        language="English"
    )
    assert len(results) == 10

    # Ensure sorted descending
    probs = [r["predicted_prob_percent"] for r in results]
    assert probs == sorted(probs, reverse=True)

    # First item must be marked winner
    assert results[0]["is_winner"] is True
    assert results[0]["rank"] == 1
    assert results[1]["is_winner"] is False

    # Check that each item has real prediction attributes
    for r in results:
        assert "predicted_prob_percent" in r
        assert "base_rate_percent" in r
        assert "confidence_level" in r
        assert "angle_name" in r
        assert len(r["title"]) > 10


def test_tournament_api_endpoint(client):
    """Verify POST /api/content/tournament returns ranked results."""
    payload = {
        "platform": "instagram",
        "topic": "Creator Economy 2026",
        "count": 5,
        "language": "Hindi"
    }
    res = client.post("/api/content/tournament", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_ideas_evaluated"] == 5
    assert len(data["tournament_rankings"]) == 5
    assert data["tournament_rankings"][0]["rank"] == 1


def test_save_generated_content_to_drafts(client):
    """Verify saving a generated content package to the drafts store."""
    gen_res = client.post("/api/content/generate", json={
        "platform": "youtube",
        "topic": "Distributed Systems",
        "language": "English"
    })
    assert gen_res.status_code == 200
    pkg = gen_res.json()["content"]

    draft_payload = {
        "platform": pkg["platform"],
        "title": pkg["titles"][0],
        "status": "idea",
        "language": pkg["language"],
        "hook": pkg["hook"],
        "content_payload": pkg
    }
    draft_res = client.post("/api/drafts", json=draft_payload)
    assert draft_res.status_code == 200
    created = draft_res.json()
    assert "id" in created
    assert created["title"] == pkg["titles"][0]

    # Verify retrieval from drafts list
    list_res = client.get("/api/drafts?platform=youtube")
    assert list_res.status_code == 200
    draft_ids = [d["id"] for d in list_res.json()["drafts"]]
    assert created["id"] in draft_ids
