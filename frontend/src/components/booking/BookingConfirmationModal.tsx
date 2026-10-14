import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Reservation } from '../../types/reservation';
import { paymentService } from '../../services/paymentService';
import { ReceiptModal } from '../payment/ReceiptModal';
import {
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Car,
  MapPin,
  Layers,
  ArrowRight,
  ShieldCheck,
  Ticket,
  CreditCard,
  Loader2,
  AlertCircle,
  Receipt as ReceiptIcon
} from 'lucide-react';

interface BookingConfirmationModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  reservation,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservation.booking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayNow = async () => {
    setIsPaying(true);
    setPaymentError(null);

    try {
      // 1. Create order on backend
      const orderRes = await paymentService.createPaymentOrder(reservation.id);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initiate payment.');
      }
      const order = orderRes.data;

      // 2. Load Razorpay script
      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: order.business_name,
        description: order.description,
        order_id: order.order_id,
        prefill: {
          name: reservation.user?.full_name || '',
          email: reservation.user?.email || '',
        },
        theme: {
          color: '#0F766E',
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              reservation_id: reservation.id,
            });

            if (verifyRes.success) {
              setIsPaid(true);
            } else {
              setPaymentError(verifyRes.message || 'Payment signature verification failed.');
            }
          } catch (err: any) {
            setPaymentError(err.message || 'Failed to verify payment with server.');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', (resp: any) => {
        setPaymentError(resp.error?.description || 'Payment was unsuccessful or declined.');
        setIsPaying(false);
      });
      razorpayInstance.open();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment initiation failed.');
      setIsPaying(false);
    }
  };

  const startDate = new Date(reservation.start_time);
  const endDate = new Date(reservation.end_time);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp">
          {/* Banner */}
          <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] p-6 text-white text-center relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Booking Confirmed!</h2>
            <p className="text-xs text-teal-100 mt-1">Your parking space is successfully locked and reserved.</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Booking Code Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Booking Reference</span>
                <div className="text-lg font-mono font-extrabold text-slate-900 tracking-wider">
                  {reservation.booking_code}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#0F766E]" />
                  Facility
                </span>
                <div className="font-bold text-slate-800 mt-0.5 truncate">{reservation.facility?.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{reservation.facility?.address}</div>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#0F766E]" />
                  Assigned Bay
                </span>
                <div className="font-bold text-teal-800 mt-0.5">
                  {reservation.spot?.spot_number ? `Bay ${reservation.spot.spot_number}` : 'Reserved'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Floor: {reservation.spot?.floor || 'Ground'} • {reservation.spot?.spot_type || 'Standard'}
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#0F766E]" />
                  Date & Time
                </span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-[10px] text-slate-500">
                  {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Car className="w-3 h-3 text-[#0F766E]" />
                  Vehicle
                </span>
                <div className="font-bold text-slate-800 mt-0.5">{reservation.vehicle?.license_plate}</div>
                <div className="text-[10px] text-slate-500">
                  {reservation.vehicle?.make} {reservation.vehicle?.model}
                </div>
              </div>
            </div>

            {/* Pricing & Razorpay Status Box */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs font-bold text-slate-800">Reservation Fee</span>
                </div>
                <div className="text-base font-extrabold text-[#0F766E]">
                  ₹{reservation.total_amount}{' '}
                  <span className="text-xs font-normal text-slate-500">({reservation.currency})</span>
                </div>
              </div>

              {/* Payment State Display */}
              {isPaid ? (
                <div className="p-3 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Payment Confirmed & Verified</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReceipt(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 shadow-xs"
                  >
                    <ReceiptIcon className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Razorpay Gateway (Test Mode)
                  </span>
                  <button
                    type="button"
                    disabled={isPaying}
                    onClick={handlePayNow}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay ₹{reservation.total_amount} Now</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {paymentError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Show booking reference code at gate entry or pay later in My Bookings.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/bookings');
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span>Go to My Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showReceipt && (
        <ReceiptModal
          reservationId={reservation.id}
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </>
  );
};
