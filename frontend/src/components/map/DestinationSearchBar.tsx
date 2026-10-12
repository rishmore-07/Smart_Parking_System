import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, LocateFixed, X, Sparkles, AlertCircle } from 'lucide-react';

interface DestinationSearchBarProps {
  onSelectDestination: (dest: {
    lat: number;
    lng: number;
    address: string;
    name: string;
  }) => void;
  onUseCurrentLocation: () => void;
  isLoadingLocation: boolean;
  locationError?: string | null;
  activeDestinationName?: string;
  onClearDestination?: () => void;
}

export const DestinationSearchBar: React.FC<DestinationSearchBarProps> = ({
  onSelectDestination,
  onUseCurrentLocation,
  isLoadingLocation,
  locationError,
  activeDestinationName,
  onClearDestination,
}) => {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick preset destinations for Mumbai demo area
  const presets = [
    { name: 'BKC Central', address: 'Bandra Kurla Complex, Mumbai', lat: 19.0655, lng: 72.8643 },
    { name: 'Colaba Causeway', address: 'Colaba, South Mumbai', lat: 18.9171, lng: 72.8277 },
    { name: 'Nariman Point', address: 'Nariman Point, Mumbai', lat: 18.9260, lng: 72.8231 },
    { name: 'Lower Parel', address: 'High Street Phoenix, Lower Parel', lat: 18.9940, lng: 72.8252 },
    { name: 'Andheri Metro', address: 'Andheri East Station, Mumbai', lat: 19.1136, lng: 72.8697 },
    { name: 'Powai Gardens', address: 'Hiranandani Gardens, Powai', lat: 19.1197, lng: 72.9091 },
  ];

  // Try Google Places AutocompleteService if window.google is loaded
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setPredictions([]);
      return;
    }

    if (window.google?.maps?.places?.AutocompleteService) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
        },
        (results: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      // Offline / fallback filter presets
      const filtered = presets.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.address.toLowerCase().includes(query.toLowerCase())
      );
      setPredictions(
        filtered.map((p) => ({
          description: `${p.name}, ${p.address}`,
          structured_formatting: { main_text: p.name, secondary_text: p.address },
          preset: p,
        }))
      );
    }
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPrediction = (prediction: any) => {
    if (prediction.preset) {
      const p = prediction.preset;
      onSelectDestination({
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        name: p.name,
      });
      setQuery(p.name);
      setIsOpen(false);
      return;
    }

    if (window.google?.maps?.places?.PlacesService && prediction.place_id) {
      const dummyElement = document.createElement('div');
      const placesService = new window.google.maps.places.PlacesService(dummyElement);
      placesService.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['name', 'formatted_address', 'geometry'],
        },
        (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            onSelectDestination({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || prediction.description,
              name: place.name || prediction.structured_formatting?.main_text || 'Selected Destination',
            });
            setQuery(place.name || prediction.structured_formatting?.main_text || '');
            setIsOpen(false);
          }
        }
      );
    } else {
      // Fallback
      setQuery(prediction.structured_formatting?.main_text || prediction.description);
      setIsOpen(false);
    }
  };

  const handleSelectPreset = (p: typeof presets[0]) => {
    onSelectDestination({
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      name: p.name,
    });
    setQuery(p.name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-[#0F766E]/20 focus-within:border-[#0F766E] transition-all overflow-hidden p-1 sm:p-1.5">
        <div className="pl-3 pr-2 text-slate-400">
          <Search className="w-5 h-5 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={activeDestinationName ? `Destination: ${activeDestinationName}` : "Where do you want to park? (e.g. BKC, Nariman Point...)"}
          className="w-full py-2.5 px-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              if (onClearDestination) onClearDestination();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* GPS Current Location button */}
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#0D655E] disabled:opacity-60 transition-all flex-shrink-0 shadow-sm"
          title="Detect and use current device location"
        >
          <LocateFixed className={`w-3.5 h-3.5 ${isLoadingLocation ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isLoadingLocation ? 'Locating...' : 'Use My Location'}
          </span>
        </button>
      </div>

      {/* Geolocation Error banner */}
      {locationError && (
        <div className="mt-2 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Autocomplete Predictions & Quick presets drop-down */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto animate-fadeIn">
          {/* Autocomplete Results */}
          {predictions.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Locations
              </div>
              {predictions.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPrediction(p)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {p.structured_formatting?.main_text || p.description}
                    </p>
                    {p.structured_formatting?.secondary_text && (
                      <p className="text-xs text-slate-400 truncate">
                        {p.structured_formatting.secondary_text}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Popular Area Presets */
            <div className="p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Popular Parking Hubs in Mumbai</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#0F766E]/40 hover:bg-teal-50/30 transition-all flex items-start gap-2 group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F766E] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#0F766E]">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{p.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
