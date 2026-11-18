"""
CreatorPulse AI - Integrations & Secrets Manager
------------------------------------------------
Single source of truth for:
1. Safe retrieval and storage of external API keys.
2. Key masking (raw secrets are never exposed).
3. Support strictly for YouTube and X (Twitter).
"""

import os
from typing import Optional

ENV_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")


def mask_key(key: Optional[str]) -> Optional[str]:
    """Masks a sensitive API key for safe display (e.g. AIza...4xK9)."""
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

    return ""
