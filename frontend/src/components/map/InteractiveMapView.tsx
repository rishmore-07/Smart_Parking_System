import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ParkingFacility } from '../../types/parking';
import { Navigation, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InteractiveMapViewProps {
  facilities: ParkingFacility[];
  selectedFacility: ParkingFacility | null;
  onSelectFacility: (facility: ParkingFacility) => void;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number; name: string } | null;
  zoom?: number;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'HIGH':
      return '#10B981';
    case 'MEDIUM':
      return '#F59E0B';
    case 'LOW':
      return '#EF4444';
    case 'FULL':
      return '#64748B';
    default:
      return '#0F766E';
  }
};

const createFacilityIcon = (facility: ParkingFacility, isSelected: boolean) => {
  const color = isSelected ? '#0F766E' : getTierColor(facility.availability_tier);
  const size = isSelected ? 42 : 36;
  const height = isSelected ? 52 : 46;

  const svgHtml = `
    <div style="cursor: pointer; transform: translate(-50%, -100%); width: ${size}px; height: ${height}px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25)); transition: transform 0.2s ease;">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 36 46">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="${color}" stroke="#FFFFFF" stroke-width="${isSelected ? '3' : '2'}"/>
        <circle cx="18" cy="18" r="11" fill="#FFFFFF"/>
        <text x="18" y="22" font-size="11" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">${facility.available_spaces}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-facility-pin',
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
  });
};

const createUserIcon = () => {
  const svgHtml = `
    <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 0 0 4px rgba(37,99,235,0.3);"></div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-user-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createDestinationIcon = () => {
  const svgHtml = `
    <div style="width: 28px; height: 28px; border-radius: 50%; background: #9333EA; border: 3px solid #FFFFFF; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">★</div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-dest-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  center,
  userLocation,
  destinationLocation,
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.panTo([center.lat, center.lng], { animate: true });
    }
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserIcon(),
        title: 'Your Location',
        zIndexOffset: 1000,
      }).addTo(leafletMapRef.current);
    }

    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    if (destinationLocation) {
      destMarkerRef.current = L.marker([destinationLocation.lat, destinationLocation.lng], {
        icon: createDestinationIcon(),
        title: destinationLocation.name,
        zIndexOffset: 900,
      }).addTo(leafletMapRef.current);
    }
  }, [userLocation, destinationLocation]);

  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    facilities.forEach((facility) => {
      const isSelected = selectedFacility?.id === facility.id;
      const marker = L.marker([facility.latitude, facility.longitude], {
        icon: createFacilityIcon(facility, isSelected),
        title: `${facility.name} (${facility.available_spaces} spaces)`,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectFacility(facility);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [facilities, selectedFacility, onSelectFacility]);

  useEffect(() => {
    if (selectedFacility && leafletMapRef.current) {
      leafletMapRef.current.panTo([selectedFacility.latitude, selectedFacility.longitude], {
        animate: true,
      });
    }
  }, [selectedFacility]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-0" />

      {selectedFacility && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 animate-slideUp">
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

      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 px-3 py-2 shadow-sm hidden md:flex items-center gap-3 text-[11px] font-medium text-slate-600">
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
