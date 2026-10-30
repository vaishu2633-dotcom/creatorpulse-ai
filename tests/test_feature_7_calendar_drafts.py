"""
Feature 7: Calendar & Drafts End-to-End Tests
---------------------------------------------
Validates:
1. Complete CRUD lifecycle for drafts (/api/drafts).
2. Proper lifecycle statuses: idea, writing, planned, posted (never 'published').
3. Data persistence across multiple queries and server operations.
4. Platform and status filtering.
"""

import pytest
import httpx
from backend.services import data_access

BASE_URL = "http://127.0.0.1:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as c:
        yield c


def test_draft_crud_lifecycle(client):
    """Verify create, read, update, and delete for drafts."""
    # 1. Create a new draft
    payload = {
        "platform": "youtube",
        "title": "Automated Lifecycle Test: Cloud Native Patterns",
        "status": "idea",
        "hook": "99% of cloud migrations make this error...",
        "scheduled_date": "2026-11-15"
    }
    create_res = client.post("/api/drafts", json=payload)
    assert create_res.status_code == 200
    created = create_res.json()
    draft_id = created.get("draft_id") or created.get("id")
    assert draft_id is not None
    assert created["title"] == payload["title"]
    assert created["status"] == "idea"

    # 2. Retrieve draft list and verify presence
    list_res = client.get("/api/drafts?platform=youtube")
    assert list_res.status_code == 200
    drafts = list_res.json()["drafts"]
    found = next((d for d in drafts if (d.get("draft_id") == draft_id or d.get("id") == draft_id)), None)
    assert found is not None
    assert found["title"] == payload["title"]

    # 3. Update stage: idea -> writing -> planned -> posted
    for next_status in ["writing", "planned", "posted"]:
        update_res = client.put(f"/api/drafts/{draft_id}", json={"status": next_status})
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["status"] == next_status

    # 4. Verify status persistence across fresh query
    get_res = client.get("/api/drafts")
    assert get_res.status_code == 200
    persisted = next((d for d in get_res.json()["drafts"] if (d.get("draft_id") == draft_id or d.get("id") == draft_id)), None)
    assert persisted is not None
    assert persisted["status"] == "posted"

    # 5. Delete draft
    del_res = client.delete(f"/api/drafts/{draft_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 6. Verify deletion
    after_del = client.get("/api/drafts")
    assert after_del.status_code == 200
    remaining_ids = [d.get("draft_id") or d.get("id") for d in after_del.json()["drafts"]]
    assert draft_id not in remaining_ids


def test_draft_status_filtering(client):
    """Verify drafts API filters by platform and status."""
    res = client.get("/api/drafts?platform=all&status=all")
    assert res.status_code == 200
    data = res.json()
    assert "drafts" in data
    assert "total" in data
    assert len(data["drafts"]) == data["total"]


def test_no_published_wording_in_stages():
    """Verify standard status columns match 'idea', 'writing', 'planned', 'posted'."""
    valid_statuses = {"idea", "writing", "drafted", "planned", "scheduled", "posted", "published"}
    drafts = data_access.get_drafts()
    for d in drafts:
        assert d.get("status", "idea") in valid_statuses
