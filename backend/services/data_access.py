"""
CreatorPulse AI - Simple Data Storage
--------------------------------------
Beginner-friendly JSON storage for VibeCheck analysis history.
Saves, loads, and deletes sentiment reports using 'backend/data/vibecheck_reports.json'.

Why JSON storage?
- No complicated database setup or SQL server required.
- Human-readable format that is easy to inspect and debug.
- Perfect for an academic Machine Learning project demonstration.
"""

import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Path to the JSON file where reports are stored
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
REPORTS_FILE = os.path.join(DATA_DIR, "vibecheck_reports.json")


def _read_reports() -> List[Dict[str, Any]]:
    """Reads all saved reports from the JSON file."""
    if not os.path.exists(REPORTS_FILE):
        return []
    try:
        with open(REPORTS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []


def _write_reports(reports: List[Dict[str, Any]]) -> None:
    """Writes the list of reports back to the JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(REPORTS_FILE, "w", encoding="utf-8") as file:
        json.dump(reports, file, indent=2)


def get_vibecheck_history(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns past sentiment analysis reports, newest first."""
    reports = _read_reports()
    return reports[:limit]


# Alias for backward compatibility
get_vibecheck_reports = get_vibecheck_history


def get_vibecheck_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    """Finds a single report by its ID."""
    reports = _read_reports()
    for report in reports:
        if report.get("report_id") == report_id:
            return report
    return None


def save_vibecheck_report(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves a new sentiment analysis report to history.
    Assigns a unique report_id and current timestamp if missing.
    """
    reports = _read_reports()

    # Ensure unique report ID
    if not report_data.get("report_id"):
        report_data["report_id"] = f"vibe_{uuid.uuid4().hex[:8]}"

    # Ensure timestamp is set
    if not report_data.get("created_at"):
        report_data["created_at"] = datetime.now(timezone.utc).isoformat()

    # Insert at the beginning so newest reports appear first
    reports.insert(0, report_data)
    _write_reports(reports)

    return report_data


def delete_vibecheck_report(report_id: str) -> bool:
    """Deletes an analysis report by ID. Returns True if deleted, False if not found."""
    reports = _read_reports()
    initial_count = len(reports)
    updated_reports = [r for r in reports if r.get("report_id") != report_id]

    if len(updated_reports) < initial_count:
        _write_reports(updated_reports)
        return True
    return False
