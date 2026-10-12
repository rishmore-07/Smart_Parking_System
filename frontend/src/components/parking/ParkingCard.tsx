import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParkingFacility } from '../../types/parking';
import { 
  ShieldCheck, 
  Zap, 
  Accessibility, 
  Star, 
  Navigation, 
  ArrowRight
} from 'lucide-react';

interface ParkingCardProps {
  facility: ParkingFacility;
  isSelected?: boolean;
  onSelect?: (facility: ParkingFacility) => void;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  facility,
  isSelected = false,
  onSelect,
}) => {
  const navigate = useNavigate();

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            High Availability
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
            Few Spaces Left
          </span>
        );
      case 'FULL':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
            Full
          </span>
        );
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(facility);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/parking/${facility.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl bg-white p-4 sm:p-5 border transition-all cursor-pointer shadow-sm hover:shadow-md ${
        isSelected
          ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 bg-teal-50/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate text-base group-hover:text-[#0F766E] transition-colors">
              {facility.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 truncate mb-2">{facility.address}</p>
        </div>

        {/* Pricing badge */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            ₹{facility.price_per_hour}
            <span className="text-xs font-normal text-slate-500">/hr</span>
          </div>
          {facility.distance_text && (
            <div className="inline-flex items-center text-[11px] font-medium text-[#0F766E] mt-0.5">
              <Navigation className="w-3 h-3 mr-1 rotate-45" />
              {facility.distance_text}
            </div>
          )}
        </div>
      </div>

      {/* Availability gauge and metadata */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getTierBadge(facility.availability_tier)}
          <span className="text-xs font-medium text-slate-700">
            <span className="font-bold text-slate-900">{facility.available_spaces}</span>
            <span className="text-slate-400">/{facility.total_capacity} spots</span>
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-100">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{facility.rating ? facility.rating.toFixed(1) : '4.5'}</span>
        </div>
      </div>

      {/* Amenity tags */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {facility.security_available && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] text-slate-600 font-medium"
              title="24/7 CCTV & Security Guard"
            >
              <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
              Security
            </span>
          )}
          {facility.ev_charging_available && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[11px] text-emerald-700 font-medium"
              title="Electric Vehicle Fast Charging Available"
            >
              <Zap className="w-3 h-3 text-emerald-600" />
              EV Charge
            </span>
          )}
          {facility.accessible_parking && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-[11px] text-indigo-700 font-medium"
              title="Accessible Parking Spot Available"
            >
              <Accessibility className="w-3 h-3 text-indigo-600" />
              Accessible
            </span>
          )}
        </div>

        <button
          onClick={handleViewDetails}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F766E] hover:text-[#0D655E] bg-[#0F766E]/10 hover:bg-[#0F766E]/20 px-3 py-1.5 rounded-lg transition-colors ml-auto"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
