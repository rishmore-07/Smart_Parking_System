from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import verify_password, get_password_hash
from app.models.user import User, UserRole
from app.repositories.user_repo import user_repo
from app.repositories.audit_repo import audit_repo
from app.schemas.user import UserUpdate, PasswordChange


class UserService:
    def update_profile(self, db: Session, user: User, update_in: UserUpdate) -> User:
        if update_in.full_name is not None:
            user.full_name = update_in.full_name.strip()
        if update_in.phone_number is not None:
            user.phone_number = update_in.phone_number.strip()
        if update_in.avatar_url is not None:
            user.avatar_url = update_in.avatar_url.strip()

        db.commit()
        db.refresh(user)

        audit_repo.log(
            db,
            action="USER_UPDATE_PROFILE",
            user_id=user.id,
            entity_type="User",
            entity_id=str(user.id),
            details="Profile updated",
        )
        return user

    def change_password(self, db: Session, user: User, pw_in: PasswordChange) -> None:
        if not user.hashed_password or not verify_password(pw_in.old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        user.hashed_password = get_password_hash(pw_in.new_password)
        db.commit()

        audit_repo.log(
            db,
            action="USER_CHANGE_PASSWORD",
            user_id=user.id,
            entity_type="User",
            entity_id=str(user.id),
            details="Password changed successfully",
        )

    def list_users(
        self, db: Session, role: Optional[UserRole] = None, skip: int = 0, limit: int = 50
    ) -> List[User]:
        return user_repo.get_users_by_role(db, role=role, skip=skip, limit=limit)


user_service = UserService()
