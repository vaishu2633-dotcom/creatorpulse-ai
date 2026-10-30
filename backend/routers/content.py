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
    language: str = Field("English", example="English")

@router.get("/status")
def get_status():
    """Returns LLM configuration status and active generation mode."""
    return content_generator.get_llm_status()

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
        "generation_mode": content.get("generation_mode", "template"),
        "provider": content.get("provider", "template"),
        "model_label": content.get("model_label", "Curated Templates"),
        "content": content
    }

@router.post("/tournament")
def run_tournament(req: TournamentRequest):
    results = content_generator.run_idea_tournament(
        platform=req.platform,
        topic=req.topic,
        count=req.count,
        language=req.language
    )
    return {
        "metadata": data_access.get_system_metadata(),
        "platform": req.platform,
        "topic": req.topic,
        "language": req.language,
        "total_ideas_evaluated": len(results),
        "tournament_rankings": results
    }
