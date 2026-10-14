import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { vehicleService } from '../../services/vehicleService';
import { reservationService } from '../../services/reservationService';
import type { Reservation, SpotType, ReservationEstimate, SpaceAvailabilityItem } from '../../types/reservation';
import type { Vehicle } from '../../types';
import {
  Calendar,
  Clock,
  Car,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

interface BookingModalProps {
  facility: {
    id: number;
    name: string;
    address: string;
    price_per_hour: number;
    opening_time?: string | null;
    closing_time?: string | null;
    ev_charging_available?: boolean;
    accessible_parking?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  facility,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Date and Time State
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];
  const formatTimeForInput = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    return `${hours}:00`;
  };

  const [date, setDate] = useState<string>(formatDateForInput(now));
  const [startTime, setStartTime] = useState<string>(formatTimeForInput(now));
  const [endTime, setEndTime] = useState<string>(formatTimeForInput(tomorrow));

  // Vehicle Selection State
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Spot Selection Mode
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [selectedSpotType, setSelectedSpotType] = useState<SpotType>('standard');
  const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);

  // Pricing & Availability State
  const [estimate, setEstimate] = useState<ReservationEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  // Booking Execution State
  const [step, setStep] = useState<'configure' | 'review'>('configure');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch driver vehicles
  const { data: vehiclesRes } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => vehicleService.list(),
    enabled: isAuthenticated && isOpen,
  });

  const vehicles: Vehicle[] = vehiclesRes?.data || [];
  const activeVehicleId = selectedVehicleId ?? (vehicles.find((v) => v.is_default)?.id ?? vehicles[0]?.id ?? null);

  // Construct ISO timestamps
  const getTimestamps = React.useCallback(() => {
    const startIso = `${date}T${startTime}:00`;
    const endIso = `${date}T${endTime}:00`;
    return { startIso, endIso };
  }, [date, startTime, endTime]);

  // Fetch spaces availability if in manual mode
  const { data: spacesRes, isLoading: spacesLoading } = useQuery({
    queryKey: ['facility-spaces', facility.id, date, startTime, endTime],
    queryFn: async () => {
      const { startIso, endIso } = getTimestamps();
      return reservationService.getFacilitySpaces(facility.id, startIso, endIso);
    },
    enabled: isOpen && selectionMode === 'manual',
  });

  const spaces: SpaceAvailabilityItem[] = spacesRes?.data || [];

  // Recalculate Estimate
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchEstimate = async () => {
      setEstimateLoading(true);
      setEstimateError(null);

      const { startIso, endIso } = getTimestamps();
      const startDate = new Date(startIso);
      const endDate = new Date(endIso);

      if (endDate <= startDate) {
        setEstimateError('End time must be after start time.');
        setEstimate(null);
        setEstimateLoading(false);
        return;
      }

      try {
        const res = await reservationService.estimate({
          facility_id: facility.id,
          start_time: startIso,
          end_time: endIso,
          spot_id: selectionMode === 'manual' ? selectedSpotId : null,
          spot_type: selectionMode === 'auto' ? selectedSpotType : null,
        });

        if (isMounted) {
          if (res.success && res.data) {
            setEstimate(res.data);
            if (!res.data.available) {
              setEstimateError(res.data.message || 'No parking spaces available for the chosen interval.');
            }
          } else {
            setEstimateError(res.message || 'Could not verify availability.');
            setEstimate(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setEstimateError(err.message || 'Error checking availability & fee.');
          setEstimate(null);
        }
      } finally {
        if (isMounted) setEstimateLoading(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, date, startTime, endTime, selectionMode, selectedSpotType, selectedSpotId, facility.id]);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign in to Reserve</h3>
          <p className="text-xs text-slate-500">
            You must be signed in as a registered driver with a vehicle to book a parking spot at{' '}
            <strong className="text-slate-700">{facility.name}</strong>.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#0D655E]"
            >
              Log In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleConfirmReservation = async () => {
    if (!activeVehicleId) {
      setSubmitError('Please select a vehicle for this reservation.');
      return;
    }
    if (!estimate || !estimate.available) {
      setSubmitError('Selected space or time interval is not available.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { startIso, endIso } = getTimestamps();

    try {
      const res = await reservationService.create({
        facility_id: facility.id,
        vehicle_id: activeVehicleId,
        start_time: startIso,
        end_time: endIso,
        spot_id: selectionMode === 'manual' ? selectedSpotId : null,
        spot_type: selectionMode === 'auto' ? selectedSpotType : null,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setSubmitError(res.message || 'Reservation failed. Please check space availability.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === activeVehicleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl my-auto overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">Reserve Parking</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Phase 4 Verified</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{facility.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {step === 'configure' ? (
            <>
              {/* 1. Date & Time Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Reservation Schedule</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">Booking Date</span>
                    <input
                      type="date"
                      min={formatDateForInput(new Date())}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">Start Time</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">End Time</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Vehicle Selector */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Select Vehicle</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/vehicles')}
                    className="text-[11px] text-[#0F766E] hover:underline font-semibold"
                  >
                    + Add New Vehicle
                  </button>
                </div>

                {vehicles.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                    <span>You have no registered vehicles. Please register a vehicle to proceed.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/vehicles')}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold"
                    >
                      Garage
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicles.map((v) => {
                      const isSelected = activeVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#0F766E]/5 border-[#0F766E] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isSelected ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {v.vehicle_type === 'ev' ? <Zap className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{v.license_plate}</div>
                              <div className="text-[10px] text-slate-500">{v.make} {v.model}</div>
                            </div>
                          </div>
                          {v.is_default && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                              Primary
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Space Selection Mode */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>Parking Space Selection</span>
                  </label>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode('auto');
                        setSelectedSpotId(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        selectionMode === 'auto' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Auto Assign
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectionMode('manual')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        selectionMode === 'manual' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Select Spot
                    </button>
                  </div>
                </div>

                {selectionMode === 'auto' ? (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['standard', 'ev', 'compact'] as SpotType[]).map((type) => {
                      const isSelected = selectedSpotType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedSpotType(type)}
                          className={`p-2.5 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-[#0F766E] text-[#0F766E] font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="capitalize">{type} Bay</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-normal">Auto-assigned</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-500">Pick an available parking bay for this time slot:</span>
                    {spacesLoading ? (
                      <div className="p-4 text-center text-xs text-slate-400">Loading bay map...</div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-2xl">
                        {spaces.map((sp) => {
                          const isSelected = selectedSpotId === sp.id;
                          return (
                            <button
                              key={sp.id}
                              type="button"
                              disabled={!sp.is_available}
                              onClick={() => setSelectedSpotId(sp.id)}
                              className={`p-2 rounded-xl border text-center transition-all text-xs font-bold ${
                                isSelected
                                  ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                                  : sp.is_available
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <div>{sp.spot_number}</div>
                              <div className="text-[9px] uppercase font-normal">{sp.spot_type}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Live Server-Side Price Estimate Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Estimated Duration:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {estimate ? `${estimate.duration_hours} hrs (${estimate.billed_hours} hrs billed)` : 'Calculating...'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Base Rate:</span>
                  <span className="font-semibold text-slate-800">₹{facility.price_per_hour}/hr</span>
                </div>

                {estimate?.assigned_spot_number && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Allocated Space:</span>
                    <span className="font-semibold text-teal-800">
                      Bay {estimate.assigned_spot_number} ({estimate.assigned_spot_type})
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Estimated Total Fee:</span>
                  <span className="text-base font-extrabold text-[#0F766E]">
                    {estimate ? `₹${estimate.total_amount}` : '—'}
                  </span>
                </div>

                {estimateError && (
                  <div className="pt-1 text-rose-600 text-[11px] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{estimateError}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Review Step */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>Review Booking Details</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Facility</span>
                    <span className="font-bold text-slate-800">{facility.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Vehicle</span>
                    <span className="font-bold text-slate-800">
                      {selectedVehicle?.license_plate} ({selectedVehicle?.make})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Start Time</span>
                    <span className="font-bold text-slate-800">{date} at {startTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">End Time</span>
                    <span className="font-bold text-slate-800">{date} at {endTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Assigned Space</span>
                    <span className="font-bold text-teal-800">
                      {estimate?.assigned_spot_number ? `Bay ${estimate.assigned_spot_number}` : 'Auto Confirmed'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Estimated Fee</span>
                    <span className="text-sm font-extrabold text-[#0F766E]">₹{estimate?.total_amount}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Cancellation & Reservation Policy</span>
                </div>
                <p>
                  Free cancellation is permitted any time before the scheduled start time ({date} {startTime}).
                  No upfront credit card payment is required in this phase.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          {step === 'configure' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!estimate?.available || estimateLoading || vehicles.length === 0}
                onClick={() => setStep('review')}
                className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Review & Confirm</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setStep('configure')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmReservation}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] hover:from-[#0D655E] hover:to-[#0F766E] text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Locking Space...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
