"""
CreatorPulse AI - ViralScope Prediction Router
------------------------------------------------
Accepts post attributes and returns calibrated breakout probability,
base rate, low/high range, confidence rating, explanations, and similar posts.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional
from backend.services import prediction, data_access

router = APIRouter(prefix="/api/prediction", tags=["Prediction"])

class PredictRequest(BaseModel):
    platform: str = Field(..., example="youtube")
    post_type: str = Field(..., example="long_video")
    title: str = Field(..., example="Why 90% of Junior Devs Fail Technical Interviews")
    hashtag_count: int = Field(3, ge=0, le=50)
    duration_sec: int = Field(0, ge=0)
    post_hour: int = Field(14, ge=0, le=23)
    post_weekday: int = Field(2, ge=0, le=6)
    strictness: str = Field("top_10%", example="top_10%")
    creator_id: Optional[str] = None

@router.post("/predict")
def predict_post(req: PredictRequest):
    result = prediction.predict_breakout(
        platform=req.platform,
        post_type=req.post_type,
        title=req.title,
        hashtag_count=req.hashtag_count,
        duration_sec=req.duration_sec,
        post_hour=req.post_hour,
        post_weekday=req.post_weekday,
        strictness=req.strictness,
        creator_id=req.creator_id
    )
    return result

@router.get("/history")
def get_prediction_history(platform: Optional[str] = Query("all"), limit: int = Query(50)):
    predictions = data_access.get_predictions(platform=platform, limit=limit)
    return {
        "metadata": data_access.get_system_metadata(),
        "total": len(predictions),
        "history": predictions
    }

@router.get("/scoreboard")
def get_accuracy_scoreboard(platform: Optional[str] = Query("all")):
    return data_access.get_accuracy_scoreboard(platform=platform)
