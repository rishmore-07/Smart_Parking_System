import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationService } from '../services/reservationService';
import { paymentService } from '../services/paymentService';
import { ReceiptModal } from '../components/payment/ReceiptModal';
import type { Reservation, ReservationStatus } from '../types/reservation';
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  ArrowRight,
  Ticket,
  CreditCard,
  Receipt as ReceiptIcon,
  Loader2
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [selectedDetails, setSelectedDetails] = useState<Reservation | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [receiptReservationId, setReceiptReservationId] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Fetch reservations
  const { data: resData, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-reservations', activeTab],
    queryFn: () => {
      const filter = activeTab === 'all' ? undefined : activeTab;
      return reservationService.getMyReservations(filter);
    },
  });

  const reservations: Reservation[] = resData?.data || [];

  // Cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return reservationService.cancel(id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      setCancellingReservation(null);
      if (selectedDetails) setSelectedDetails(null);
    },
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isEligibleForCancel = (r: Reservation) => {
    if (r.status === 'CANCELLED' || r.status === 'COMPLETED' || r.status === 'EXPIRED') {
      return false;
    }
    const now = new Date();
    const startTime = new Date(r.start_time);
    return now < startTime;
  };

  const handlePayNow = async (r: Reservation) => {
    setPayingId(r.id);
    setPayError(null);

    try {
      const orderRes = await paymentService.createPaymentOrder(r.id);
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initiate payment.');
      }
      const order = orderRes.data;

      const scriptLoaded = await paymentService.loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load.');
      }

      const options = {
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: order.business_name,
        description: order.description,
        order_id: order.order_id,
        prefill: {
          name: r.user?.full_name || '',
          email: r.user?.email || '',
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
              reservation_id: r.id,
            });

            if (verifyRes.success) {
              queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
              setReceiptReservationId(r.id);
            } else {
              setPayError(verifyRes.message || 'Signature verification failed.');
            }
          } catch (err: any) {
            setPayError(err.message || 'Verification failed.');
          } finally {
            setPayingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setPayError(resp.error?.description || 'Payment was declined or failed.');
        setPayingId(null);
      });
      rzp.open();
    } catch (err: any) {
      setPayError(err.message || 'Payment initiation failed.');
      setPayingId(null);
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Confirmed</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>In Session</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            <span>Cancelled</span>
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span>No Show</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (r: Reservation) => {
    if (r.payment?.status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Paid</span>
        </span>
      );
    }
    if (r.payment?.status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Payment Failed</span>
        </span>
      );
    }
    if (r.status !== 'CANCELLED' && r.status !== 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Payment Pending</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
              Driver Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
            My Bookings & Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your smart parking reservations, pay online via Razorpay, and download official receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/parking')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Find New Parking</span>
        </button>
      </div>

      {payError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{payError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPayError(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        {(['upcoming', 'past', 'cancelled', 'all'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading your parking bookings...</p>
        </div>
      ) : isError ? (
        <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Failed to load reservations</h3>
          <p className="text-xs text-slate-500">Could not retrieve booking history from the server.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No {activeTab} bookings found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't reserved any parking spots in this category yet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/parking')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0D655E] transition-all shadow-xs"
          >
            <span>Explore Nearby Facilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reservations.map((r) => {
            const startDate = new Date(r.start_time);
            const endDate = new Date(r.end_time);
            const canCancel = isEligibleForCancel(r);
            const isPaid = r.payment?.status === 'COMPLETED';
            const canPay = (r.status === 'CONFIRMED' || r.status === 'ACTIVE') && !isPaid;

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(r.status)}
                      {getPaymentBadge(r)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(r.booking_code)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
                    >
                      {copiedCode === r.booking_code ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>{r.booking_code}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                      {r.facility?.name || 'Parking Facility'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-[#0F766E] flex-shrink-0" />
                      <span className="truncate">{r.facility?.address}</span>
                    </div>
                  </div>

                  {/* Schedule & Space Pill */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Time:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                        Bay:
                      </span>
                      <span className="font-bold text-teal-800">
                        {r.spot?.spot_number ? `Bay ${r.spot.spot_number}` : 'Guaranteed Bay'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        Vehicle:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {r.vehicle?.license_plate || 'Registered Car'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Fee & Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">
                        {isPaid ? 'Amount Paid' : 'Fee Due'}
                      </span>
                      <span className="text-sm font-extrabold text-[#0F766E]">
                        ₹{r.total_amount} <span className="text-[10px] font-normal text-slate-400">({r.currency})</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPaid && (
                        <button
                          type="button"
                          onClick={() => setReceiptReservationId(r.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <ReceiptIcon className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      )}

                      {canPay && (
                        <button
                          type="button"
                          disabled={payingId === r.id}
                          onClick={() => handlePayNow(r)}
                          className="px-3 py-1.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                        >
                          {payingId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5" />
                          )}
                          <span>Pay Now</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedDetails(r)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancellingReservation(r)}
                      className="w-full py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold text-center transition-colors"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Parking Reservation?</h3>
                <p className="text-xs text-slate-500">Booking: {cancellingReservation.booking_code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this booking for{' '}
              <strong className="text-slate-800">{cancellingReservation.facility?.name}</strong>? Your reserved parking
              spot will be immediately restored and released to other drivers.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Reason for cancellation (optional)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Found alternative parking">Found alternative parking</option>
                <option value="Booking date/time mistake">Booking date/time mistake</option>
                <option value="Vehicle issue">Vehicle issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {cancelMutation.isError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {(cancelMutation.error as any)?.message || 'Cancellation failed. Please try again.'}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => setCancellingReservation(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() =>
                  cancelMutation.mutate({
                    id: cancellingReservation.id,
                    reason: cancelReason,
                  })
                }
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#0F766E]">Reservation Details</span>
                <h3 className="text-base font-bold text-slate-900">{selectedDetails.facility?.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Booking Code:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDetails.booking_code}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {getStatusBadge(selectedDetails.status)}
                    {getPaymentBadge(selectedDetails)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee</span>
                  <div className="text-sm font-extrabold text-[#0F766E] mt-1">
                    ₹{selectedDetails.total_amount} ({selectedDetails.currency})
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle</span>
                  <div className="font-bold text-slate-800 mt-1">{selectedDetails.vehicle?.license_plate}</div>
                  <div className="text-[10px] text-slate-400">
                    {selectedDetails.vehicle?.make} {selectedDetails.vehicle?.model}
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Parking Spot</span>
                  <div className="font-bold text-teal-800 mt-1">
                    {selectedDetails.spot?.spot_number ? `Bay ${selectedDetails.spot.spot_number}` : 'Reserved'}
                  </div>
                  <div className="text-[10px] text-slate-400">Floor {selectedDetails.spot?.floor || 'Ground'}</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Facility Address</span>
                <div className="font-semibold text-slate-800">{selectedDetails.facility?.address}</div>
              </div>

              {selectedDetails.cancelled_at && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-0.5">
                  <span className="font-bold block">Cancelled on:</span>
                  <div>{new Date(selectedDetails.cancelled_at).toLocaleString()}</div>
                  {selectedDetails.cancellation_reason && (
                    <div className="text-[11px] text-rose-600">Reason: {selectedDetails.cancellation_reason}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {selectedDetails.payment?.status === 'COMPLETED' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptReservationId(selectedDetails.id);
                      setSelectedDetails(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <ReceiptIcon className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
                  </button>
                ) : (selectedDetails.status === 'CONFIRMED' || selectedDetails.status === 'ACTIVE') ? (
                  <button
                    type="button"
                    disabled={payingId === selectedDetails.id}
                    onClick={() => {
                      const resv = selectedDetails;
                      setSelectedDetails(null);
                      handlePayNow(resv);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay with Razorpay</span>
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {isEligibleForCancel(selectedDetails) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingReservation(selectedDetails);
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                  >
                    Cancel Booking
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetails(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {receiptReservationId && (
        <ReceiptModal
          reservationId={receiptReservationId}
          isOpen={!!receiptReservationId}
          onClose={() => setReceiptReservationId(null)}
        />
      )}
    </div>
  );
};
