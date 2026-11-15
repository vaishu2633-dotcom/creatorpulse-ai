"""
Unit tests for Integrations & Secrets Manager
--------------------------------------------
Validates:
1. Safe key masking (never exposing raw secrets).
2. Key retrieval without falling for placeholders.
3. YouTube Data API key validation & quota error classification.
4. LLM provider (Gemini / OpenAI) status detection & template fallback.
5. All 6 platform integration catalog items returned with truthful metadata.
6. API endpoints for validation and safe key persistence.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app
from backend.services import integrations_manager

client = TestClient(app)


def test_mask_key_security():
    """Verify key masking never exposes full raw credentials."""
    assert integrations_manager.mask_key(None) is None
    assert integrations_manager.mask_key("") is None
    assert integrations_manager.mask_key("your_api_key_here") is None
    assert integrations_manager.mask_key("12345") == "***"
    
    masked = integrations_manager.mask_key("AIzaSyExampleKey123456789")
    assert masked == "AIza...6789"
    assert "ExampleKey" not in masked


def test_get_secret_filters_placeholders():
    """Verify placeholder defaults are ignored and not returned as active secrets."""
    with patch.dict(os.environ, {"YOUTUBE_API_KEY": "your_youtube_api_key_here"}):
        secret = integrations_manager.get_secret("YOUTUBE_API_KEY")
        # Should not return the placeholder value
        assert not secret.startswith("your_")


def test_youtube_validation_unconfigured():
    """Verify honest unconfigured status when no YouTube key is provided."""
    with patch("backend.services.integrations_manager.get_secret", return_value=""):
        res = integrations_manager.validate_youtube_key("")
        assert res["is_configured"] is False
        assert res["status"] == "unconfigured"
        assert res["masked_key"] is None


def test_youtube_validation_active_mocked():
    """Verify active status when YouTube API ping returns HTTP 200."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"items": [{"id": "v123"}]}

    with patch("httpx.Client.get", return_value=mock_resp):
        res = integrations_manager.validate_youtube_key("AIzaSyValidMockKey123456789")
        assert res["is_configured"] is True
        assert res["status"] == "active"
        assert res["badge_color"] == "green"
        assert res["masked_key"] == "AIza...6789"
        assert "10,000 units/day" in res["quota_limit"]


def test_youtube_validation_quota_exceeded():
    """Verify quota exceeded is classified with clear warning badge and message."""
    mock_resp = MagicMock()
    mock_resp.status_code = 403
    mock_resp.json.return_value = {
        "error": {
            "errors": [{"reason": "quotaExceeded"}],
            "message": "The request cannot be completed because you have exceeded your quota."
        }
    }

    with patch("httpx.Client.get", return_value=mock_resp):
        res = integrations_manager.validate_youtube_key("AIzaSyValidMockKey123456789")
        assert res["status"] == "quota_exceeded"
        assert res["badge_color"] == "amber"
        assert "quota" in res["message"].lower()


def test_llm_validation_template_fallback():
    """Verify template fallback is reported when no LLM key is configured."""
    with patch("backend.services.integrations_manager.get_secret", return_value=""):
        res = integrations_manager.validate_llm_key("", provider="mock")
        assert res["is_configured"] is False
        assert res["status"] == "template_mode"
        assert res["badge_label"] == "Curated Templates"


def test_llm_validation_gemini_active_mocked():
    """Verify Gemini API ping returns active status on HTTP 200."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("httpx.Client.get", return_value=mock_resp):
        res = integrations_manager.validate_llm_key("AIzaSyGeminiKey123456789", provider="gemini")
        assert res["is_configured"] is True
        assert res["status"] == "active"
        assert res["provider"] == "gemini"
        assert res["badge_color"] == "green"


def test_integrations_catalog_endpoint():
    """Verify GET /api/settings/integrations returns catalog with all 6 platforms and no raw secrets."""
    res = client.get("/api/settings/integrations")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "integrations" in data
    assert "data_sources" in data

    platform_ids = [i["id"] for i in data["integrations"]]
    assert "youtube" in platform_ids
    assert "llm" in platform_ids
    assert "instagram" in platform_ids
    assert "tiktok" in platform_ids
    assert "twitter" in platform_ids
    assert "linkedin" in platform_ids

    # Security check: ensure no raw key exists in payload
    raw_payload_str = str(data)
    assert "AIzaSy" not in raw_payload_str or "..." in raw_payload_str


def test_validate_integration_endpoint():
    """Verify POST /api/settings/integrations/validate executes validation safely."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"items": []}

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.post("/api/settings/integrations/validate", json={
            "provider": "youtube",
            "api_key": "AIzaSyMockKeyForEndpoint123"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["is_configured"] is True
        assert data["status"] == "active"
        assert "masked_key" in data
        assert data["masked_key"] == "AIza...t123"
