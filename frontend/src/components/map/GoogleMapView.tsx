import React, { useEffect, useRef, useState } from 'react';
import type { ParkingFacility } from '../../types/parking';
import { MapPin, Navigation, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

interface GoogleMapViewProps {
  facilities: ParkingFacility[];
  selectedFacility: ParkingFacility | null;
  onSelectFacility: (facility: ParkingFacility) => void;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number; name: string } | null;
  zoom?: number;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  center,
  userLocation,
  destinationLocation,
  zoom = 13,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const navigate = useNavigate();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // 1. Script Loader
  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key is not configured (VITE_GOOGLE_MAPS_API_KEY). Showing interactive simulated map view.');
      return;
    }

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        setMapError('Failed to load Google Maps script. Showing interactive fallback map.');
      };
      document.head.appendChild(script);
    }
  }, [apiKey]);

  // 2. Initialize Map Instance
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google?.maps) return;

    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
        ],
      });
    } else {
      googleMapInstance.current.panTo({ lat: center.lat, lng: center.lng });
    }
  }, [mapLoaded, center, zoom]);

  // 3. User & Destination Markers
  useEffect(() => {
    if (!googleMapInstance.current || !window.google?.maps) return;

    // User location marker
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    if (userLocation) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: userLocation,
        map: googleMapInstance.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
      });
    }

    // Destination marker
    if (destMarkerRef.current) destMarkerRef.current.setMap(null);
    if (destinationLocation) {
      destMarkerRef.current = new window.google.maps.Marker({
        position: destinationLocation,
        map: googleMapInstance.current,
        title: destinationLocation.name,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#9333EA',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });
    }
  }, [userLocation, destinationLocation]);

  // 4. Facility Markers with Availability Coloring
  useEffect(() => {
    if (!googleMapInstance.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    facilities.forEach((facility) => {
      const isSelected = selectedFacility?.id === facility.id;

      // Color code by tier
      let markerColor = '#10B981'; // Green for HIGH
      if (facility.availability_tier === 'MEDIUM') markerColor = '#F59E0B'; // Amber
      if (facility.availability_tier === 'LOW') markerColor = '#EF4444'; // Red
      if (facility.availability_tier === 'FULL') markerColor = '#64748B'; // Slate
      if (isSelected) markerColor = '#0F766E'; // Teal selected

      // SVG Pin with available spaces count inside
      const svgMarker = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="${markerColor}" stroke="#FFFFFF" stroke-width="${isSelected ? '3' : '2'}"/>
            <circle cx="18" cy="18" r="12" fill="#FFFFFF"/>
            <text x="18" y="22" font-size="11" font-family="system-ui, sans-serif" font-weight="bold" fill="${markerColor}" text-anchor="middle">${facility.available_spaces}</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(isSelected ? 42 : 36, isSelected ? 52 : 46),
        anchor: new window.google.maps.Point(18, 46),
      };

      const marker = new window.google.maps.Marker({
        position: { lat: facility.latitude, lng: facility.longitude },
        map: googleMapInstance.current,
        title: `${facility.name} (${facility.available_spaces} spaces)`,
        icon: svgMarker,
        zIndex: isSelected ? 999 : 10,
      });

      marker.addListener('click', () => {
        onSelectFacility(facility);
      });

      markersRef.current.push(marker);
    });
  }, [facilities, selectedFacility, onSelectFacility]);

  // Pan to selected facility
  useEffect(() => {
    if (selectedFacility && googleMapInstance.current) {
      googleMapInstance.current.panTo({
        lat: selectedFacility.latitude,
        lng: selectedFacility.longitude,
      });
    }
  }, [selectedFacility]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
      {/* Map Error Banner or Fallback Notice */}
      {mapError && (
        <div className="absolute top-3 left-3 right-3 z-20 bg-amber-50/95 backdrop-blur-md border border-amber-200 text-amber-900 rounded-xl p-3 text-xs flex items-start gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{mapError}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Interactive fallback radar map active. You can click facilities to preview locations and open details!
            </p>
          </div>
        </div>
      )}

      {/* Primary Map Container */}
      <div ref={mapRef} className="w-full h-full min-h-[420px]" />

      {/* Fallback Interactive SVG Map if Google Maps is not loaded */}
      {(!mapLoaded || mapError) && (
        <div className="absolute inset-0 bg-[#F1F5F9] flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-video bg-white/80 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E] mb-3">
              <MapPin className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">
              Interactive Area Radar View
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Centered near {center.lat.toFixed(4)}, {center.lng.toFixed(4)}. Select any facility below to preview and inspect details.
            </p>

            {/* Simulated mini cluster pins */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md max-h-36 overflow-y-auto">
              {facilities.slice(0, 8).map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => onSelectFacility(fac)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                    selectedFacility?.id === fac.id
                      ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      fac.availability_tier === 'HIGH'
                        ? 'bg-emerald-400'
                        : fac.availability_tier === 'MEDIUM'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="truncate max-w-[120px]">{fac.name}</span>
                  <span className="text-[10px] opacity-80">({fac.available_spaces})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Marker Floating Preview Card */}
      {selectedFacility && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 animate-slideUp">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                {selectedFacility.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {selectedFacility.address}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-bold text-slate-900">₹{selectedFacility.price_per_hour}</span>
              <span className="text-[10px] text-slate-500">/hr</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100 my-2">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {selectedFacility.available_spaces} spaces available
            </span>
            {selectedFacility.distance_text && (
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Navigation className="w-3 h-3 text-[#0F766E]" />
                {selectedFacility.distance_text}
              </span>
            )}
          </div>

          <button
            onClick={() => navigate(`/parking/${selectedFacility.id}`)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold transition-all shadow-sm"
          >
            <span>View Facility Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Availability Legend */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 px-3 py-2 shadow-sm hidden md:flex items-center gap-3 text-[11px] font-medium text-slate-600">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>High (&gt;50%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Med (20-49%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Low (&lt;20%)</span>
        </div>
      </div>
    </div>
  );
};
