import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService } from '../../services/paymentService';
import { 
  X, 
  CheckCircle2, 
  Printer, 
  Receipt as ReceiptIcon,
  ShieldCheck,
  CreditCard,
  Building,
  Car,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ReceiptModalProps {
  reservationId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  reservationId,
  isOpen,
  onClose,
}) => {
  const { data: receiptData, isLoading, isError } = useQuery({
    queryKey: ['receipt', reservationId],
    queryFn: () => paymentService.getReservationReceipt(reservationId),
    enabled: isOpen && !!reservationId,
  });

  if (!isOpen) return null;

  const receipt = receiptData?.data;
  let parsedDetails: any = {};
  if (receipt?.details_json) {
    try {
      parsedDetails = JSON.parse(receipt.details_json);
    } catch {
      parsedDetails = {};
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs">
              <ReceiptIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display">Payment Receipt</h2>
              <p className="text-xs text-white/80 font-medium">Verified Digital Transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Fetching secure receipt...</p>
            </div>
          ) : isError || !receipt ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Receipt Not Available</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No verified payment receipt found for this reservation. Ensure payment has been completed.
              </p>
            </div>
          ) : (
            <>
              {/* Receipt Number Badge */}
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Receipt Reference
                  </span>
                  <p className="text-sm font-mono font-bold text-emerald-950">
                    {receipt.receipt_number}
                  </p>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PAID</span>
                </div>
              </div>

              {/* Details Breakdown */}
              <div className="space-y-3 text-xs divide-y divide-slate-100">
                {parsedDetails.facility_name && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      Parking Facility
                    </span>
                    <span className="font-semibold text-slate-800 text-right">
                      {parsedDetails.facility_name}
                    </span>
                  </div>
                )}

                {parsedDetails.booking_code && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Booking Code
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {parsedDetails.booking_code}
                    </span>
                  </div>
                )}

                {parsedDetails.spot_number && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">Assigned Spot</span>
                    <span className="font-semibold text-slate-800">
                      Spot {parsedDetails.spot_number}
                    </span>
                  </div>
                )}

                {parsedDetails.vehicle_plate && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      Vehicle Plate
                    </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {parsedDetails.vehicle_plate}
                    </span>
                  </div>
                )}

                {parsedDetails.razorpay_payment_id && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Payment Transaction ID
                    </span>
                    <span className="font-mono text-slate-700">
                      {parsedDetails.razorpay_payment_id}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Transaction Date
                  </span>
                  <span className="text-slate-700">
                    {new Date(receipt.created_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{receipt.subtotal_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Taxes & Platform Fees</span>
                  <span>₹{receipt.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200/80">
                  <span>Total Amount Paid</span>
                  <span className="text-[#0F766E] text-base">₹{receipt.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold flex items-center justify-center transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
