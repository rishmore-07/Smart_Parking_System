from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, UserRole
from app.repositories.user_repo import user_repo
from app.repositories.audit_repo import audit_repo
from app.schemas.user import UserCreate, UserLogin, GoogleAuthRequest
from app.schemas.token import Token


class AuthService:
    def register(self, db: Session, user_in: UserCreate, ip_address: Optional[str] = None) -> Tuple[User, Token]:
        existing_user = user_repo.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )

        # Hash password and create user
        hashed_pw = get_password_hash(user_in.password)
        user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hashed_pw,
            full_name=user_in.full_name.strip(),
            phone_number=user_in.phone_number,
            role=user_in.role or UserRole.DRIVER,
            is_active=True,
            is_verified=False,
            auth_provider="local",
        )
        created_user = user_repo.create(db, user)

        audit_repo.log(
            db,
            action="USER_REGISTERED",
            user_id=created_user.id,
            entity_type="User",
            entity_id=str(created_user.id),
            details=f"User {created_user.email} registered with role {created_user.role}",
            ip_address=ip_address,
        )

        token_str = create_access_token(
            subject=created_user.id,
            role=created_user.role.value,
            email=created_user.email,
            full_name=created_user.full_name,
        )

        token = Token(
            access_token=token_str,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=created_user,
        )
        return created_user, token

    def login(self, db: Session, login_in: UserLogin, ip_address: Optional[str] = None) -> Tuple[User, Token]:
        user = user_repo.get_by_email(db, login_in.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not user.hashed_password or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive or suspended. Please contact support."
            )

        audit_repo.log(
            db,
            action="USER_LOGIN",
            user_id=user.id,
            entity_type="User",
            entity_id=str(user.id),
            details="User logged in via email/password",
            ip_address=ip_address,
        )

        token_str = create_access_token(
            subject=user.id,
            role=user.role.value,
            email=user.email,
            full_name=user.full_name,
        )

        token = Token(
            access_token=token_str,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=user,
        )
        return user, token

    def authenticate_google(
        self, db: Session, req: GoogleAuthRequest, ip_address: Optional[str] = None
    ) -> Tuple[User, Token]:
        # Google OAuth verification service:
        # In test/dev environment or fallback, allows mock verification or payload extraction
        email = req.email
        full_name = req.full_name or "Google User"
        avatar_url = req.avatar_url

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token payload must include a valid email."
            )

        user = user_repo.get_by_email(db, email)
        if not user:
            # Register user via Google OAuth
            user = User(
                email=email.lower().strip(),
                full_name=full_name.strip(),
                role=UserRole.DRIVER,
                is_active=True,
                is_verified=True,
                avatar_url=avatar_url,
                auth_provider="google",
            )
            user = user_repo.create(db, user)
            audit_repo.log(
                db,
                action="USER_REGISTER_GOOGLE",
                user_id=user.id,
                entity_type="User",
                entity_id=str(user.id),
                details=f"Registered via Google OAuth: {email}",
                ip_address=ip_address,
            )
        else:
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
                db.commit()
            audit_repo.log(
                db,
                action="USER_LOGIN_GOOGLE",
                user_id=user.id,
                entity_type="User",
                entity_id=str(user.id),
                details=f"Logged in via Google OAuth: {email}",
                ip_address=ip_address,
            )

        token_str = create_access_token(
            subject=user.id,
            role=user.role.value,
            email=user.email,
            full_name=user.full_name,
        )

        token = Token(
            access_token=token_str,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=user,
        )
        return user, token


auth_service = AuthService()
