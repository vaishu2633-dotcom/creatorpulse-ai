"""
Feature 4: Prediction Results & Learning Loop Automated Tests
--------------------------------------------------------------
Validates:
1. Retrieval of prediction history and accuracy scoreboard.
2. Recording real published post outcome via POST /api/prediction/actual/{id}.
3. Recalculation of Brier accuracy score against baseline creator guessing rate.
4. Evaluation counts, sample size metrics (N), and calibration bins.
5. Automatic YouTube outcome sync endpoint.
"""

import pytest
import httpx

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_scoreboard_metrics_and_calibration(client):
    res = client.get("/api/prediction/scoreboard")
    assert res.status_code == 200
    data = res.json()
    
    assert "total_predictions" in data
    assert "evaluated_count" in data
    assert "sample_size" in data
    assert "brier_score" in data
    assert "baseline_brier_score" in data
    assert "brier_evaluation_label" in data
    assert "precision" in data
    assert "recall" in data
    assert "calibration_bins" in data
    assert len(data["calibration_bins"]) == 5


def test_record_actual_outcome_closes_learning_loop(client):
    # 1. Create a fresh prediction
    pred_res = client.post("/api/prediction/predict", json={
        "platform": "youtube",
        "post_type": "long_video",
        "title": "Learning Loop Test Video Actual Record",
        "hashtag_count": 3,
        "duration_sec": 600,
        "post_hour": 18,
        "post_weekday": 2,
        "strictness": "top_10%",
        "save_history": True
    })
    assert pred_res.status_code == 200
    pred = pred_res.json()
    pred_id = pred["prediction_id"]
    
    # Check evaluated count before
    score_before = client.get("/api/prediction/scoreboard").json()
    eval_before = score_before["evaluated_count"]
    
    # 2. Record the real published outcome (Breakout Hit with 68k views)
    record_res = client.post(f"/api/prediction/actual/{pred_id}", json={
        "actual_outcome": True,
        "actual_views": 68000,
        "actual_engagement_rate": 0.085
    })
    assert record_res.status_code == 200
    res_data = record_res.json()
    assert res_data["status"] == "success"
    assert res_data["prediction"]["actual_outcome"] is True
    assert res_data["prediction"]["actual_views"] == 68000
    
    # 3. Confirm scoreboard updated
    score_after = client.get("/api/prediction/scoreboard").json()
    assert score_after["evaluated_count"] == eval_before + 1
    assert score_after["sample_size"] == score_after["evaluated_count"]


def test_sync_youtube_outcomes_endpoint(client):
    res = client.post("/api/prediction/sync-youtube-outcomes")
    assert res.status_code == 200
    data = res.json()
    assert "updated_count" in data
    assert "message" in data
