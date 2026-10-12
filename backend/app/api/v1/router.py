from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, vehicles, facilities

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(vehicles.router)
api_router.include_router(facilities.router)
api_router.include_router(facilities.parking_router)
