"""
CreatorPulse AI - VibeCheck AI Server
-------------------------------------
FastAPI application for ML-Based Social Media Sentiment Analysis (VibeCheck AI).
Supports YouTube and X (Twitter) using official platform APIs and traditional
Machine Learning models (Logistic Regression, Multinomial Naive Bayes, Linear SVM).
"""

import os
from dotenv import load_dotenv

# Ensure environment configuration from backend/.env and root .env is loaded
_backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
_root_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(_backend_env):
    load_dotenv(_backend_env)
if os.path.exists(_root_env):
    load_dotenv(_root_env)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import vibecheck

app = FastAPI(
    title="CreatorPulse AI - VibeCheck AI",
    description="ML-Based Social Media Sentiment Analysis System for YouTube and X (Twitter)",
    version="2.0.0"
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
        "feature": "VibeCheck AI – Social Media Sentiment Analysis",
        "status": "operational",
        "supported_platforms": ["youtube", "twitter"],
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
        "service": "CreatorPulse AI - VibeCheck AI",
        "supported_platforms": ["youtube", "twitter"]
    }
