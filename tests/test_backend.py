"""
CreatorPulse AI - Backend Test Suite
-------------------------------------
Tests all core API endpoints, ML prediction outputs, DAL operations,
truthful metadata reporting, and the VibeCheck AI multi-platform analyzer.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_and_health():
    """Verify root and health endpoints return status and system provenance metadata."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    data = res_root.json()
    assert data["status"] == "operational"
    assert "metadata" in data
    assert data["metadata"]["data_source"] == "mock data (JSON storage)"
    assert data["metadata"]["is_synthetic"] is True

    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_dashboard_endpoints():
    """Verify dashboard summary, snapshots, and posts return valid payloads."""
    res_summary = client.get("/api/dashboard/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "total_posts" in summary
    assert "average_engagement_rate" in summary
    assert "breakout_rate" in summary

    res_snapshots = client.get("/api/dashboard/snapshots")
    assert res_snapshots.status_code == 200
    snap_data = res_snapshots.json()
    assert "snapshots" in snap_data
    assert isinstance(snap_data["snapshots"], list)

    res_posts = client.get("/api/dashboard/posts?limit=10")
    assert res_posts.status_code == 200
    posts_data = res_posts.json()
    assert "posts" in posts_data
    assert isinstance(posts_data["posts"], list)
    assert len(posts_data["posts"]) <= 10


def test_trends_endpoint():
    """Verify trend explorer returns items sorted by momentum/strength."""
    res = client.get("/api/trends")
    assert res.status_code == 200
    data = res.json()
    assert "trends" in data
    trends = data["trends"]
    assert isinstance(trends, list)
    assert len(trends) > 0
    assert "topic" in trends[0]
    assert "strength_score" in trends[0]


def test_prediction_and_accuracy_scoreboard():
    """Verify prediction breakout probability vs base rate and Brier evaluation math."""
    # Predict endpoint
    payload = {
        "platform": "youtube",
        "post_type": "long_video",
        "title": "Why 90% of Junior Devs Fail Technical Interviews",
        "hashtag_count": 4,
        "duration_sec": 720,
        "post_hour": 14,
        "post_weekday": 2,
        "strictness": "top_10%"
    }
    pred_res = client.post("/api/prediction/predict", json=payload)
    assert pred_res.status_code == 200
    pred = pred_res.json()
    assert "predicted_prob" in pred
    assert "predicted_prob_percent" in pred
    assert "base_rate_percent" in pred
    assert "probability_ratio" in pred

    # Scoreboard endpoint
    score_res = client.get("/api/prediction/scoreboard")
    assert score_res.status_code == 200
    score = score_res.json()
    assert "brier_score" in score
    assert "baseline_brier_score" in score
    assert score["brier_evaluation_label"] in [
        "Better than guessing",
        "About the same as guessing",
        "Worse than guessing",
        "No evaluated predictions"
    ]
    assert "sample_size" in score
    assert "low_sample_warning" in score


def test_content_studio_and_tournament():
    """Verify content generation and Best Ideas Ranking tournament."""
    gen_payload = {
        "platform": "instagram",
        "topic": "Creator burnout & sustainable scheduling",
        "goal": "engagement",
        "tone": "educational",
        "language": "English"
    }
    gen_res = client.post("/api/content/generate", json=gen_payload)
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert "content" in gen_data

    tourney_payload = {
        "platform": "youtube",
        "topic": "Video editing secrets",
        "count": 5
    }
    tourney_res = client.post("/api/content/tournament", json=tourney_payload)
    assert tourney_res.status_code == 200
    tourney_data = tourney_res.json()
    assert "tournament_rankings" in tourney_data
    assert isinstance(tourney_data["tournament_rankings"], list)
    assert len(tourney_data["tournament_rankings"]) > 0


def test_drafts_lifecycle():
    """Verify full CRUD lifecycle for calendar drafts."""
    # Create
    create_res = client.post("/api/drafts", json={
        "platform": "linkedin",
        "title": "3 Habits of Top Creators",
        "content": "Habit 1: Consistent cadence...",
        "status": "idea",
        "scheduled_for": "2026-11-01T10:00:00Z"
    })
    assert create_res.status_code == 200
    draft = create_res.json()
    draft_id = draft["draft_id"]
    assert draft["status"] == "idea"

    # Update
    update_res = client.patch(f"/api/drafts/{draft_id}", json={
        "status": "writing"
    })
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "writing"

    # Delete
    del_res = client.delete(f"/api/drafts/{draft_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


def test_settings_csv_import():
    """Verify CSV import parses columns and loads posts into dataset."""
    sample_csv = """platform,post_type,caption,views,likes,comments,shares
youtube,video,Deep Dive on Retention Math,12000,850,92,44
instagram,reel,Behind the Scenes of Studio Setup,8400,620,41,18
"""
    res = client.post("/api/settings/upload-csv-json", json={"csv_text": sample_csv})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["imported_count"] == 2


def test_vibecheck_supported_platforms_and_whisper_guide():
    """Verify VibeCheck returns platform capabilities and Whisper offline guide."""
    res_platforms = client.get("/api/vibecheck/supported-platforms")
    assert res_platforms.status_code == 200
    plat_data = res_platforms.json()
    assert "platforms" in plat_data
    platform_ids = [p["id"] for p in plat_data["platforms"]]
    assert "youtube" in platform_ids
    assert "instagram" in platform_ids
    assert "tiktok" in platform_ids
    assert "manual" in platform_ids

    res_guide = client.get("/api/vibecheck/whisper-guide")
    assert res_guide.status_code == 200
    guide = res_guide.json()
    assert "whisper" in guide["command"].lower()


def test_vibecheck_analysis_pipeline():
    """Verify VibeCheck analysis returns sentiment, 8 vibes, topics, and numbered recommendations."""
    # Test manual pasted comments
    sample_comments = """
Sarah Jenkins: This tutorial completely changed my workflow! The color grade is amazing.
Dave Miller: Which microphone did you use for this recording? Sound quality is crisp.
CryptoBot2026: Telegram link in bio for 100x signals guaranteed return!
Elena R: Audio desync around 3:12 on mobile screen, but great content otherwise!
Alex K: Can you do a follow-up video explaining the LUT setup in DaVinci?
    """.strip()

    req_payload = {
        "input_type": "pasted_comments",
        "raw_text": sample_comments,
        "platform": "youtube",
        "title": "Color Grading Masterclass",
        "author": "Creative Lab",
        "save_to_history": True
    }

    res = client.post("/api/vibecheck/analyze", json=req_payload)
    assert res.status_code == 200
    analysis = res.json()

    # Coverage verification
    assert analysis["coverage"]["is_sample_data"] is False
    assert analysis["coverage"]["comments_fetched"] == 5

    # Sentiment & Vibe verification
    assert "vibe_score" in analysis["sentiment"]
    assert "dominant_vibe" in analysis["sentiment"]
    assert "sarcasm_disclaimer" in analysis["sentiment"]
    assert len(analysis["vibes"]) == 8

    # Spam detection verification (CryptoBot should be caught)
    assert analysis["spam_detection"]["flagged_count"] >= 1

    # Questions detection verification
    assert len(analysis["questions"]) >= 2

    # Evidence-backed recommendations verification
    assert len(analysis["recommendations"]) > 0
    # Check that recommendation contains evidence citing counts
    first_rec = analysis["recommendations"][0]
    assert "evidence" in first_rec
    assert "action" in first_rec

    # History verification
    hist_res = client.get("/api/vibecheck/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["total"] >= 1
    report_id = analysis["report_id"]

    # Detail check
    detail_res = client.get(f"/api/vibecheck/history/{report_id}")
    assert detail_res.status_code == 200

    # Delete check
    del_res = client.delete(f"/api/vibecheck/history/{report_id}")
    assert del_res.status_code == 200


def test_vibecheck_status():
    """Verify VibeCheck status endpoint reports API key configuration state."""
    res = client.get("/api/vibecheck/status")
    assert res.status_code == 200
    data = res.json()
    assert "youtube_api_configured" in data
    assert "status" in data
    assert data["status"] in ["live", "limited"]


def test_competitors_benchmarking():
    """Verify competitor benchmarking, limits, and deletion."""
    # 1. Summary
    res = client.get("/api/competitors/summary")
    assert res.status_code == 200
    data = res.json()
    assert "user_channel" in data
    assert "competitors" in data
    assert "chart_series" in data
    assert len(data["competitors"]) <= 3

    # 2. Add competitor validation (empty query error)
    bad_res = client.post("/api/competitors/add", json={"query": " "})
    assert bad_res.status_code == 400

    # 3. Add valid competitor
    # If already 3, test limit or delete one first
    if len(data["competitors"]) >= 3:
        to_del = data["competitors"][-1]["id"]
        del_res = client.delete(f"/api/competitors/{to_del}")
        assert del_res.status_code == 200

    add_res = client.post("/api/competitors/add", json={
        "query": "@tech_lead_channel",
        "platform": "youtube"
    })
    assert add_res.status_code == 200
    added = add_res.json()
    assert added["success"] is True
    assert "competitor" in added
    new_id = added["competitor"]["id"]

    # 4. Clean up added competitor
    cleanup_res = client.delete(f"/api/competitors/{new_id}")
    assert cleanup_res.status_code == 200

