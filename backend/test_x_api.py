"""
CreatorPulse AI - X (Twitter) API Connection Test
-------------------------------------------------
Validates official X API v2 connectivity using the Bearer Token
configured in backend/.env.

Target Endpoint:
https://api.x.com/2/users/by/username/xdevelopers

Security:
- Never prints, exposes, or logs the actual Bearer Token.
- Only displays masked key signatures (e.g. AAAA...IvFu).
- Handles HTTP 200, 401, 403, 429, timeouts, and network exceptions cleanly.
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Tell pytest not to treat this CLI validation utility as a unit test suite
__test__ = False

# Deterministic resolution of backend/.env
BACKEND_DIR = Path(__file__).resolve().parent
ENV_PATH = BACKEND_DIR / ".env"
ROOT_ENV_PATH = BACKEND_DIR.parent / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
elif ROOT_ENV_PATH.exists():
    load_dotenv(dotenv_path=ROOT_ENV_PATH)


def mask_token(token: Optional[str]) -> str:
    """Safely masks a bearer token for console display."""
    if not token:
        return "None"
    clean = token.strip()
    if len(clean) <= 8:
        return "***"
    return f"{clean[:4]}...{clean[-4:]}"


def test_x_api_connection(timeout: float = 10.0) -> Dict[str, Any]:
    """
    Sends an authenticated GET request to the official X API v2 endpoint.
    Returns structured results dictionary without exposing credentials.
    """
    token = os.getenv("TWITTER_BEARER_TOKEN", "").strip() or os.getenv("X_BEARER_TOKEN", "").strip()

    if not token or token.startswith("your_"):
        return {
            "success": False,
            "status_code": None,
            "error_type": "MISSING_TOKEN",
            "message": "TWITTER_BEARER_TOKEN is missing or unconfigured in backend/.env.",
            "masked_token": None,
            "data": None
        }

    masked = mask_token(token)
    endpoint_url = "https://api.x.com/2/users/by/username/xdevelopers"
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "CreatorPulse-AI/1.0"
    }
    params = {
        "user.fields": "description,public_metrics,verified,profile_image_url"
    }

    try:
        response = requests.get(
            endpoint_url,
            headers=headers,
            params=params,
            timeout=timeout
        )
        status_code = response.status_code

        # Attempt to parse JSON body
        try:
            body = response.json()
        except Exception:
            body = {}

        if status_code == 200:
            user_data = body.get("data", {})
            metrics = user_data.get("public_metrics", {})
            return {
                "success": True,
                "status_code": 200,
                "error_type": None,
                "message": f"Successfully connected to X API v2 as @{user_data.get('username')}.",
                "masked_token": masked,
                "endpoint": endpoint_url,
                "data": {
                    "id": user_data.get("id"),
                    "name": user_data.get("name"),
                    "username": user_data.get("username"),
                    "description": user_data.get("description"),
                    "verified": user_data.get("verified", False),
                    "followers_count": metrics.get("followers_count", 0),
                    "following_count": metrics.get("following_count", 0),
                    "tweet_count": metrics.get("tweet_count", 0),
                    "listed_count": metrics.get("listed_count", 0)
                }
            }

        elif status_code == 401:
            err_title = body.get("title", "Unauthorized")
            err_detail = body.get("detail", "The Bearer Token is invalid, expired, or malformed.")
            return {
                "success": False,
                "status_code": 401,
                "error_type": "UNAUTHORIZED",
                "message": f"Authentication failed: {err_title} - {err_detail}",
                "masked_token": masked,
                "endpoint": endpoint_url,
                "data": None,
                "solution": "Verify that your TWITTER_BEARER_TOKEN in backend/.env is active and has no trailing spaces or quotes."
            }

        elif status_code == 402:
            err_title = body.get("title", "Payment Required")
            err_detail = body.get("detail", "credits depleted")
            return {
                "success": False,
                "status_code": 402,
                "error_type": "CREDITS_DEPLETED",
                "message": f"X API returned HTTP 402: {err_title} - {err_detail}",
                "masked_token": masked,
                "endpoint": endpoint_url,
                "data": None,
                "solution": (
                    "The Bearer Token is authentic and recognized by X API (read access level granted), "
                    "but your X Developer Project has exhausted its monthly API credits ('credits depleted'). "
                    "To enable live requests: Log in to developer.x.com, navigate to 'Billing' or 'Projects & Apps', "
                    "and top up API credits or await your monthly usage cycle reset."
                )
            }

        elif status_code == 403:
            err_title = body.get("title", "Forbidden")
            err_detail = body.get("detail", "The client does not have permission to access this endpoint.")
            return {
                "success": False,
                "status_code": 403,
                "error_type": "FORBIDDEN",
                "message": f"Access restricted: {err_title} - {err_detail}",
                "masked_token": masked,
                "endpoint": endpoint_url,
                "data": None,
                "solution": (
                    "Ensure your X App is attached to a Project in the X Developer Portal. "
                    "Standalone apps or apps without active v2 tier enrollment receive HTTP 403."
                )
            }

        elif status_code == 429:
            err_title = body.get("title", "Too Many Requests")
            err_detail = body.get("detail", "Rate limit exceeded for X API v2.")
            return {
                "success": False,
                "status_code": 429,
                "error_type": "RATE_LIMITED",
                "message": f"Rate limit reached: {err_title} - {err_detail}",
                "masked_token": masked,
                "endpoint": endpoint_url,
                "data": None,
                "solution": "Wait for the 15-minute rate limit window to reset before retrying."
            }

        else:
            err_detail = body.get("detail") or body.get("title") or response.text[:200]
            return {
                "success": False,
                "status_code": status_code,
                "error_type": "API_ERROR",
                "message": f"X API returned unexpected HTTP status {status_code}: {err_detail}",
                "masked_token": masked,
                "endpoint": endpoint_url,
                "data": None,
                "solution": f"Check X API service health or status code {status_code} documentation."
            }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "status_code": None,
            "error_type": "TIMEOUT",
            "message": f"Connection timed out after {timeout} seconds reaching api.x.com.",
            "masked_token": masked,
            "endpoint": endpoint_url,
            "data": None,
            "solution": "Check your local internet connection, DNS resolution, or proxy/firewall settings."
        }

    except requests.exceptions.ConnectionError as exc:
        return {
            "success": False,
            "status_code": None,
            "error_type": "CONNECTION_ERROR",
            "message": f"Network connection error contacting X API: {str(exc).split(':')[-1].strip()}",
            "masked_token": masked,
            "endpoint": endpoint_url,
            "data": None,
            "solution": "Check network connectivity and ensure outbound HTTPS traffic to api.x.com is allowed."
        }

    except requests.exceptions.RequestException as exc:
        return {
            "success": False,
            "status_code": None,
            "error_type": "REQUEST_EXCEPTION",
            "message": f"HTTP request failed: {str(exc)}",
            "masked_token": masked,
            "endpoint": endpoint_url,
            "data": None,
            "solution": "Review network configuration and request parameters."
        }


def main():
    print("=" * 65)
    print("   CreatorPulse AI - Official X (Twitter) API v2 Connection Test")
    print("=" * 65)

    res = test_x_api_connection(timeout=10.0)

    print(f"\nConfiguration:")
    print(f"  • Environment File : {ENV_PATH}")
    print(f"  • Token Status     : {'Configured' if res.get('masked_token') else 'Missing'}")
    if res.get("masked_token"):
        print(f"  • Masked Token     : {res.get('masked_token')}")
    print(f"  • Target Endpoint  : {res.get('endpoint', 'https://api.x.com/2/users/by/username/xdevelopers')}")

    print(f"\nResponse Diagnostics:")
    print(f"  • HTTP Status Code : {res.get('status_code') or 'None (Connection Failed)'}")
    print(f"  • Result Status    : {'SUCCESS (HTTP 200)' if res['success'] else 'FAILED'}")
    print(f"  • Message          : {res['message']}")

    if res["success"]:
        data = res["data"]
        print(f"\nTarget Account Details:")
        print(f"  • Name             : {data.get('name')}")
        print(f"  • Username         : @{data.get('username')}")
        print(f"  • Account ID       : {data.get('id')}")
        print(f"  • Verified         : {data.get('verified')}")
        print(f"  • Followers Count  : {data.get('followers_count'):,}")
        print(f"  • Following Count  : {data.get('following_count'):,}")
        print(f"  • Tweet Count      : {data.get('tweet_count'):,}")
        print(f"  • Description      : {data.get('description')}")
        print("\n" + "=" * 65)
        print(" [PASSED] X API v2 Bearer Token is fully authenticated and working!")
        print("=" * 65)
        sys.exit(0)
    else:
        if res.get("solution"):
            print(f"\nRecommended Solution:")
            print(f"  • {res.get('solution')}")
        print("\n" + "=" * 65)
        print(f" [FAILED] X API connection test did not succeed (Status: {res.get('status_code')}).")
        print("=" * 65)
        sys.exit(1)


if __name__ == "__main__":
    main()
