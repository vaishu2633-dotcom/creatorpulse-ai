"""
creatorPulse - VibeCheck Server
-------------------------------
FastAPI application for ML-Based YouTube Comment Sentiment Analysis (VibeCheck AI).
Supports YouTube using the official YouTube Data API v3 and traditional
Machine Learning models (Multinomial Naive Bayes, Logistic Regression, Linear SVM, Random Forest).
"""

import os
import sys
from dotenv import load_dotenv

# Ensure project root is in sys.path so 'backend' is always importable
# regardless of whether running from project root or inside backend/
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_backend_dir, ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

# Ensure environment configuration from backend/.env and root .env is loaded
_backend_env = os.path.join(_backend_dir, ".env")
_root_env = os.path.join(_project_root, ".env")
if os.path.exists(_backend_env):
    load_dotenv(_backend_env)
if os.path.exists(_root_env):
    load_dotenv(_root_env)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import vibecheck

app = FastAPI(
    title="creatorPulse - YouTube Comment Sentiment Analysis",
    description="ML-Based YouTube Comment Sentiment Analysis System using Traditional Machine Learning",
    version="2.1.0"
)

# Configure CORS: Allow local development origins, Vercel deployments, and custom production domains
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
allow_credentials = True
allow_origin_regex = r"^https:\/\/.*\.vercel\.app$"

if allowed_origins_env == "*":
    allowed_origins = ["*"]
    allow_credentials = False
    allow_origin_regex = None
elif allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    for default_origin in [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]:
        if default_origin not in allowed_origins:
            allowed_origins.append(default_origin)
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

cors_kwargs = {
    "allow_origins": allowed_origins,
    "allow_credentials": allow_credentials,
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
if allow_origin_regex:
    cors_kwargs["allow_origin_regex"] = allow_origin_regex

app.add_middleware(CORSMiddleware, **cors_kwargs)

# Register the single main feature router: VibeCheck AI
app.include_router(vibecheck.router)


@app.get("/")
def root():
    return {
        "app": "creatorPulse",
        "feature": "YouTube Comment Sentiment Analysis Using Machine Learning",
        "status": "operational",
        "supported_platforms": ["youtube"],
        "endpoints": [
            "/api/vibecheck/status",
            "/api/vibecheck/supported-platforms",
            "/api/vibecheck/analyze",
            "/api/vibecheck/models",
            "/api/vibecheck/history",
            "/api/health"
        ]
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "creatorPulse - YouTube Comment Sentiment Analysis",
        "supported_platforms": ["youtube"]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)

