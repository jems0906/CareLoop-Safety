import secrets

from fastapi import Header, HTTPException

from app.config import settings


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    if not settings.admin_api_key:
        raise HTTPException(status_code=503, detail="Administrative writes are disabled until ADMIN_API_KEY is configured")
    if not x_admin_key or not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(status_code=403, detail="Administrative access required")