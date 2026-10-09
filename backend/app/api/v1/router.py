from fastapi import APIRouter
from app.api.v1 import health, meetings, action_items, search, qa

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(meetings.router)
api_router.include_router(action_items.router)
api_router.include_router(search.router)
api_router.include_router(qa.router)

