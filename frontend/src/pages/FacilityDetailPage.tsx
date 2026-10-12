import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { parkingService } from '../services/parkingService';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Accessibility, 
  Star, 
  Clock, 
  Navigation, 
  Info,
  Calendar,
  Car,
  AlertTriangle
} from 'lucide-react';

export const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facilityId = parseInt(id || '0', 10);
  const [showReserveModal, setShowReserveModal] = useState(false);

  const { data: facility, isLoading, isError } = useQuery({
    queryKey: ['facility-detail', facilityId],
    queryFn: () => parkingService.getById(facilityId),
    enabled: !!facilityId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-4 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading parking facility details...</p>
      </div>
    );
  }

  if (isError || !facility) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Facility Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The parking facility you requested could not be located or has been archived.
        </p>
        <button
          onClick={() => navigate('/parking')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-semibold hover:bg-[#0D655E]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Parking Map</span>
        </button>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <div className="mb-5">
        <button
          onClick={() => navigate('/parking')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discovery Map</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Main Information) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-2 ${getTierColor(facility.availability_tier)}`}>
                  {facility.availability_tier} AVAILABILITY
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{facility.name}</h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0F766E] flex-shrink-0" />
                  <span>{facility.address}</span>
                </div>
              </div>

              {/* Rating Card */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-center min-w-[70px]">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-sm text-slate-900">{facility.rating ? facility.rating.toFixed(1) : '4.5'}</span>
                </div>
                <span className="text-[10px] text-slate-500">Verified</span>
              </div>
            </div>

            {facility.description && (
              <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
                {facility.description}
              </p>
            )}
          </div>

          {/* Occupancy and Capacity Snapshot Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#0F766E]" />
              <span>Simulated Real-Time Availability</span>
            </h3>

            {/* Gauge progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600">Available Capacity</span>
                <span className="text-slate-900">
                  {facility.available_spaces} of {facility.total_capacity} spaces free
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(facility.available_spaces / facility.total_capacity) * 100}%` }}
                />
                <div
                  className="bg-slate-300 h-full transition-all duration-500"
                  style={{ width: `${facility.occupancy_percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Free: {facility.available_spaces}</span>
                <span>Occupancy: {facility.occupancy_percentage}%</span>
              </div>
            </div>

            <div className="bg-teal-50/60 rounded-2xl p-3.5 border border-teal-100 flex items-start gap-2.5 text-xs text-teal-800">
              <Info className="w-4 h-4 text-[#0F766E] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Simulated Availability Data</p>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Occupancy numbers reflect simulated database sensor snapshots. In Phase 4/5, real-time automated IoT triggers and gate events will dynamically synchronize live bay status.
                </p>
              </div>
            </div>
          </div>

          {/* Spot Type Breakdown */}
          {facility.spots && facility.spots.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Parking Spot Layout Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="block text-xs text-slate-500 font-medium">Standard Spots</span>
                  <span className="text-lg font-bold text-slate-900">
                    {facility.spots.filter((s) => s.spot_type === 'standard').length}
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="block text-xs text-emerald-700 font-medium">EV Charging Bays</span>
                  <span className="text-lg font-bold text-emerald-800">
                    {facility.spots.filter((s) => s.spot_type === 'ev').length}
                  </span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                  <span className="block text-xs text-indigo-700 font-medium">Accessible Bays</span>
                  <span className="text-lg font-bold text-indigo-800">
                    {facility.spots.filter((s) => s.spot_type === 'handicapped').length}
                  </span>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                  <span className="block text-xs text-[#0F766E] font-medium">Total Bays</span>
                  <span className="text-lg font-bold text-[#0F766E]">{facility.total_capacity}</span>
                </div>
              </div>
            </div>
          )}

          {/* Amenities & Security Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Facility Features & Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                facility.security_available ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-[#0F766E] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">24/7 Security</h4>
                  <p className="text-[10px] text-slate-500">CCTV & security guard</p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                facility.ev_charging_available ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">EV Charging</h4>
                  <p className="text-[10px] text-slate-500">Type 2 fast charging</p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                facility.accessible_parking ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-60'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <Accessibility className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Accessibility</h4>
                  <p className="text-[10px] text-slate-500">Ramps & wide bays</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Hours & Future Reserve Action */}
        <div className="lg:col-span-4 space-y-5 sticky top-20">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parking Rate</span>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                ₹{facility.price_per_hour}
                <span className="text-sm font-normal text-slate-500 ml-1">/ hour</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Operating Hours:
                </span>
                <span className="font-semibold text-slate-800">
                  {facility.opening_time ? `${facility.opening_time} - ${facility.closing_time}` : '24/7 Open'}
                </span>
              </div>

              {facility.distance_text && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Navigation className="w-3.5 h-3.5 text-[#0F766E]" />
                    Estimated Distance:
                  </span>
                  <span className="font-semibold text-[#0F766E]">{facility.distance_text}</span>
                </div>
              )}
            </div>

            {/* Primary CTA: Reserve Parking button (Navigates to future Phase 4 flow) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowReserveModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] hover:from-[#0D655E] hover:to-[#0F766E] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <Calendar className="w-4 h-4" />
                <span>Reserve Parking</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Guaranteed spot reservation with digital entry ticket
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Flow Coming in Phase 4 Modal */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] mx-auto">
              <Calendar className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Reservation Flow (Phase 4)</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You have reached the reservation gateway for <strong className="text-slate-800">{facility.name}</strong>.
                Spot locking, QR access pass generation, and digital payment integration are scheduled for implementation in <strong>Phase 4</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Facility:</span>
                <span className="font-semibold text-slate-800">{facility.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Available Spots:</span>
                <span className="font-semibold text-emerald-600">{facility.available_spaces} spaces</span>
              </div>
              <div className="flex justify-between">
                <span>Rate:</span>
                <span className="font-semibold text-slate-800">₹{facility.price_per_hour}/hr</span>
              </div>
            </div>

            <button
              onClick={() => setShowReserveModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Understood, Back to Facility
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
