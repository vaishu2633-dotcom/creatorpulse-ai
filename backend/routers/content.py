"""
CreatorPulse AI - ReelGenius Studio Content Router
----------------------------------------------------
Handles platform-tailored multi-lingual copy generation
and the competitive Idea Tournament.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from backend.services import content_generator, data_access

router = APIRouter(prefix="/api/content", tags=["Content Studio"])

class GenerateContentRequest(BaseModel):
    platform: str = Field(..., example="youtube")
    topic: str = Field(..., example="System Design Principles")
    goal: str = Field("engagement", example="engagement")
    tone: str = Field("educational", example="educational")
    language: str = Field("English", example="English")

class TournamentRequest(BaseModel):
    platform: str = Field(..., example="youtube")
    topic: str = Field(..., example="Fullstack AI Development")
    count: int = Field(10, ge=3, le=20)

@router.post("/generate")
def generate_content(req: GenerateContentRequest):
    content = content_generator.generate_platform_content(
        platform=req.platform,
        topic=req.topic,
        goal=req.goal,
        tone=req.tone,
        language=req.language
    )
    return {
        "metadata": data_access.get_system_metadata(),
        "content": content
    }

@router.post("/tournament")
def run_tournament(req: TournamentRequest):
    results = content_generator.run_idea_tournament(
        platform=req.platform,
        topic=req.topic,
        count=req.count
    )
    return {
        "metadata": data_access.get_system_metadata(),
        "platform": req.platform,
        "topic": req.topic,
        "total_ideas_evaluated": len(results),
        "tournament_rankings": results
    }
