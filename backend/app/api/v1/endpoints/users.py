from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.user import UserResponse, UserUpdate, PasswordChange, UserRoleUpdate
from app.services.user_service import user_service
from app.services.auth_service import auth_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=APIResponse[UserResponse])
def get_profile(
    current_user: User = Depends(get_current_user)
):
    return APIResponse(
        success=True,
        message="Profile retrieved.",
        data=current_user
    )


@router.put("/me", response_model=APIResponse[UserResponse])
def update_profile(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = user_service.update_profile(db, current_user, update_in)
    return APIResponse(
        success=True,
        message="Profile updated successfully.",
        data=updated
    )


@router.post("/me/change-password", response_model=APIResponse[dict])
def change_password(
    pw_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_service.change_password(db, current_user, pw_in)
    return APIResponse(
        success=True,
        message="Password updated successfully.",
        data={"updated": True}
    )


@router.get("/", response_model=APIResponse[List[UserResponse]])
def list_users_admin(
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = user_service.list_users(db, role=role, skip=skip, limit=limit)
    return APIResponse(
        success=True,
        message="Users list retrieved.",
        data=users
    )


@router.put("/{user_id}/role", response_model=APIResponse[UserResponse])
@router.patch("/{user_id}/role", response_model=APIResponse[UserResponse])
def update_user_role(
    user_id: int,
    role_in: UserRoleUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    updated = auth_service.provision_user_role(db, user_id, role_in.role, current_admin)
    return APIResponse(
        success=True,
        message=f"User role updated to {role_in.role.value}.",
        data=updated
    )
