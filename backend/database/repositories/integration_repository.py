"""
CreatorPulse AI - Integrations Repository
Handles persistence of platform integration settings, encrypted credentials, and health status.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ApiIntegrationMetadata, SYSTEM_DEMO_WORKSPACE_ID, SYSTEM_DEMO_USER_ID


def _integration_to_dict(meta: ApiIntegrationMetadata) -> Dict[str, Any]:
    return {
        "id": str(meta.id),
        "workspace_id": str(meta.workspace_id),
        "user_id": str(meta.user_id),
        "provider_id": meta.provider_id,
        "is_connected": meta.is_connected,
        "key_masked": meta.key_masked,
        "has_secret": bool(meta.encrypted_secret),
        "last_tested_at": meta.last_tested_at.isoformat() if meta.last_tested_at else None,
        "health_status": meta.health_status,
        "quota_limit": meta.quota_limit,
        "quota_used": meta.quota_used,
        "error_message": meta.error_message,
        "updated_at": meta.updated_at.isoformat() if meta.updated_at else None,
    }


def get_integration_metadata(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    provider_id: str = "",
) -> Optional[Dict[str, Any]]:
    stmt = select(ApiIntegrationMetadata).where(
        ApiIntegrationMetadata.workspace_id == workspace_id,
        ApiIntegrationMetadata.provider_id == provider_id.lower(),
    )
    meta = session.scalar(stmt)
    if not meta:
        return None
    return _integration_to_dict(meta)


def get_all_integrations(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
) -> List[Dict[str, Any]]:
    stmt = select(ApiIntegrationMetadata).where(
        ApiIntegrationMetadata.workspace_id == workspace_id
    )
    results = session.scalars(stmt).all()
    return [_integration_to_dict(m) for m in results]


def save_integration_metadata(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    user_id: uuid.UUID = SYSTEM_DEMO_USER_ID,
    provider_id: str = "",
    is_connected: bool = True,
    secret: Optional[str] = None,
    key_masked: Optional[str] = None,
    health_status: str = "healthy",
    quota_limit: Optional[int] = None,
    quota_used: int = 0,
    error_message: Optional[str] = None,
) -> Dict[str, Any]:
    p_id = provider_id.lower().strip()
    stmt = select(ApiIntegrationMetadata).where(
        ApiIntegrationMetadata.workspace_id == workspace_id,
        ApiIntegrationMetadata.provider_id == p_id,
    )
    meta = session.scalar(stmt)

    now = datetime.now(timezone.utc)
    if not meta:
        meta = ApiIntegrationMetadata(
            workspace_id=workspace_id,
            user_id=user_id,
            provider_id=p_id,
            is_connected=is_connected,
            key_masked=key_masked,
            health_status=health_status,
            quota_limit=quota_limit,
            quota_used=quota_used,
            error_message=error_message,
            last_tested_at=now,
            created_at=now,
            updated_at=now,
        )
        if secret:
            meta.secret_plaintext = secret
        session.add(meta)
    else:
        meta.is_connected = is_connected
        meta.health_status = health_status
        meta.error_message = error_message
        meta.last_tested_at = now
        meta.updated_at = now
        if key_masked:
            meta.key_masked = key_masked
        if quota_limit is not None:
            meta.quota_limit = quota_limit
        if quota_used:
            meta.quota_used = quota_used
        if secret:
            meta.secret_plaintext = secret

    session.flush()
    return _integration_to_dict(meta)


def get_integration_secret(
    session: Session,
    workspace_id: uuid.UUID = SYSTEM_DEMO_WORKSPACE_ID,
    provider_id: str = "",
) -> Optional[str]:
    """Retrieves decrypted plaintext secret for backend usage only."""
    stmt = select(ApiIntegrationMetadata).where(
        ApiIntegrationMetadata.workspace_id == workspace_id,
        ApiIntegrationMetadata.provider_id == provider_id.lower().strip(),
    )
    meta = session.scalar(stmt)
    if not meta:
        return None
    return meta.secret_plaintext
