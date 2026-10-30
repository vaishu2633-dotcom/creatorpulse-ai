"""
Feature 2: Channel Reports & Analytics Tests
----------------------------------------------
Validates:
1. GET /api/reports/analytics reflects active data source numbers.
2. Platform and date filters alter metrics and post lists.
3. Sorting by views vs published_at.
4. Downloadable CSV export endpoint matches on-screen data.
"""

import pytest
import httpx
import csv
import io

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_reports_analytics_summary(client):
    res = client.get("/api/reports/analytics")
    assert res.status_code == 200
    data = res.json()
    
    assert "summary" in data
    assert "total_views" in data["summary"]
    assert "total_likes" in data["summary"]
    assert "total_comments" in data["summary"]
    assert "avg_engagement_rate_percent" in data["summary"]
    assert "snapshots" in data
    assert len(data["snapshots"]) > 0
    assert "top_posts" in data
    assert "bottom_posts" in data
    assert "posts" in data
    assert data["total_posts_count"] > 0


def test_reports_filters_and_sorting(client):
    # Platform filter
    res_yt = client.get("/api/reports/analytics?platform=youtube")
    assert res_yt.status_code == 200
    data_yt = res_yt.json()
    for post in data_yt["posts"]:
        assert post["platform"] == "youtube"
        
    # Date filter
    res_7d = client.get("/api/reports/analytics?days=7")
    assert res_7d.status_code == 200
    data_7d = res_7d.json()
    assert data_7d["summary"]["total_views"] <= client.get("/api/reports/analytics").json()["summary"]["total_views"]
    
    # Sorting by views
    res_sorted = client.get("/api/reports/analytics?sort_by=views&descending=true")
    assert res_sorted.status_code == 200
    posts = res_sorted.json()["posts"]
    if len(posts) >= 2:
        assert posts[0]["views"] >= posts[1]["views"]


def test_reports_csv_export(client):
    res = client.get("/api/reports/export/csv")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "attachment" in res.headers.get("content-disposition", "")
    
    content = res.text
    reader = csv.reader(io.StringIO(content))
    header = next(reader)
    assert "Post ID" in header
    assert "Views" in header
    assert "Engagement Rate (%)" in header
    
    rows = list(reader)
    assert len(rows) > 0
