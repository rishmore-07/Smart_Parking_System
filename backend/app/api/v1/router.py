from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, vehicles, facilities, reservations, payments

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(vehicles.router)
api_router.include_router(facilities.router)
api_router.include_router(facilities.parking_router)
api_router.include_router(reservations.router)
api_router.include_router(reservations.operator_router)
api_router.include_router(reservations.admin_router)
api_router.include_router(reservations.facility_avail_router)
api_router.include_router(payments.router)


