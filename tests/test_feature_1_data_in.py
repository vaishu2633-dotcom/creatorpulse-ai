"""
CreatorPulse AI - Automated Tests for Feature 1: Data In (Foundation)
---------------------------------------------------------------------
Tests:
1. CSV template download endpoint
2. CSV validation & preview with valid and bad rows
3. CSV import storing in uploaded_posts.json
4. Global data source switching across 'sample' and 'uploaded_csv'
5. Dynamic dashboard numbers reflection based on active source
6. YouTube API key status checking and transparent credential error messages
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services import data_access, youtube_service

client = TestClient(app)

SAMPLE_CSV = (
    "platform,post_type,caption,published_at,views,likes,comments,shares\n"
    "youtube,long_video,Test Video 1,2026-03-01T10:00:00Z,20000,1500,200,50\n"
    "instagram,reel,Test Reel 1,2026-03-02T12:00:00Z,50000,4200,310,800\n"
    "twitter,thread,Test Thread 1,2026-03-03T14:00:00Z,10000,800,90,150\n"
)

BAD_CSV = (
    "platform,post_type,caption,published_at,views,likes,comments,shares\n"
    "youtube,long_video,,2026-03-01T10:00:00Z,20000,1500,200,50\n"  # missing caption
    "instagram,reel,Bad Views Reel,2026-03-02T12:00:00Z,-500,4200,310,800\n"  # negative views
    "twitter,thread,Valid Thread,2026-03-03T14:00:00Z,10000,800,90,150\n"  # valid
)


def test_csv_template_download():
    """Verify downloadable CSV template returns 200 with required column headers."""
    res = client.get("/api/settings/csv/template")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment" in res.headers.get("content-disposition", "")
    content = res.text
    first_line = content.splitlines()[0]
    for col in ["platform", "post_type", "caption", "views", "likes", "comments"]:
        assert col in first_line


def test_csv_preview_and_bad_rows_reporting():
    """Verify preview validates rows and reports bad rows with line numbers and reasons."""
    res = client.post("/api/settings/csv/preview", json={"csv_text": BAD_CSV})
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["total_rows"] == 3
    assert data["valid_count"] == 1
    assert data["bad_count"] == 2
    assert len(data["bad_rows"]) == 2
    reasons = [r["reason"] for r in data["bad_rows"]]
    assert any("Missing post title or caption" in r for r in reasons)
    assert any("Views cannot be negative" in r for r in reasons)


def test_csv_import_and_active_source_switch():
    """Verify importing CSV sets active data source and modifies dashboard numbers."""
    # 1. Reset to sample data
    client.post("/api/settings/data-source", json={"source": "sample"})
    res_sample = client.get("/api/dashboard/summary")
    assert res_sample.status_code == 200
    sample_total = res_sample.json()["total_posts"]
    assert sample_total >= 1000
    assert res_sample.json()["metadata"]["active_source"] == "sample"

    # 2. Import 3 posts
    res_import = client.post(
        "/api/settings/csv/import",
        json={"csv_text": SAMPLE_CSV, "filename": "feature1_test.csv", "set_as_active": True}
    )
    assert res_import.status_code == 200
    import_data = res_import.json()
    assert import_data["success"] is True
    assert import_data["imported_count"] == 3
    assert import_data["active_source"] == "uploaded_csv"

    # 3. Verify dashboard summary reflects exactly 3 posts
    res_csv_dash = client.get("/api/dashboard/summary")
    assert res_csv_dash.status_code == 200
    csv_dash = res_csv_dash.json()
    assert csv_dash["total_posts"] == 3
    assert csv_dash["total_views"] == 20000 + 50000 + 10000  # 80,000
    assert csv_dash["metadata"]["active_source"] == "uploaded_csv"
    assert "Uploaded CSV" in csv_dash["metadata"]["data_source"]

    # 4. Switch back to sample data
    res_switch = client.post("/api/settings/data-source", json={"source": "sample"})
    assert res_switch.status_code == 200
    assert res_switch.json()["active_source"] == "sample"

    res_restored = client.get("/api/dashboard/summary")
    assert res_restored.json()["total_posts"] == sample_total
    assert res_restored.json()["metadata"]["active_source"] == "sample"


def test_youtube_api_status_and_validation():
    """Verify YouTube status endpoint truthfully discloses key availability."""
    res = client.get("/api/settings/youtube/status")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "message" in data

    # Attempt connect without key or invalid channel
    res_connect = client.post("/api/settings/youtube/connect", json={"channel_url": "@nonexistent_12345"})
    # Must fail gracefully with 400 and clear message (missing key or not found)
    assert res_connect.status_code == 400
    detail = res_connect.json()["detail"]
    assert len(detail) > 0


def test_youtube_url_parsing():
    """Verify channel query parser extracts handles and channel IDs correctly."""
    q1 = youtube_service.extract_channel_query("@mkbhd")
    assert q1 == {"forHandle": "@mkbhd"}

    q2 = youtube_service.extract_channel_query("https://www.youtube.com/@veritasium")
    assert q2 == {"forHandle": "@veritasium"}

    q3 = youtube_service.extract_channel_query("https://www.youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ")
    assert q3 == {"id": "UCBJycsmduvYEL83R_U4JriQ"}
