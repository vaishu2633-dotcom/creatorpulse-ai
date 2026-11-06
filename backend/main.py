"""
CreatorPulse AI - Backend Server
---------------------------------
FastAPI server connecting the Creator Intelligence, ViralScope Prediction,
and ReelGenius Studio modules.

All endpoints adhere to CreatorPulse principles:
- Transparent metadata with data source ("mock data") and last refreshed time
- Probabilistic breakout estimates anchored against baseline creator rates
- Fully modular DAL (services/data_access.py) ready for SQL database swapping
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.services import data_access
from backend.routers import (
    dashboard,
    trends,
    prediction,
    content,
    drafts,
    comments,
    ml_lab,
    settings,
    vibecheck,
    competitors,
    reports
)

app = FastAPI(
    title="CreatorPulse AI API",
    description="Social Media Intelligence & ViralScope Breakout Prediction Engine (Prototype)",
    version="1.0.0"
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

# Register routers
app.include_router(dashboard.router)
app.include_router(trends.router)
app.include_router(prediction.router)
app.include_router(content.router)
app.include_router(drafts.router)
app.include_router(comments.router)
app.include_router(ml_lab.router)
app.include_router(settings.router)
app.include_router(vibecheck.router)
app.include_router(competitors.router)
app.include_router(reports.router)

@app.get("/")
def root():
    return {
        "app": "CreatorPulse AI",
        "status": "operational",
        "metadata": data_access.get_system_metadata(),
        "endpoints": [
            "/api/dashboard/summary",
            "/api/dashboard/snapshots",
            "/api/dashboard/posts",
            "/api/trends",
            "/api/prediction/predict",
            "/api/prediction/history",
            "/api/prediction/scoreboard",
            "/api/content/generate",
            "/api/content/tournament",
            "/api/drafts",
            "/api/comments/summary",
            "/api/ml/results",
            "/api/settings/integrations"
        ]
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "metadata": data_access.get_system_metadata()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
