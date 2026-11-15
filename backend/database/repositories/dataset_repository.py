"""
CreatorPulse AI - Dataset & Configuration Repository
Handles datasets, versions, user preferences, and trends persistence.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, joinedload

from ..models import (
    Dataset,
    DatasetVersion,
    UserPreference,
    SYSTEM_DEMO_WORKSPACE_ID,
    SYSTEM_DEMO_USER_ID,
)


def get_datasets(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
) -> List[Dict[str, Any]]:
    stmt = (
        select(Dataset)
        .options(joinedload(Dataset.versions))
        .where(Dataset.workspace_id == workspace_id)
        .order_by(desc(Dataset.created_at))
    )
    datasets = session.scalars(stmt).unique().all()
    result = []
    for d in datasets:
        versions = [
            {
                "version_number": v.version_number,
                "row_count": v.row_count,
                "created_at": v.created_at.isoformat() if v.created_at else "",
                "metadata": v.metadata_json,
            }
            for v in d.versions
        ]
        result.append({
            "id": str(d.id),
            "name": d.name,
            "source_type": d.source_type,
            "description": d.description,
            "row_count": d.row_count,
            "bad_rows_count": d.bad_rows_count,
            "is_synthetic": d.is_synthetic,
            "created_at": d.created_at.isoformat() if d.created_at else "",
            "versions": versions,
        })
    return result


def save_uploaded_dataset(
    session: Session,
    workspace_id: uuid.UUID,
    name: str,
    filename: str,
    row_count: int,
    bad_rows_count: int = 0,
    metadata_json: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    dataset = session.scalar(
        select(Dataset).where(Dataset.workspace_id == workspace_id, Dataset.name == name)
    )
    if not dataset:
        dataset = Dataset(
            workspace_id=workspace_id,
            name=name,
            source_type="uploaded_csv",
            description=f"User-uploaded CSV: {filename}",
            row_count=row_count,
            bad_rows_count=bad_rows_count,
            is_synthetic=False,
        )
        session.add(dataset)
        session.flush()

        v1 = DatasetVersion(
            dataset_id=dataset.id,
            version_number=1,
            row_count=row_count,
            metadata_json=metadata_json or {"filename": filename},
        )
        session.add(v1)
    else:
        dataset.row_count = row_count
        dataset.bad_rows_count = bad_rows_count
        dataset.updated_at = datetime.now(timezone.utc)

        max_ver = max([v.version_number for v in dataset.versions] or [0])
        next_ver = DatasetVersion(
            dataset_id=dataset.id,
            version_number=max_ver + 1,
            row_count=row_count,
            metadata_json=metadata_json or {"filename": filename},
        )
        session.add(next_ver)

    session.flush()
    return {
        "dataset_id": str(dataset.id),
        "name": dataset.name,
        "row_count": dataset.row_count,
        "bad_rows_count": dataset.bad_rows_count,
    }


def get_user_preferences(
    session: Session,
    user_id: uuid.UUID = SYSTEM_DEMO_USER_ID,
) -> Dict[str, Any]:
    pref = session.scalar(select(UserPreference).where(UserPreference.user_id == user_id))
    if not pref:
        return {"active_data_source": "sample", "theme": "dark", "notifications_enabled": True}
    return {
        "active_data_source": pref.active_data_source,
        "theme": pref.theme,
        "notifications_enabled": pref.notifications_enabled,
        "metadata": pref.metadata_json or {},
    }


def save_user_preferences(
    session: Session,
    user_id: uuid.UUID,
    active_source: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    pref = session.scalar(select(UserPreference).where(UserPreference.user_id == user_id))
    if not pref:
        pref = UserPreference(
            user_id=user_id,
            active_data_source=active_source or "sample",
            metadata_json=metadata_json or {},
        )
        session.add(pref)
    else:
        if active_source:
            pref.active_data_source = active_source
        if metadata_json is not None:
            pref.metadata_json = metadata_json
        pref.updated_at = datetime.now(timezone.utc)

    session.flush()
    return {
        "active_data_source": pref.active_data_source,
        "metadata": pref.metadata_json,
    }


def get_trends(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
) -> List[Dict[str, Any]]:
    # Look for dataset version holding trends
    dataset = session.scalar(
        select(Dataset).where(Dataset.workspace_id == workspace_id, Dataset.name == "Creator Benchmark 2026")
    )
    if dataset and dataset.versions:
        meta = dataset.versions[0].metadata_json or {}
        trends = meta.get("trends")
        if isinstance(trends, list):
            return trends
    return []
