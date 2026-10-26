"""
CreatorPulse AI - Calendar & Drafts Router
--------------------------------------------
Manages saved post drafts, ideation items, and scheduled publications.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.services import data_access

router = APIRouter(prefix="/api/drafts", tags=["Drafts & Calendar"])

class DraftCreateRequest(BaseModel):
    platform: str = Field(..., example="youtube")
    title: str = Field(..., example="5 Secrets to Clean Code")
    status: str = Field("idea", example="idea")
    scheduled_date: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    language: str = Field("English")
    hook: Optional[str] = None
    content_payload: Optional[Dict[str, Any]] = None

class DraftUpdateRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    scheduled_date: Optional[str] = None
    tags: Optional[List[str]] = None
    language: Optional[str] = None
    hook: Optional[str] = None
    content_payload: Optional[Dict[str, Any]] = None

@router.get("")
def get_drafts(platform: Optional[str] = Query("all"), status: Optional[str] = Query("all")):
    drafts = data_access.get_drafts(platform=platform, status=status)
    return {
        "metadata": data_access.get_system_metadata(),
        "total": len(drafts),
        "drafts": drafts
    }

@router.post("")
def create_draft(req: DraftCreateRequest):
    draft_dict = req.model_dump()
    saved = data_access.save_draft(draft_dict)
    return saved

@router.put("/{draft_id}")
def update_draft(draft_id: str, req: DraftUpdateRequest):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = data_access.update_draft(draft_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Draft not found")
    return updated

@router.delete("/{draft_id}")
def delete_draft(draft_id: str):
    success = data_access.delete_draft(draft_id)
    if not success:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"success": True, "deleted_id": draft_id}
