"""
CreatorPulse AI - Prediction Repository
Handles querying and logging viral predictions, actual outcomes, and calibration scoring.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from ..models import Prediction, SYSTEM_DEMO_WORKSPACE_ID


def _prediction_to_dict(p: Prediction) -> Dict[str, Any]:
    # Start with metadata_json if present to preserve all visual/presentation keys
    data = dict(p.metadata_json) if p.metadata_json else {}
    data["prediction_id"] = p.prediction_id
    data["platform"] = p.platform
    data["post_type"] = p.format_type
    data["title"] = p.content_topic
    data["predicted_prob"] = p.p_success
    data["confidence_low"] = p.confidence_low
    data["confidence_high"] = p.confidence_high
    data["range_low_percent"] = round(p.confidence_low * 100, 1)
    data["range_high_percent"] = round(p.confidence_high * 100, 1)
    data["actual_outcome"] = p.simulated_actual_viral
    data["actual_views"] = p.actual_views
    data["actual_engagement_rate"] = p.actual_engagement_rate
    data["created_at"] = p.created_at.isoformat() if p.created_at else ""
    return data


def get_predictions(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    stmt = (
        select(Prediction)
        .where(Prediction.workspace_id == workspace_id)
        .order_by(desc(Prediction.created_at))
    )

    if platform and platform.lower() != "all":
        stmt = stmt.where(Prediction.platform == platform.lower())

    if limit and limit > 0:
        stmt = stmt.limit(limit)

    preds = session.scalars(stmt).all()
    return [_prediction_to_dict(p) for p in preds]


def save_prediction(
    session: Session,
    workspace_id: uuid.UUID,
    prediction_data: Dict[str, Any],
) -> Dict[str, Any]:
    p_id = prediction_data.get("prediction_id") or f"pred_{uuid.uuid4().hex[:8]}"
    prediction_data["prediction_id"] = p_id

    created_iso = prediction_data.get("created_at") or datetime.now(timezone.utc).isoformat()
    prediction_data["created_at"] = created_iso

    try:
        dt = datetime.fromisoformat(created_iso.replace("Z", "+00:00"))
    except Exception:
        dt = datetime.now(timezone.utc)

    prob = float(prediction_data.get("predicted_prob", 0.5))
    low = float(prediction_data.get("range_low_percent", max(0.0, prob * 100 - 10))) / 100.0
    high = float(prediction_data.get("range_high_percent", min(100.0, prob * 100 + 10))) / 100.0

    actual_out = prediction_data.get("actual_outcome")
    sim_viral = None
    brier = None
    if isinstance(actual_out, bool):
        sim_viral = actual_out
        y_true = 1.0 if sim_viral else 0.0
        brier = round((prob - y_true) ** 2, 4)

    new_pred = Prediction(
        prediction_id=p_id,
        workspace_id=workspace_id,
        platform=prediction_data.get("platform", "general").lower(),
        content_topic=prediction_data.get("title") or "General",
        format_type=prediction_data.get("post_type", "short"),
        p_success=prob,
        confidence_low=low,
        confidence_high=high,
        recommendation=prediction_data.get("strictness_label") or "Analyzed",
        top_features=prediction_data.get("top_reasons") or [],
        simulated_actual_viral=sim_viral,
        actual_views=prediction_data.get("actual_views"),
        actual_engagement_rate=prediction_data.get("actual_engagement_rate"),
        brier_score=brier,
        metadata_json=prediction_data,
        created_at=dt,
    )
    session.add(new_pred)
    session.flush()
    return prediction_data


def update_prediction_actual(
    session: Session,
    workspace_id: uuid.UUID,
    prediction_id: str,
    actual_outcome: bool,
    actual_views: Optional[int] = None,
    actual_engagement_rate: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    pred = session.scalar(
        select(Prediction).where(
            Prediction.workspace_id == workspace_id,
            Prediction.prediction_id == prediction_id,
        )
    )
    if not pred:
        return None

    pred.simulated_actual_viral = bool(actual_outcome)
    y_true = 1.0 if actual_outcome else 0.0
    pred.brier_score = round((pred.p_success - y_true) ** 2, 4)

    if actual_views is not None:
        pred.actual_views = int(actual_views)
    if actual_engagement_rate is not None:
        pred.actual_engagement_rate = float(actual_engagement_rate)

    meta = dict(pred.metadata_json) if pred.metadata_json else {}
    meta["actual_outcome"] = bool(actual_outcome)
    meta["actual_views"] = actual_views
    meta["actual_engagement_rate"] = actual_engagement_rate
    meta["evaluated_at"] = datetime.now(timezone.utc).isoformat()
    pred.metadata_json = meta

    session.flush()
    return _prediction_to_dict(pred)


def get_brier_scoreboard(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
) -> Dict[str, Any]:
    preds = get_predictions(session=session, workspace_id=workspace_id, platform=platform, limit=200)
    evaluated = [p for p in preds if p.get("actual_outcome") is not None]

    if not evaluated:
        return {
            "total_predictions": len(preds),
            "evaluated_count": 0,
            "brier_score": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "calibration_bins": [],
        }

    brier_sum = 0.0
    tp = fp = fn = tn = 0

    bins = [
        {"bin": "0-20%", "min": 0.0, "max": 0.20, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "20-40%", "min": 0.20, "max": 0.40, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "40-60%", "min": 0.40, "max": 0.60, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "60-80%", "min": 0.60, "max": 0.80, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
        {"bin": "80-100%", "min": 0.80, "max": 1.00, "count": 0, "predicted_sum": 0.0, "actual_sum": 0},
    ]

    for p in evaluated:
        prob = p.get("predicted_prob", 0.0)
        actual = 1 if p.get("actual_outcome") else 0
        brier_sum += (prob - actual) ** 2

        pred_label = 1 if prob >= 0.15 else 0
        if pred_label == 1 and actual == 1:
            tp += 1
        elif pred_label == 1 and actual == 0:
            fp += 1
        elif pred_label == 0 and actual == 1:
            fn += 1
        else:
            tn += 1

        for b in bins:
            if b["min"] <= prob <= b["max"] or (b["max"] == 1.0 and prob >= 1.0):
                b["count"] += 1
                b["predicted_sum"] += prob
                b["actual_sum"] += actual
                break

    calibration_bins = []
    for b in bins:
        count = b["count"]
        mean_pred = (b["predicted_sum"] / count) if count > 0 else (b["min"] + b["max"]) / 2
        actual_rate = (b["actual_sum"] / count) if count > 0 else 0.0
        calibration_bins.append({
            "bin": b["bin"],
            "count": count,
            "mean_predicted_prob": round(mean_pred * 100, 1),
            "actual_positive_rate": round(actual_rate * 100, 1),
        })

    eval_count = len(evaluated)
    brier_score = round(brier_sum / max(1, eval_count), 4)
    precision = round(tp / max(1, (tp + fp)), 3)
    recall = round(tp / max(1, (tp + fn)), 3)

    return {
        "total_predictions": len(preds),
        "evaluated_count": eval_count,
        "brier_score": brier_score,
        "precision": precision,
        "recall": recall,
        "calibration_bins": calibration_bins,
    }
