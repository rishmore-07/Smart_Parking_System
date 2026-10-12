import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parkingService } from '../services/parkingService';
import type { ParkingFacility, ParkingSearchFilters } from '../types/parking';
import { ParkingCard } from '../components/parking/ParkingCard';
import { ParkingFilterBar } from '../components/parking/ParkingFilterBar';
import { DestinationSearchBar } from '../components/map/DestinationSearchBar';
import { InteractiveMapView } from '../components/map/InteractiveMapView';
import { GoogleMapView } from '../components/map/GoogleMapView';
import { 
  Search, 
  List, 
  Map as MapIcon, 
  AlertCircle
} from 'lucide-react';

export const FindParkingPage: React.FC = () => {
  // Center default: BKC Mumbai (19.0655, 72.8643)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 19.0655,
    lng: 72.8643,
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    address: string;
  } | null>(null);

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<ParkingFacility | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // Filters state
  const [filters, setFilters] = useState<ParkingSearchFilters>({
    radius_km: 5.0,
    sort_by: 'distance',
  });

  // Query facilities
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['parking-discovery', center.lat, center.lng, destinationLocation?.name, filters],
    queryFn: async () => {
      if (destinationLocation?.name) {
        return parkingService.search(
          destinationLocation.name,
          center.lat,
          center.lng,
          filters
        );
      }
      return parkingService.getNearby(center.lat, center.lng, filters);
    },
  });

  const facilities = data?.items || [];
  const totalCount = data?.total || 0;

  // Browser Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setCenter(coords);
        setDestinationLocation(null);
        setIsLoadingLocation(false);
      },
      (err) => {
        setIsLoadingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. You can manually search any area or destination above.');
        } else {
          setLocationError('Unable to retrieve your location. Please check your GPS/network settings.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Destination select handler
  const handleSelectDestination = (dest: {
    lat: number;
    lng: number;
    address: string;
    name: string;
  }) => {
    setDestinationLocation(dest);
    setCenter({ lat: dest.lat, lng: dest.lng });
    setLocationError(null);
  };

  const handleClearDestination = () => {
    setDestinationLocation(null);
  };

  const handleClearFilters = () => {
    setFilters({
      radius_km: 5.0,
      sort_by: 'distance',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Top Search Banner */}
      <div className="mb-4">
        <DestinationSearchBar
          onSelectDestination={handleSelectDestination}
          onUseCurrentLocation={handleUseCurrentLocation}
          isLoadingLocation={isLoadingLocation}
          locationError={locationError}
          activeDestinationName={destinationLocation?.name}
          onClearDestination={handleClearDestination}
        />
      </div>

      {/* Mobile Map / List Segment Toggle */}
      <div className="flex md:hidden bg-slate-200/80 p-1 rounded-xl mb-3">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'map' ? 'bg-white text-[#0F766E] shadow-sm' : 'text-slate-600'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map View</span>
        </button>
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'list' ? 'bg-white text-[#0F766E] shadow-sm' : 'text-slate-600'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>List ({totalCount})</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout (Desktop: 40% Results, 60% Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Filter Bar + Parking Cards List */}
        <div
          className={`lg:col-span-5 flex flex-col space-y-3.5 order-2 lg:order-1 ${
            mobileTab === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <ParkingFilterBar
            filters={filters}
            onChange={setFilters}
            onClear={handleClearFilters}
            totalCount={totalCount}
          />

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm animate-pulse space-y-3"
                >
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center text-rose-800">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <h3 className="font-bold text-sm">Failed to retrieve parking data</h3>
              <p className="text-xs text-rose-600 mt-1 mb-3">
                Unable to contact the backend service. Please check your network connection.
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty Results State */}
          {!isLoading && !isError && facilities.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Parking Facilities Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                No parking facilities matched your current location or filter criteria. Try expanding the radius or clearing filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-[#0F766E] text-white rounded-xl text-xs font-semibold hover:bg-[#0D655E]"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Cards List with Scroll */}
          {!isLoading && !isError && facilities.length > 0 && (
            <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {facilities.map((facility) => (
                <ParkingCard
                  key={facility.id}
                  facility={facility}
                  isSelected={selectedFacility?.id === facility.id}
                  onSelect={(fac) => {
                    setSelectedFacility(fac);
                    setCenter({ lat: fac.latitude, lng: fac.longitude });
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Map (Google Maps if API key provided, otherwise Interactive OpenStreetMap) */}
        <div
          className={`lg:col-span-7 h-[calc(100vh-200px)] min-h-[460px] sticky top-20 order-1 lg:order-2 ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
            <GoogleMapView
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={(fac) => setSelectedFacility(fac)}
              center={center}
              userLocation={userLocation}
              destinationLocation={destinationLocation}
            />
          ) : (
            <InteractiveMapView
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={(fac) => setSelectedFacility(fac)}
              center={center}
              userLocation={userLocation}
              destinationLocation={destinationLocation}
            />
          )}
        </div>
      </div>
    </div>
  );
};
