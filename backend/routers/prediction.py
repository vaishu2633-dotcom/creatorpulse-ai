"""
CreatorPulse AI - ViralScope Prediction Router
------------------------------------------------
Accepts post attributes and returns calibrated breakout probability,
base rate, low/high range, predicted ER range, confidence rating,
explanations (positive and negative factors), and similar posts.
Supports dynamic retraining on active creator dataset with time-based split.
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
    save_history: Optional[bool] = True

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
        creator_id=req.creator_id,
        save_history=req.save_history if req.save_history is not None else True
    )
    return result

@router.post("/what-if")
def what_if_predict(req: PredictRequest):
    """Instant live What-If scoring that does not persist to prediction history."""
    result = prediction.predict_breakout(
        platform=req.platform,
        post_type=req.post_type,
        title=req.title,
        hashtag_count=req.hashtag_count,
        duration_sec=req.duration_sec,
        post_hour=req.post_hour,
        post_weekday=req.post_weekday,
        strictness=req.strictness,
        creator_id=req.creator_id,
        save_history=False
    )
    return result

@router.post("/retrain")
def retrain_model():
    """
    Retrains a calibrated model on the currently active data source.
    Returns honest baseline fallback if active dataset < 50 posts.
    """
    return prediction.retrain_model_on_active_data()

@router.get("/model-info")
def get_model_info():
    """Returns active model metadata, accuracy/brier metrics, and training provenance."""
    return prediction.get_active_model_info()

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

class RecordOutcomeRequest(BaseModel):
    actual_outcome: bool
    actual_views: Optional[int] = None
    actual_engagement_rate: Optional[float] = None

@router.post("/actual/{prediction_id}")
def record_prediction_outcome(prediction_id: str, req: RecordOutcomeRequest):
    """Records the real published outcome for a prediction."""
    updated = data_access.update_prediction_actual(
        prediction_id=prediction_id,
        actual_outcome=req.actual_outcome,
        actual_views=req.actual_views,
        actual_engagement_rate=req.actual_engagement_rate
    )
    if not updated:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Prediction ID not found")
    return {
        "status": "success",
        "message": "Actual outcome recorded successfully",
        "prediction": updated,
        "scoreboard": data_access.get_accuracy_scoreboard()
    }

@router.post("/sync-youtube-outcomes")
def sync_youtube_outcomes():
    """Automatically matches recent YouTube predictions with published videos to update outcomes."""
    return data_access.sync_youtube_prediction_outcomes()
