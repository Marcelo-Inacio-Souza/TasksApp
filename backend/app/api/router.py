from backend.app.api.routes import auth, boards, health
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])