from backend.app.core.config import settings
from backend.app.db.session import AsyncSessionLocal
from fastapi import APIRouter
from sqlalchemy import text

router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}


@router.get("/health/db")
async def database_health_check() -> dict[str, str]:
    async with AsyncSessionLocal() as session:
        await session.execute(text("select 1"))
    return {"status": "ok", "database": "connected"}
