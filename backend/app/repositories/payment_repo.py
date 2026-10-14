from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.repositories.base_repo import BaseRepository
from app.models.payment import Payment, Receipt, PaymentStatus


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self):
        super().__init__(Payment)

    def get_by_reservation_id(self, db: Session, reservation_id: int, lock: bool = False) -> Optional[Payment]:
        query = (
            db.query(Payment)
            .options(
                joinedload(Payment.receipt),
                joinedload(Payment.reservation),
            )
            .filter(Payment.reservation_id == reservation_id)
        )
        if lock:
            query = query.with_for_update()
        return query.first()

    def get_by_order_id(self, db: Session, razorpay_order_id: str, lock: bool = False) -> Optional[Payment]:
        query = (
            db.query(Payment)
            .options(
                joinedload(Payment.receipt),
                joinedload(Payment.reservation),
            )
            .filter(Payment.razorpay_order_id == razorpay_order_id)
        )
        if lock:
            query = query.with_for_update()
        return query.first()

    def get_by_payment_id(self, db: Session, razorpay_payment_id: str) -> Optional[Payment]:
        return (
            db.query(Payment)
            .options(joinedload(Payment.receipt))
            .filter(Payment.razorpay_payment_id == razorpay_payment_id)
            .first()
        )

    def list_for_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Payment]:
        return (
            db.query(Payment)
            .options(
                joinedload(Payment.receipt),
                joinedload(Payment.reservation),
            )
            .filter(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_receipt_by_payment_id(self, db: Session, payment_id: int) -> Optional[Receipt]:
        return db.query(Receipt).filter(Receipt.payment_id == payment_id).first()

    def get_receipt_by_reservation_id(self, db: Session, reservation_id: int) -> Optional[Receipt]:
        payment = (
            db.query(Payment)
            .options(joinedload(Payment.receipt))
            .filter(Payment.reservation_id == reservation_id)
            .first()
        )
        if payment and payment.receipt:
            return payment.receipt
        return None


payment_repo = PaymentRepository()
