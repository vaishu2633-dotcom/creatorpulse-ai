"""
CreatorPulse AI - Settings & Integrations Router
--------------------------------------------------
Exposes platform connection states (YouTube, Instagram, X, LinkedIn),
CSV upload validation, preview & import with bad row reporting,
sample CSV template generation, YouTube Data API channel syncing,
and the global Data Source switcher.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from backend.services import data_access, youtube_service, integrations_manager

router = APIRouter(prefix="/api/settings", tags=["Settings & Integrations"])

class CSVUploadRequest(BaseModel):
    csv_text: str
    filename: Optional[str] = "upload.csv"
    set_as_active: Optional[bool] = True

class CSVPreviewRequest(BaseModel):
    csv_text: str

class DataSourceSwitchRequest(BaseModel):
    source: str = Field(..., description="Active data source: 'sample', 'uploaded_csv', or 'youtube'")

class YouTubeConnectRequest(BaseModel):
    channel_url: str = Field(..., description="Channel URL, handle (@handle), or channel ID")
    set_as_active: Optional[bool] = True

class KeyValidationRequest(BaseModel):
    provider: str = Field(..., description="Provider identifier: 'youtube' or 'llm'")
    api_key: Optional[str] = Field(None, description="Optional raw key to test without saving")

class KeySaveRequest(BaseModel):
    provider: str = Field(..., description="Provider identifier: 'youtube' or 'llm'")
    api_key: str = Field(..., description="API key to save securely in backend/.env")

# ----------------- Data Source Switcher -----------------

@router.get("/data-source")
def get_data_source():
    """Returns active data source and provenance metadata."""
    state = data_access.get_data_source_state()
    return {
        "active_source": state.get("active_source", "sample"),
        "state": state,
        "metadata": data_access.get_system_metadata()
    }

@router.post("/data-source")
def set_data_source(payload: DataSourceSwitchRequest):
    """Switches the global data source across all pages."""
    try:
        metadata = data_access.set_active_data_source(payload.source)
        return {
            "success": True,
            "active_source": payload.source,
            "metadata": metadata,
            "message": f"Data source switched to {payload.source}."
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- CSV Template, Preview & Import -----------------

@router.get("/csv/template")
def download_csv_template():
    """Provides a downloadable sample CSV template for creator performance data."""
    template_content = data_access.get_sample_csv_template()
    return Response(
        content=template_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=creatorpulse_sample_template.csv"}
    )

@router.post("/csv/preview")
def preview_csv_endpoint(payload: CSVPreviewRequest):
    """Validates CSV format, reports header recognition, valid rows, and diagnostics on bad rows."""
    result = data_access.validate_and_preview_csv(payload.csv_text)
    return result

@router.post("/csv/import")
def import_csv_endpoint(payload: CSVUploadRequest):
    """Imports validated posts from CSV string into uploaded_posts.json."""
    result = data_access.import_posts_from_csv(
        csv_content=payload.csv_text,
        filename=payload.filename or "upload.csv",
        set_as_active=payload.set_as_active if payload.set_as_active is not None else True
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "CSV import failed"))
    return result

# Backward-compatibility endpoints
@router.post("/upload-csv")
async def upload_csv_endpoint(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Form(None)
):
    content = ""
    filename = "upload.csv"
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="replace")
        filename = file.filename or "upload.csv"
    elif csv_text:
        content = csv_text
    else:
        raise HTTPException(status_code=400, detail="No CSV file or csv_text provided.")

    result = data_access.import_posts_from_csv(content, filename=filename, set_as_active=True)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse CSV"))
    return result

@router.post("/upload-csv-json")
def upload_csv_json_endpoint(payload: CSVUploadRequest):
    result = data_access.import_posts_from_csv(
        payload.csv_text,
        filename=payload.filename or "upload.csv",
        set_as_active=payload.set_as_active if payload.set_as_active is not None else True
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse CSV"))
    return result

# ----------------- YouTube Channel Connect -----------------

@router.get("/youtube/status")
def get_youtube_status():
    """Checks whether YOUTUBE_API_KEY is configured and returns connected channel metadata."""
    api_status = youtube_service.check_youtube_api_status()
    state = data_access.get_data_source_state()
    return {
        **api_status,
        "connected_channel": state.get("youtube_meta")
    }

@router.post("/youtube/connect")
def connect_youtube_endpoint(payload: YouTubeConnectRequest):
    """
    Connects a YouTube channel using YouTube Data API v3 and imports recent videos.
    Handles quota errors and missing key with clear truthful messages.
    """
    result = data_access.import_youtube_channel_posts(
        channel_url=payload.channel_url,
        set_as_active=payload.set_as_active if payload.set_as_active is not None else True
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to connect YouTube channel.")
        )
    return result

# ----------------- Platform Integrations Directory -----------------

@router.get("/integrations")
def get_integrations(live_ping: bool = False):
    """
    Returns full integrations catalog, credentials status, quota parameters,
    and supported features across all 6 platform connectors.
    """
    catalog = integrations_manager.get_all_integrations_summary(live_ping=live_ping)
    yt_status = youtube_service.check_youtube_api_status()

    data_sources_info = [
        {
            "type": "Direct Official APIs",
            "suitability": "YouTube live channel ingestion",
            "notes": "Directly pulls video stats, duration, and comments via Google Cloud API key."
        },
        {
            "type": "Creator CSV Export",
            "suitability": "Zero API keys needed, works for all platforms",
            "notes": "Download native analytics CSV from YouTube Studio, Meta Business Suite, or X Analytics and drop it here."
        },
        {
            "type": "Sample Simulated Data",
            "suitability": "Safe testing and algorithm exploration",
            "notes": "1,800 simulated multi-platform posts for instant interactive testing."
        }
    ]

    return {
        "metadata": data_access.get_system_metadata(),
        "summary": catalog["summary"],
        "integrations": catalog["integrations"],
        "data_sources": data_sources_info,
        "youtube_api_configured": yt_status["configured"],
        "llm_api_configured": catalog["summary"]["llm_status"]["is_configured"]
    }

@router.post("/integrations/validate")
def validate_integration_endpoint(payload: KeyValidationRequest):
    """
    Validates an external API key (YouTube or LLM) with a lightweight probe call.
    Never exposes raw secrets in response payloads.
    """
    provider = payload.provider.lower().strip()
    if provider == "youtube":
        return integrations_manager.validate_youtube_key(payload.api_key)
    elif provider in ["llm", "gemini", "openai"]:
        return integrations_manager.validate_llm_key(payload.api_key)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Validation not supported for provider '{provider}'. Supported providers: 'youtube', 'llm'."
        )

@router.post("/integrations/save-key")
def save_integration_key_endpoint(payload: KeySaveRequest):
    """
    Securely saves or updates an API key in backend/.env and updates active runtime.
    Returns masked confirmation and operational status.
    """
    provider = payload.provider.lower().strip()
    key_clean = payload.api_key.strip()

    if not key_clean:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")

    if provider == "youtube":
        env_var = "YOUTUBE_API_KEY"
        success = integrations_manager.set_secret_in_env(env_var, key_clean)
        status = integrations_manager.validate_youtube_key(key_clean)
    elif provider in ["llm", "gemini", "openai"]:
        env_var = "LLM_API_KEY"
        success = integrations_manager.set_secret_in_env(env_var, key_clean)
        status = integrations_manager.validate_llm_key(key_clean)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider '{provider}'.")

    if not success:
        raise HTTPException(status_code=500, detail="Failed to write configuration to backend/.env.")

    return {
        "success": True,
        "provider": provider,
        "masked_key": integrations_manager.mask_key(key_clean),
        "validation_status": status,
        "message": f"Successfully configured and activated {provider.upper()} API integration."
    }
