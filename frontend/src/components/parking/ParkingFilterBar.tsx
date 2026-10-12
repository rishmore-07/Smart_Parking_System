import React, { useState } from 'react';
import type { ParkingSearchFilters } from '../../types/parking';
import { 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  ShieldCheck, 
  Accessibility, 
  Check
} from 'lucide-react';

interface ParkingFilterBarProps {
  filters: ParkingSearchFilters;
  onChange: (filters: ParkingSearchFilters) => void;
  onClear: () => void;
  totalCount: number;
}

export const ParkingFilterBar: React.FC<ParkingFilterBarProps> = ({
  filters,
  onChange,
  onClear,
  totalCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const radiusOptions = [
    { label: '1 km', value: 1.0 },
    { label: '3 km', value: 3.0 },
    { label: '5 km', value: 5.0 },
    { label: '10 km', value: 10.0 },
  ];

  const priceRanges = [
    { label: 'Any', min: undefined, max: undefined },
    { label: '₹0–₹50', min: 0, max: 50 },
    { label: '₹50–₹100', min: 50, max: 100 },
    { label: '₹100+', min: 100, max: undefined },
  ];

  const availabilityOptions = [
    { label: 'Any', value: undefined },
    { label: 'Available now', value: 1 },
    { label: '>10 spaces', value: 10 },
    { label: '>25 spaces', value: 25 },
  ];

  const ratingOptions = [
    { label: 'Any', value: undefined },
    { label: '★ 3+', value: 3.0 },
    { label: '★ 4+', value: 4.0 },
  ];

  const sortOptions = [
    { label: 'Nearest', value: 'distance' },
    { label: 'Cheapest', value: 'price' },
    { label: 'Most Available', value: 'available' },
    { label: 'Best Rated', value: 'rating' },
  ];

  const hasActiveFilters = Boolean(
    (filters.radius_km && filters.radius_km !== 5.0) ||
    filters.min_price !== undefined ||
    filters.max_price !== undefined ||
    filters.min_available !== undefined ||
    filters.has_ev ||
    filters.has_accessibility ||
    filters.has_security ||
    filters.min_rating ||
    (filters.sort_by && filters.sort_by !== 'distance')
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
      {/* Top summary row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {totalCount} Parking {totalCount === 1 ? 'Facility' : 'Facilities'} Found
            </h2>
            <p className="text-[11px] text-slate-500">Filter and sort by distance, price & amenities</p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          {/* Sorting dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={filters.sort_by || 'distance'}
              onChange={(e) => onChange({ ...filters, sort_by: e.target.value as any })}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle expand button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Filters</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Clear button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable filter controls */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 animate-fadeIn">
          {/* Radius pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Distance Radius</label>
            <div className="flex flex-wrap gap-1.5">
              {radiusOptions.map((r) => {
                const isActive = (filters.radius_km || 5.0) === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onChange({ ...filters, radius_km: r.value })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#0F766E] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hourly Rate</label>
            <div className="flex flex-wrap gap-1.5">
              {priceRanges.map((p, idx) => {
                const isActive =
                  filters.min_price === p.min && filters.max_price === p.max;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange({ ...filters, min_price: p.min, max_price: p.max })}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#0F766E] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability and Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Available Spaces</label>
              <div className="flex flex-wrap gap-1.5">
                {availabilityOptions.map((a, idx) => {
                  const isActive = filters.min_available === a.value;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChange({ ...filters, min_available: a.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#0F766E] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Minimum Rating</label>
              <div className="flex flex-wrap gap-1.5">
                {ratingOptions.map((rt, idx) => {
                  const isActive = filters.min_rating === rt.value;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChange({ ...filters, min_rating: rt.value })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#0F766E] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {rt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Amenities Toggles */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Features & Amenities</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...filters, has_security: !filters.has_security })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters.has_security
                    ? 'bg-teal-50 border-[#0F766E] text-[#0F766E]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>24/7 Security</span>
                {filters.has_security && <Check className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...filters, has_ev: !filters.has_ev })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters.has_ev
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>EV Charging</span>
                {filters.has_ev && <Check className="w-3 h-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...filters, has_accessibility: !filters.has_accessibility })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filters.has_accessibility
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Accessibility className="w-3.5 h-3.5" />
                <span>Accessible Parking</span>
                {filters.has_accessibility && <Check className="w-3 h-3 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
