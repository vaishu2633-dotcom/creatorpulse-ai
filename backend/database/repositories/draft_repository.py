"""
CreatorPulse AI - Draft & Calendar Repository
Handles persistence and retrieval of content studio drafts and scheduling calendar.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, joinedload

from ..models import ContentDraft, ContentCalendar, SYSTEM_DEMO_WORKSPACE_ID


def _draft_to_dict(d: ContentDraft) -> Dict[str, Any]:
    content_payload = d.content
    try:
        content_payload = json.loads(d.content)
    except Exception:
        pass

    sched_date = None
    if d.calendar_entry and d.calendar_entry.scheduled_date:
        sched_date = d.calendar_entry.scheduled_date.isoformat()

    return {
        "draft_id": d.draft_id,
        "id": d.draft_id,
        "title": d.title,
        "content_payload": content_payload,
        "hook": d.hook or "",
        "platform": d.platform,
        "format_type": d.format_type,
        "status": d.status,
        "scheduled_date": sched_date,
        "tags": d.tags or [],
        "language": d.language,
        "created_at": d.created_at.isoformat() if d.created_at else "",
        "updated_at": d.updated_at.isoformat() if d.updated_at else "",
    }


def get_content_drafts(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    platform: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    stmt = (
        select(ContentDraft)
        .options(joinedload(ContentDraft.calendar_entry))
        .where(ContentDraft.workspace_id == workspace_id)
        .order_by(desc(ContentDraft.created_at))
    )

    if platform and platform.lower() != "all":
        stmt = stmt.where(ContentDraft.platform == platform.lower())

    if status and status.lower() != "all":
        stmt = stmt.where(ContentDraft.status == status.lower())

    drafts = session.scalars(stmt).all()
    return [_draft_to_dict(d) for d in drafts]


def save_content_draft(
    session: Session,
    workspace_id: uuid.UUID,
    draft_data: Dict[str, Any],
) -> Dict[str, Any]:
    d_id = draft_data.get("draft_id") or draft_data.get("id") or f"draft_{uuid.uuid4().hex[:8]}"
    draft_data["draft_id"] = d_id
    draft_data["id"] = d_id

    existing = session.scalar(
        select(ContentDraft)
        .options(joinedload(ContentDraft.calendar_entry))
        .where(ContentDraft.workspace_id == workspace_id, ContentDraft.draft_id == d_id)
    )

    content_val = draft_data.get("content_payload") or draft_data.get("content") or draft_data.get("hook") or draft_data.get("title") or ""
    if isinstance(content_val, (dict, list)):
        content_str = json.dumps(content_val, ensure_ascii=False)
    else:
        content_str = str(content_val)

    sched_str = draft_data.get("scheduled_date")
    sched_dt = None
    if sched_str:
        try:
            sched_dt = datetime.fromisoformat(sched_str.replace("Z", "+00:00"))
        except Exception:
            sched_dt = None

    if existing:
        existing.title = draft_data.get("title", existing.title)
        existing.content = content_str
        existing.platform = draft_data.get("platform", existing.platform)
        existing.format_type = draft_data.get("format_type", existing.format_type)
        existing.status = draft_data.get("status", existing.status)
        existing.hook = draft_data.get("hook", existing.hook)
        existing.language = draft_data.get("language", existing.language)
        existing.tags = draft_data.get("tags", existing.tags)
        existing.updated_at = datetime.now(timezone.utc)

        if sched_dt:
            if existing.calendar_entry:
                existing.calendar_entry.scheduled_date = sched_dt
                existing.calendar_entry.status = "scheduled"
            else:
                cal = ContentCalendar(
                    draft_id=d_id,
                    workspace_id=workspace_id,
                    scheduled_date=sched_dt,
                    status="scheduled",
                )
                session.add(cal)
        elif existing.calendar_entry and not sched_str:
            session.delete(existing.calendar_entry)

    else:
        created_str = draft_data.get("created_at")
        try:
            created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")) if created_str else datetime.now(timezone.utc)
        except Exception:
            created_dt = datetime.now(timezone.utc)

        new_draft = ContentDraft(
            draft_id=d_id,
            workspace_id=workspace_id,
            title=draft_data.get("title", "Untitled Draft"),
            content=content_str,
            platform=draft_data.get("platform", "youtube"),
            format_type=draft_data.get("format_type", "short"),
            hook=draft_data.get("hook"),
            language=draft_data.get("language", "English"),
            tags=draft_data.get("tags", []),
            status=draft_data.get("status", "draft"),
            created_at=created_dt,
            updated_at=created_dt,
        )
        session.add(new_draft)

        if sched_dt:
            cal = ContentCalendar(
                draft_id=d_id,
                workspace_id=workspace_id,
                scheduled_date=sched_dt,
                status="scheduled",
            )
            session.add(cal)

    session.flush()
    return draft_data


def delete_content_draft(
    session: Session,
    workspace_id: uuid.UUID,
    draft_id: str,
) -> bool:
    cond = (ContentDraft.draft_id == draft_id)
    try:
        parsed_uuid = uuid.UUID(str(draft_id))
        cond = cond | (ContentDraft.id == parsed_uuid)
    except (ValueError, AttributeError):
        pass

    existing = session.scalar(
        select(ContentDraft).where(
            ContentDraft.workspace_id == workspace_id,
            cond,
        )
    )
    if not existing:
        return False
    session.delete(existing)
    session.flush()
    return True


def get_content_calendar(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
) -> List[Dict[str, Any]]:
    stmt = (
        select(ContentCalendar)
        .options(joinedload(ContentCalendar.draft))
        .where(ContentCalendar.workspace_id == workspace_id)
        .order_by(ContentCalendar.scheduled_date.asc())
    )
    entries = session.scalars(stmt).all()
    result = []
    for entry in entries:
        d = entry.draft
        result.append({
            "calendar_id": str(entry.id),
            "draft_id": entry.draft_id,
            "title": d.title if d else "Scheduled Post",
            "platform": d.platform if d else "all",
            "scheduled_date": entry.scheduled_date.isoformat() if entry.scheduled_date else "",
            "slot_type": entry.slot_type,
            "status": entry.status,
        })
    return result
