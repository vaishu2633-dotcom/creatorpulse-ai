"""
CreatorPulse AI - Automated Tests for Feature 2: Dashboard
----------------------------------------------------------
Tests:
1. Comparing dashboard summary totals against imported CSV data calculated via Python script
2. Date range filtering (days parameter) dynamically altering totals
3. Platform filtering dynamically altering totals
4. Top posts and bottom posts endpoints returning calibrated engagement rate sorting
5. Sparklines generation and presence in summary
"""

import pytest
import httpx

DASHBOARD_TEST_CSV = (
    "platform,post_type,caption,published_at,views,likes,comments,shares\n"
    "youtube,long_video,Video Alpha,2026-03-25T10:00:00Z,40000,4000,200,100\n"  # eng: 4300, er: 0.1075 (hit)
    "youtube,short,Short Beta,2026-03-20T12:00:00Z,10000,300,20,10\n"            # eng: 330, er: 0.033
    "instagram,reel,Reel Gamma,2026-03-10T14:00:00Z,20000,1800,100,200\n"        # eng: 2100, er: 0.105 (hit)
    "instagram,post,Post Delta,2026-02-01T16:00:00Z,5000,100,10,0\n"             # eng: 110, er: 0.022 (older than 30d)
    "twitter,thread,Thread Epsilon,2026-03-26T08:00:00Z,15000,900,60,40\n"       # eng: 1000, er: 0.0667 (hit)
)


@pytest.fixture(scope="module")
def api_client():
    try:
        c = httpx.Client(base_url="http://127.0.0.1:8000", timeout=10.0)
        res = c.get("/api/health")
        if res.status_code == 200:
            yield c
            c.close()
            return
    except Exception:
        pass

    from fastapi.testclient import TestClient
    from backend.main import app
    with TestClient(app) as tc:
        yield tc


def test_dashboard_totals_match_csv_script(api_client):
    """Verify script calculations on raw CSV exactly match API dashboard summary."""
    # 1. Import CSV
    res_import = api_client.post(
        "/api/settings/csv/import",
        json={"csv_text": DASHBOARD_TEST_CSV, "filename": "dashboard_test.csv", "set_as_active": True}
    )
    assert res_import.status_code == 200

    # 2. Compute expected values directly from script math
    expected_views = 40000 + 10000 + 20000 + 5000 + 15000  # 90,000
    expected_engagements = 4300 + 330 + 2100 + 110 + 1000   # 7,840
    expected_avg_er = round(expected_engagements / expected_views, 4)  # 0.0871
    expected_total_posts = 5
    # Hits: Alpha (0.1075), Gamma (0.105), Epsilon (0.0667) -> 3 hits
    expected_breakout_count = 3
    expected_breakout_rate = round(3 / 5, 4)

    # 3. Call Dashboard API
    res_dash = api_client.get("/api/dashboard/summary")
    assert res_dash.status_code == 200
    dash = res_dash.json()

    assert dash["total_views"] == expected_views
    assert dash["total_engagements"] == expected_engagements
    assert dash["total_posts"] == expected_total_posts
    assert dash["average_engagement_rate"] == expected_avg_er
    assert dash["breakout_count"] == expected_breakout_count
    assert dash["breakout_rate"] == expected_breakout_rate
    assert "sparklines" in dash
    assert "views" in dash["sparklines"]


def test_dashboard_platform_filter(api_client):
    """Verify platform filter alters metrics to match only that platform."""
    # YouTube posts: Alpha (40k views, 4300 eng) + Beta (10k views, 330 eng)
    res_yt = api_client.get("/api/dashboard/summary?platform=youtube")
    assert res_yt.status_code == 200
    yt = res_yt.json()
    assert yt["total_posts"] == 2
    assert yt["total_views"] == 50000
    assert yt["total_engagements"] == 4630

    # Instagram posts: Gamma (20k) + Delta (5k) = 25k views
    res_ig = api_client.get("/api/dashboard/summary?platform=instagram")
    assert res_ig.status_code == 200
    ig = res_ig.json()
    assert ig["total_posts"] == 2
    assert ig["total_views"] == 25000
    assert ig["total_engagements"] == 2210


def test_dashboard_date_filter(api_client):
    """Verify days parameter excludes older posts and recalculates totals."""
    # With anchor at 2026-03-26:
    # 7 days covers posts from March 19 to 26 (Alpha, Beta, Epsilon = 3 posts, excludes Gamma March 10 and Delta Feb 01)
    res_7d = api_client.get("/api/dashboard/summary?days=7")
    assert res_7d.status_code == 200
    d7 = res_7d.json()
    assert d7["total_posts"] == 3
    assert d7["total_views"] == 40000 + 10000 + 15000  # 65,000

    # 30 days covers posts from Feb 24 to March 26 (Alpha, Beta, Gamma, Epsilon = 4 posts, excludes Delta Feb 01)
    res_30d = api_client.get("/api/dashboard/summary?days=30")
    assert res_30d.status_code == 200
    d30 = res_30d.json()
    assert d30["total_posts"] == 4
    assert d30["total_views"] == 40000 + 10000 + 20000 + 15000  # 85,000


def test_top_and_bottom_posts(api_client):
    """Verify top-posts and bottom-posts endpoints sort strictly by engagement rate."""
    res_top = api_client.get("/api/dashboard/top-posts?limit=3")
    assert res_top.status_code == 200
    top = res_top.json()["posts"]
    assert len(top) == 3
    # First post must have highest engagement rate
    assert top[0]["engagement_rate"] >= top[1]["engagement_rate"] >= top[2]["engagement_rate"]
    assert top[0]["caption"] == "Video Alpha"  # 10.75% ER

    res_bottom = api_client.get("/api/dashboard/bottom-posts?limit=2")
    assert res_bottom.status_code == 200
    bottom = res_bottom.json()["posts"]
    assert len(bottom) == 2
    # First post must have lowest engagement rate
    assert bottom[0]["engagement_rate"] <= bottom[1]["engagement_rate"]
    assert bottom[0]["caption"] == "Post Delta"  # 2.2% ER

    # Cleanup: restore to sample
    api_client.post("/api/settings/data-source", json={"source": "sample"})
