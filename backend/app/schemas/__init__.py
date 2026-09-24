from app.schemas.common import APIResponse, HealthResponse
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    GoogleAuthRequest,
    PasswordChange,
)
from app.schemas.vehicle import (
    VehicleBase,
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
)
from app.schemas.token import Token, TokenPayload

# Update forward references for Token
Token.model_rebuild()

__all__ = [
    "APIResponse",
    "HealthResponse",
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "GoogleAuthRequest",
    "PasswordChange",
    "VehicleBase",
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleResponse",
    "Token",
    "TokenPayload",
]
