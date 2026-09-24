from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, GoogleAuthRequest, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[Token], status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user, token = auth_service.register(db, user_in, ip_address=ip_address)
    return APIResponse(
        success=True,
        message="User registered successfully.",
        data=token
    )


@router.post("/login", response_model=APIResponse[Token])
def login(
    login_in: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user, token = auth_service.login(db, login_in, ip_address=ip_address)
    return APIResponse(
        success=True,
        message="Login successful.",
        data=token
    )


@router.post("/google", response_model=APIResponse[Token])
def google_auth(
    google_in: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip_address = request.client.host if request.client else None
    user, token = auth_service.authenticate_google(db, google_in, ip_address=ip_address)
    return APIResponse(
        success=True,
        message="Google authentication successful.",
        data=token
    )


@router.get("/me", response_model=APIResponse[UserResponse])
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return APIResponse(
        success=True,
        message="Current user profile fetched.",
        data=current_user
    )
