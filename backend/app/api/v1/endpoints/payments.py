from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Header, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.payment import (
    PaymentOrderCreate,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentResponse,
    ReceiptResponse,
    WebhookResponse,
)
from app.services.payment_service import payment_service

router = APIRouter(tags=["Payments"])


@router.post(
    "/reservations/{reservation_id}/payment/order",
    response_model=APIResponse[PaymentOrderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create or retrieve a Razorpay payment order for a reservation",
)
def create_payment_order(
    reservation_id: int,
    order_in: Optional[PaymentOrderCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a server-side verified Razorpay payment order for the specified reservation.
    The amount is computed strictly from the reservation's persisted rate.
    """
    payment_method = order_in.payment_method if order_in else None
    order_response = payment_service.create_order(
        db=db,
        user=current_user,
        reservation_id=reservation_id,
        payment_method=payment_method or "RAZORPAY",
    )
    return APIResponse(
        success=True,
        message="Payment order created successfully.",
        data=order_response,
    )


@router.post(
    "/payments/verify",
    response_model=APIResponse[PaymentResponse],
    summary="Verify Razorpay payment signature and issue receipt",
)
def verify_payment(
    verify_in: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verifies the Razorpay payment signature returned by Razorpay Checkout.
    If valid, marks payment COMPLETED and transactionally creates a digital receipt.
    """
    payment = payment_service.verify_payment(
        db=db,
        user=current_user,
        data=verify_in,
    )
    return APIResponse(
        success=True,
        message="Payment verified successfully. Receipt generated.",
        data=payment,
    )


@router.get(
    "/reservations/{reservation_id}/payment",
    response_model=APIResponse[PaymentResponse],
    summary="Get payment details for a specific reservation",
)
def get_reservation_payment(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = payment_service.get_payment_for_reservation(
        db=db,
        user=current_user,
        reservation_id=reservation_id,
    )
    return APIResponse(
        success=True,
        message="Payment details retrieved.",
        data=payment,
    )


@router.get(
    "/reservations/{reservation_id}/receipt",
    response_model=APIResponse[ReceiptResponse],
    summary="Get official payment receipt for a reservation",
)
def get_reservation_receipt(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    receipt = payment_service.get_receipt_for_reservation(
        db=db,
        user=current_user,
        reservation_id=reservation_id,
    )
    return APIResponse(
        success=True,
        message="Receipt retrieved.",
        data=receipt,
    )


@router.get(
    "/payments/me",
    response_model=APIResponse[List[PaymentResponse]],
    summary="List authenticated user's payment history",
)
def list_my_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = payment_service.list_user_payments(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    return APIResponse(
        success=True,
        message="Payment history retrieved.",
        data=payments,
    )


@router.post(
    "/webhooks/razorpay",
    response_model=WebhookResponse,
    summary="Process Razorpay server webhook notifications",
)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    return payment_service.process_webhook(
        db=db,
        raw_body=raw_body,
        signature=x_razorpay_signature,
    )
