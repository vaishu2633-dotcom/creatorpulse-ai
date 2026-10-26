"""
CreatorPulse AI - Settings & Integrations Router
--------------------------------------------------
Exposes platform connection states (YouTube, Instagram, X, LinkedIn)
and technical notes on data sources (Official APIs, CSV export, Public datasets).
"""

from fastapi import APIRouter
from backend.services import data_access

router = APIRouter(prefix="/api/settings", tags=["Settings & Integrations"])

@router.get("/integrations")
def get_integrations():
    integrations = [
        {
            "id": "youtube",
            "name": "YouTube",
            "icon": "Youtube",
            "status": "Available in Prototype (Mock)",
            "action": "Connect (coming soon)",
            "auth_type": "OAuth 2.0 (Google Cloud)",
            "rate_limit": "10,000 units/day quota",
            "description": "Pulls video analytics, retention curves, comments, and subscriber trends via YouTube Data API v3."
        },
        {
            "id": "instagram",
            "name": "Instagram",
            "icon": "Instagram",
            "status": "Available in Prototype (Mock)",
            "action": "Connect (coming soon)",
            "auth_type": "Meta Graph API (Facebook Login)",
            "rate_limit": "200 calls/hour per user",
            "description": "Ingests Reels metrics, carousel swipe-through rates, follower demographics, and post impressions."
        },
        {
            "id": "twitter",
            "name": "X (Twitter)",
            "icon": "Twitter",
            "status": "Available in Prototype (Mock)",
            "action": "Connect (coming soon)",
            "auth_type": "OAuth 2.0 PKCE",
            "rate_limit": "Usage based (Basic / Pro tier)",
            "description": "Monitors tweet impressions, thread retweets, profile visits, and bookmark ratios via Twitter API v2."
        },
        {
            "id": "linkedin",
            "name": "LinkedIn",
            "icon": "Linkedin",
            "status": "Available in Prototype (Mock)",
            "action": "Connect (coming soon)",
            "auth_type": "LinkedIn Member & Company Page OAuth",
            "rate_limit": "Community Management API rate caps",
            "description": "Gathers feed impressions, professional demographics (job titles, industries), and comment sentiment."
        }
    ]

    data_sources_info = [
        {
            "type": "Direct Official APIs",
            "suitability": "Production automated sync",
            "notes": "Requires developer registration, user OAuth consent, and token refresh workers."
        },
        {
            "type": "Creator CSV Export",
            "suitability": "Zero API keys needed, immediate deep history",
            "notes": "Creators can download native analytics CSV from YouTube Studio / Meta Business Suite / X Analytics and drag & drop."
        },
        {
            "type": "Public Datasets & Benchmarks",
            "suitability": "Base rate calibration & industry percentile references",
            "notes": "Used to establish baseline distribution curves across categories (Tech, Lifestyle, Business)."
        }
    ]

    return {
        "metadata": data_access.get_system_metadata(),
        "integrations": integrations,
        "data_sources": data_sources_info
    }
