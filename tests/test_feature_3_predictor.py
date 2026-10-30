"""
Feature 3: Post Predictor End-to-End Tests
--------------------------------------------
Validates:
1. Model provenance & metadata endpoint (GET /api/prediction/model-info).
2. Prediction calculation with calibrated probability, predicted ER range,
   realistic uncertainty range, and 3 specific model-derived reasons (positive/negative).
3. Instant What-If scoring (POST /api/prediction/what-if) without history pollution.
4. Honest threshold handling when dataset < 50 posts (retrain with insufficient data).
5. Dynamic model retraining on active dataset >= 50 posts with time-based 80/20 split.
"""

import pytest
import httpx
from backend.services import data_access, prediction

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_get_model_info(client):
    res = client.get("/api/prediction/model-info")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["working_status"] in ["Working now", "Uses sample data"]
    assert "brier_score" in data
    assert "pr_auc" in data
    assert "method" in data


def test_predict_post_calibrated_output(client):
    test_title = "Automated Test How to Build Full Stack Apps in 2026?"
    payload = {
        "platform": "youtube",
        "post_type": "long_video",
        "title": test_title,
        "hashtag_count": 3,
        "duration_sec": 600,
        "post_hour": 18,
        "post_weekday": 2,
        "strictness": "top_10%",
        "save_history": True
    }
    
    res = client.post("/api/prediction/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    
    # 1. Calibrated probability & base rate
    assert "predicted_prob_percent" in data
    assert "base_rate_percent" in data
    assert "probability_ratio" in data
    assert 0.0 <= data["predicted_prob_percent"] <= 100.0
    
    # 2. Predicted ER range & uncertainty bounds
    assert "predicted_er_range" in data
    assert "predicted_er_low" in data
    assert "predicted_er_high" in data
    assert data["predicted_er_low"] <= data["predicted_er_high"]
    assert "range_display" in data
    
    # 3. Top 3 model-derived reasons with attribution indicators
    assert "top_reasons" in data
    assert len(data["top_reasons"]) == 3
    assert any(r.startswith("+") or r.startswith("-") for r in data["top_reasons"])
    
    # 4. History persistence: latest prediction in history should match our test title
    hist_res = client.get("/api/prediction/history?limit=10").json()
    assert len(hist_res["history"]) > 0
    assert hist_res["history"][0]["title"] == test_title


def test_what_if_scoring_does_not_pollute_history(client):
    payload = {
        "platform": "youtube",
        "post_type": "long_video",
        "title": "What-If Simulator Temporary Slide Test Hook",
        "hashtag_count": 5,
        "duration_sec": 300,
        "post_hour": 12,
        "post_weekday": 4,
        "strictness": "top_10%"
    }
    
    res = client.post("/api/prediction/what-if", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "predicted_prob_percent" in data
    assert "predicted_er_range" in data
    
    # Verify What-If didn't insert as latest history record
    hist_res = client.get("/api/prediction/history?limit=5").json()
    assert hist_res["history"][0]["title"] != "What-If Simulator Temporary Slide Test Hook"


def test_timing_differential_impact(client):
    # Peak hour (18:00) vs Off-peak hour (03:00)
    peak_payload = {
        "platform": "youtube",
        "post_type": "long_video",
        "title": "Tech Career Secrets Revealed",
        "hashtag_count": 2,
        "duration_sec": 600,
        "post_hour": 18,
        "post_weekday": 2,
        "strictness": "top_10%",
        "save_history": False
    }
    offpeak_payload = {
        **peak_payload,
        "post_hour": 3
    }
    
    peak_res = client.post("/api/prediction/what-if", json=peak_payload).json()
    offpeak_res = client.post("/api/prediction/what-if", json=offpeak_payload).json()
    
    # Peak release should have equal or higher probability and positive timing explanation
    assert peak_res["predicted_prob_percent"] >= offpeak_res["predicted_prob_percent"]
    assert any("Peak" in r or "Steady" in r for r in peak_res["top_reasons"])
    assert any("Off-peak" in r for r in offpeak_res["top_reasons"])


def test_retrain_insufficient_data_honest_fallback_unit(monkeypatch):
    # Test unit level: if posts < 50, refuses to fake training and returns clear notice
    def mock_get_posts(*args, **kwargs):
        return [
            {"post_id": f"p_{i}", "title": f"Post {i}", "views": 1000, "engagement_rate": 0.05}
            for i in range(25)
        ]
        
    monkeypatch.setattr(data_access, "get_posts", mock_get_posts)
    
    result = prediction.retrain_model_on_active_data()
    assert result["status"] == "insufficient_data"
    assert "Need at least 50 posts" in result["message"]
    assert result["posts_count"] == 25
    assert result["min_required"] == 50
    assert result["model_type"] == "baseline"


def test_retrain_on_active_dataset(client):
    # Active dataset has 1,800 posts in posts.json
    res = client.post("/api/prediction/retrain")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["model_type"] == "retrained_personal"
    assert data["posts_count"] >= 50
    assert "brier_score" in data["metrics"]
    assert "pr_auc" in data["metrics"]
    
    # Verify model info endpoint now shows retrained status
    info = client.get("/api/prediction/model-info").json()
    assert info["model_type"] == "retrained_personal"
    assert info["working_status"] == "Working now"
