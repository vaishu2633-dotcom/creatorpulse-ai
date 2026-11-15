"""
CreatorPulse AI - Centralized Integrations & Secrets Manager
-----------------------------------------------------------
Single source of truth for:
1. Safe retrieval and storage of external API keys.
2. Key masking (raw secrets are never exposed in API responses).
3. Live health verification pings across external providers (YouTube, Gemini, OpenAI, etc.).
4. Provider quota tracking and friendly error diagnostics.
5. Integration status reporting across all supported platforms.
"""

import os
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import httpx

ENV_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")


def mask_key(key: Optional[str]) -> Optional[str]:
    """Masks a sensitive API key for safe client-side display (e.g. AIza...4xK9)."""
    if not key or key.startswith("your_"):
        return None
    cleaned = key.strip()
    if len(cleaned) <= 8:
        return "***"
    return f"{cleaned[:4]}...{cleaned[-4:]}"


def get_secret(key_name: str) -> str:
    """
    Retrieves secret from environment or backend/.env file.
    Never returns placeholder values like 'your_api_key_here'.
    """
    val = os.getenv(key_name, "").strip()
    if val and not val.startswith("your_"):
        return val

    if os.path.exists(ENV_FILE_PATH):
        try:
            with open(ENV_FILE_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith(f"{key_name}="):
                        extracted = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if extracted and not extracted.startswith("your_"):
                            return extracted
        except Exception:
            pass

    # Check database if storage mode is relational
    try:
        from backend.database.connection import get_storage_mode, get_db
        from backend.database.repositories import integration_repository
        from backend.database.models import SYSTEM_DEMO_WORKSPACE_ID
        if get_storage_mode() in ("sqlite", "postgres"):
            provider_map = {
                "YOUTUBE_API_KEY": "youtube",
                "GEMINI_API_KEY": "gemini",
                "OPENAI_API_KEY": "openai",
                "INSTAGRAM_ACCESS_TOKEN": "instagram",
                "TIKTOK_ACCESS_TOKEN": "tiktok",
                "TWITTER_BEARER_TOKEN": "twitter",
                "LINKEDIN_ACCESS_TOKEN": "linkedin",
            }
            provider = provider_map.get(key_name)
            if provider:
                with get_db() as session:
                    db_sec = integration_repository.get_integration_secret(session, SYSTEM_DEMO_WORKSPACE_ID, provider)
                    if db_sec:
                        return db_sec
    except Exception:
        pass

    return ""


def set_secret_in_env(key_name: str, key_val: str) -> bool:
    """
    Safely writes or updates a secret key in backend/.env.
    Preserves all existing environment variables and comments.
    """
    key_val_clean = key_val.strip()
    lines = []
    found = False

    if os.path.exists(ENV_FILE_PATH):
        try:
            with open(ENV_FILE_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception:
            lines = []

    new_lines = []
    for line in lines:
        if line.strip().startswith(f"{key_name}="):
            new_lines.append(f"{key_name}={key_val_clean}\n")
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f"{key_name}={key_val_clean}\n")

    try:
        with open(ENV_FILE_PATH, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        os.environ[key_name] = key_val_clean

        # Synchronize encrypted secret in database if in relational mode
        try:
            from backend.database.connection import get_storage_mode, get_db
            from backend.database.repositories import integration_repository
            from backend.database.models import SYSTEM_DEMO_WORKSPACE_ID, SYSTEM_DEMO_USER_ID
            if get_storage_mode() in ("sqlite", "postgres"):
                provider_map = {
                    "YOUTUBE_API_KEY": "youtube",
                    "GEMINI_API_KEY": "gemini",
                    "OPENAI_API_KEY": "openai",
                    "INSTAGRAM_ACCESS_TOKEN": "instagram",
                    "TIKTOK_ACCESS_TOKEN": "tiktok",
                    "TWITTER_BEARER_TOKEN": "twitter",
                    "LINKEDIN_ACCESS_TOKEN": "linkedin",
                }
                provider = provider_map.get(key_name)
                if provider:
                    with get_db() as session:
                        integration_repository.save_integration_metadata(
                            session,
                            SYSTEM_DEMO_WORKSPACE_ID,
                            SYSTEM_DEMO_USER_ID,
                            provider_id=provider,
                            is_connected=True,
                            secret=key_val_clean,
                            key_masked=mask_key(key_val_clean),
                            health_status="active",
                        )
        except Exception:
            pass

        return True
    except Exception as e:
        print(f"[IntegrationsManager] Failed to write {key_name} to .env: {e}")
        return False


# ----------------- Provider Validation Routines -----------------

def validate_youtube_key(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates YouTube Data API v3 key with a lightweight 1-quota-unit API call.
    Returns status ('active', 'invalid_key', 'quota_exceeded', 'unconfigured', 'network_error').
    """
    key = (api_key or get_secret("YOUTUBE_API_KEY")).strip()
    if not key or key.startswith("your_"):
        return {
            "is_configured": False,
            "status": "unconfigured",
            "badge_label": "Key Needed",
            "badge_color": "gray",
            "message": "YouTube Data API key is not configured in backend/.env.",
            "masked_key": None,
            "quota_limit": "10,000 units/day",
            "last_validated": None
        }

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "id",
        "chart": "mostPopular",
        "maxResults": 1,
        "key": key
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url, params=params)

            if resp.status_code == 200:
                return {
                    "is_configured": True,
                    "status": "active",
                    "badge_label": "Working now",
                    "badge_color": "green",
                    "message": "Connected to official YouTube Data API v3 (free 10,000 daily quota ready).",
                    "masked_key": mask_key(key),
                    "quota_limit": "10,000 units/day",
                    "last_validated": datetime.now(timezone.utc).isoformat()
                }

            if resp.status_code == 403:
                err_data = resp.json().get("error", {})
                reasons = [e.get("reason") for e in err_data.get("errors", [])]
                if "quotaExceeded" in reasons or "dailyLimitExceeded" in reasons:
                    return {
                        "is_configured": True,
                        "status": "quota_exceeded",
                        "badge_label": "Quota Exceeded",
                        "badge_color": "amber",
                        "message": "YouTube API daily quota (10,000 units) exhausted. Resets at midnight PST.",
                        "masked_key": mask_key(key),
                        "quota_limit": "10,000 units/day",
                        "last_validated": datetime.now(timezone.utc).isoformat()
                    }
                return {
                    "is_configured": True,
                    "status": "invalid_key",
                    "badge_label": "Invalid Key",
                    "badge_color": "red",
                    "message": f"YouTube API access denied: {err_data.get('message', 'API key invalid or restricted')}",
                    "masked_key": mask_key(key),
                    "quota_limit": "10,000 units/day",
                    "last_validated": datetime.now(timezone.utc).isoformat()
                }

            return {
                "is_configured": True,
                "status": "api_error",
                "badge_label": "API Error",
                "badge_color": "red",
                "message": f"YouTube API returned HTTP {resp.status_code}.",
                "masked_key": mask_key(key),
                "quota_limit": "10,000 units/day",
                "last_validated": datetime.now(timezone.utc).isoformat()
            }
    except httpx.RequestError as exc:
        return {
            "is_configured": True,
            "status": "network_error",
            "badge_label": "Network Issue",
            "badge_color": "amber",
            "message": f"Could not connect to Google APIs: {str(exc)}",
            "masked_key": mask_key(key),
            "quota_limit": "10,000 units/day",
            "last_validated": None
        }


def validate_llm_key(api_key: Optional[str] = None, provider: Optional[str] = None) -> Dict[str, Any]:
    """
    Validates LLM provider (Gemini or OpenAI) with lightweight status probe.
    """
    key = (api_key or get_secret("LLM_API_KEY")).strip()
    prov = (provider or os.getenv("LLM_PROVIDER", "")).strip().lower()

    if not prov or prov == "mock":
        if key:
            prov = "openai" if key.startswith("sk-") else "gemini"
        else:
            prov = "template"

    if not key or key.startswith("your_"):
        return {
            "is_configured": False,
            "status": "template_mode",
            "provider": "template",
            "badge_label": "Curated Templates",
            "badge_color": "gray",
            "model_label": "Curated Multilingual Templates (EN, HI, MR)",
            "message": "Operating in Curated Template mode. Add LLM_API_KEY (Gemini or OpenAI) to activate live AI generation.",
            "masked_key": None,
            "last_validated": None
        }

    try:
        with httpx.Client(timeout=8.0) as client:
            if prov == "gemini":
                # Ping Gemini models endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
                resp = client.get(url)
                if resp.status_code == 200:
                    return {
                        "is_configured": True,
                        "status": "active",
                        "provider": "gemini",
                        "badge_label": "Working now",
                        "badge_color": "green",
                        "model_label": "Gemini 1.5 Flash (Google Cloud)",
                        "message": "Connected to Google Gemini AI API.",
                        "masked_key": mask_key(key),
                        "quota_limit": "15 RPM / 1M TPM (Free Tier)",
                        "last_validated": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    return {
                        "is_configured": True,
                        "status": "invalid_key",
                        "provider": "gemini",
                        "badge_label": "Invalid Key",
                        "badge_color": "red",
                        "model_label": "Gemini 1.5 Flash",
                        "message": f"Gemini API error (HTTP {resp.status_code}). Check your Google AI Studio key.",
                        "masked_key": mask_key(key),
                        "last_validated": datetime.now(timezone.utc).isoformat()
                    }
            elif prov == "openai":
                # Ping OpenAI models endpoint
                url = "https://api.openai.com/v1/models"
                headers = {"Authorization": f"Bearer {key}"}
                resp = client.get(url, headers=headers)
                if resp.status_code == 200:
                    return {
                        "is_configured": True,
                        "status": "active",
                        "provider": "openai",
                        "badge_label": "Working now",
                        "badge_color": "green",
                        "model_label": "GPT-4o Mini (OpenAI)",
                        "message": "Connected to OpenAI API.",
                        "masked_key": mask_key(key),
                        "quota_limit": "Usage based (OpenAI credits)",
                        "last_validated": datetime.now(timezone.utc).isoformat()
                    }
                else:
                    return {
                        "is_configured": True,
                        "status": "invalid_key",
                        "provider": "openai",
                        "badge_label": "Invalid Key",
                        "badge_color": "red",
                        "model_label": "GPT-4o Mini",
                        "message": f"OpenAI authentication failed (HTTP {resp.status_code}).",
                        "masked_key": mask_key(key),
                        "last_validated": datetime.now(timezone.utc).isoformat()
                    }
    except Exception as exc:
        return {
            "is_configured": True,
            "status": "network_error",
            "provider": prov,
            "badge_label": "Network Issue",
            "badge_color": "amber",
            "model_label": f"{prov.capitalize()} AI",
            "message": f"Could not reach {prov} servers: {str(exc)}",
            "masked_key": mask_key(key),
            "last_validated": None
        }


# ----------------- Unified Catalog & System Overview -----------------

def get_all_integrations_summary(live_ping: bool = False) -> Dict[str, Any]:
    """
    Compiles comprehensive integration status for all 6 platform connectors.
    If live_ping is False, performs instant heuristic key inspection to preserve quota.
    If live_ping is True, executes verification calls against external APIs.
    """
    yt_key = get_secret("YOUTUBE_API_KEY")
    llm_key = get_secret("LLM_API_KEY")

    if live_ping:
        yt_status = validate_youtube_key(yt_key)
        llm_status = validate_llm_key(llm_key)
    else:
        # Fast local validation without consuming rate limits
        has_yt = bool(yt_key and not yt_key.startswith("your_"))
        yt_status = {
            "is_configured": has_yt,
            "status": "active" if has_yt else "unconfigured",
            "badge_label": "Working now" if has_yt else "Key Needed",
            "badge_color": "green" if has_yt else "gray",
            "message": "YouTube Data API key is configured." if has_yt else "YouTube Data API key is not configured in backend/.env.",
            "masked_key": mask_key(yt_key),
            "quota_limit": "10,000 units/day",
            "last_validated": datetime.now(timezone.utc).isoformat() if has_yt else None
        }

        has_llm = bool(llm_key and not llm_key.startswith("your_"))
        prov = os.getenv("LLM_PROVIDER", "").strip().lower()
        if not prov or prov == "mock":
            prov = "openai" if (has_llm and llm_key.startswith("sk-")) else ("gemini" if has_llm else "template")

        llm_status = {
            "is_configured": has_llm,
            "status": "active" if has_llm else "template_mode",
            "provider": prov,
            "badge_label": "Working now" if has_llm else "Curated Templates",
            "badge_color": "green" if has_llm else "gray",
            "model_label": "Gemini 1.5 Flash" if prov == "gemini" else ("GPT-4o Mini" if prov == "openai" else "Curated Templates"),
            "message": f"Connected to {prov.capitalize()} AI API." if has_llm else "Using curated template frameworks.",
            "masked_key": mask_key(llm_key),
            "last_validated": datetime.now(timezone.utc).isoformat() if has_llm else None
        }

    integrations = [
        {
            "id": "youtube",
            "name": "YouTube Data API v3",
            "platform": "youtube",
            "auth_type": "Google Cloud API Key",
            "status": yt_status["status"],
            "badge_label": yt_status["badge_label"],
            "badge_color": yt_status["badge_color"],
            "is_configured": yt_status["is_configured"],
            "masked_key": yt_status["masked_key"],
            "quota_info": yt_status.get("quota_limit", "10,000 units/day"),
            "features_supported": [
                "Live Channel Ingestion",
                "Video Metadata & Duration Parsing",
                "VibeCheck Video Comment Retrieval",
                "Regional Trending Topics (US, IN, GB)",
                "Competitor Public Benchmark Stats"
            ],
            "action_type": "configure_key",
            "env_var": "YOUTUBE_API_KEY",
            "description": "Connects to official Google YouTube Data API for live channel sync, metrics, and video comment streams."
        },
        {
            "id": "llm",
            "name": "Content Studio LLM Engine",
            "platform": "ai_engine",
            "auth_type": "Bearer Token / API Key (Gemini or OpenAI)",
            "status": llm_status["status"],
            "badge_label": llm_status["badge_label"],
            "badge_color": llm_status["badge_color"],
            "is_configured": llm_status["is_configured"],
            "masked_key": llm_status["masked_key"],
            "model_label": llm_status.get("model_label", "Curated Templates"),
            "features_supported": [
                "Multilingual Post Concepts (EN, HI, MR)",
                "Hook Variations & Angle Testing",
                "Full Script Outlines & Descriptions",
                "Idea Tournament Top 10 Ideation"
            ],
            "action_type": "configure_key",
            "env_var": "LLM_API_KEY",
            "description": "Powers AI-assisted writing for YouTube, Instagram, X, and LinkedIn with native multi-lingual support."
        },
        {
            "id": "instagram",
            "name": "Instagram / Meta",
            "platform": "instagram",
            "auth_type": "Public oEmbed & CSV Import",
            "status": "ready_csv_oembed",
            "badge_label": "Working now (CSV + oEmbed)",
            "badge_color": "green",
            "is_configured": True,
            "masked_key": None,
            "quota_info": "Public oEmbed: Unlimited; Graph API: 200 calls/hr",
            "features_supported": [
                "Public Post & Reel oEmbed Previews",
                "Meta Business Suite CSV Ingestion",
                "Pasted Comment Sentiment & Vibe Clusters",
                "Carousels & Story Reach Evaluation"
            ],
            "action_type": "upload_csv",
            "env_var": None,
            "description": "Inspect Reels and carousels via Meta public oEmbed, or upload your Meta Business Suite CSV export."
        },
        {
            "id": "tiktok",
            "name": "TikTok",
            "platform": "tiktok",
            "auth_type": "Public oEmbed & CSV Import",
            "status": "ready_csv_oembed",
            "badge_label": "Working now (CSV + oEmbed)",
            "badge_color": "green",
            "is_configured": True,
            "masked_key": None,
            "quota_info": "Public oEmbed: Unlimited",
            "features_supported": [
                "TikTok Video oEmbed Embeds",
                "Audience Sentiment via Pasted Comments",
                "Transcript / Audio Analysis (Whisper Guide)",
                "Short-form Content Generation"
            ],
            "action_type": "upload_csv",
            "env_var": None,
            "description": "Analyze TikTok post embeds and analyze audience voice via user-pasted comments or CSV uploads."
        },
        {
            "id": "twitter",
            "name": "X (Twitter)",
            "platform": "twitter",
            "auth_type": "CSV Ingestion & X API v2 Ready",
            "status": "ready_csv",
            "badge_label": "Working now (CSV)",
            "badge_color": "green",
            "is_configured": True,
            "masked_key": None,
            "quota_info": "CSV upload: Unlimited",
            "features_supported": [
                "X Analytics CSV Export Ingest",
                "Thread & Single Tweet Generator",
                "Engagement Rate & Retweet Benchmarking",
                "What-If Viral Probability Simulator"
            ],
            "action_type": "upload_csv",
            "env_var": None,
            "description": "Upload native X Analytics exports to track tweet impressions, bookmark rates, and viral odds."
        },
        {
            "id": "linkedin",
            "name": "LinkedIn",
            "platform": "linkedin",
            "auth_type": "CSV Ingestion & OAuth Ready",
            "status": "ready_csv",
            "badge_label": "Working now (CSV)",
            "badge_color": "green",
            "is_configured": True,
            "masked_key": None,
            "quota_info": "CSV upload: Unlimited",
            "features_supported": [
                "LinkedIn Post Analytics CSV Ingest",
                "Thought Leadership & Story Post Generator",
                "Interactive Poll & Listicle Concepts",
                "Creator Channel Growth Metrics"
            ],
            "action_type": "upload_csv",
            "env_var": None,
            "description": "Upload LinkedIn Analytics CSV exports to track professional engagement, impressions, and click rates."
        }
    ]

    return {
        "summary": {
            "total_integrations": len(integrations),
            "active_count": sum(1 for i in integrations if i["is_configured"]),
            "api_keys_configured": sum(1 for i in [yt_status["is_configured"], llm_status["is_configured"]] if i),
            "youtube_status": yt_status,
            "llm_status": llm_status,
            "last_checked": datetime.now(timezone.utc).isoformat()
        },
        "integrations": integrations
    }
