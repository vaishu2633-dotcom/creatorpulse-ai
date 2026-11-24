"""
CreatorPulse AI - VibeCheck AI Server
-------------------------------------
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
    title="CreatorPulse AI - YouTube Comment Sentiment Analysis",
    description="ML-Based YouTube Comment Sentiment Analysis System using Traditional Machine Learning",
    version="2.1.0"
)

# Configure CORS: Allow local development origins and configurable production domains
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env.strip():
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register the single main feature router: VibeCheck AI
app.include_router(vibecheck.router)


@app.get("/")
def root():
    return {
        "app": "CreatorPulse AI",
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
        "service": "CreatorPulse AI - YouTube Comment Sentiment Analysis",
        "supported_platforms": ["youtube"]
    }
