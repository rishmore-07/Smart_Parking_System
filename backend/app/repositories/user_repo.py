from typing import Optional, List
from sqlalchemy.orm import Session
from app.repositories.base_repo import BaseRepository
from app.models.user import User, UserRole


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_users_by_role(
        self, db: Session, role: Optional[UserRole] = None, skip: int = 0, limit: int = 100
    ) -> List[User]:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.offset(skip).limit(limit).all()

    def count_users(self, db: Session, role: Optional[UserRole] = None) -> int:
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.count()


user_repo = UserRepository()
