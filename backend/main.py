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
    settings
)

app = FastAPI(
    title="CreatorPulse AI API",
    description="Social Media Intelligence & ViralScope Breakout Prediction Engine (Prototype)",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permits all origins during prototype development
    allow_credentials=True,
    allow_methods=["*"],
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
