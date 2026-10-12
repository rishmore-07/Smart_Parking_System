export type AvailabilityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'FULL';

export interface ParkingFacility {
  id: number;
  name: string;
  description?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  available_capacity?: number;
  available_spaces: number;
  price_per_hour: number;
  distance_km?: number;
  distance_text?: string;
  occupancy_percentage: number;
  availability_tier: AvailabilityTier;
  rating?: number | null;
  security_available: boolean;
  ev_charging_available: boolean;
  accessible_parking: boolean;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE' | 'FULL';
  opening_time?: string | null;
  closing_time?: string | null;
}

export interface SpotSummary {
  id: number;
  spot_number: string;
  floor: string;
  spot_type: string;
  status: string;
  is_active: boolean;
}

export interface OccupancySnapshotSummary {
  id: number;
  occupied_spots: number;
  total_spots: number;
  occupancy_rate: number;
  recorded_at: string;
}

export interface FacilityDetail extends ParkingFacility {
  spots: SpotSummary[];
  recent_occupancy: OccupancySnapshotSummary[];
}

export interface ParkingSearchFilters {
  radius_km?: number;
  min_price?: number;
  max_price?: number;
  min_available?: number;
  has_ev?: boolean;
  has_accessibility?: boolean;
  has_security?: boolean;
  min_rating?: number;
  sort_by?: 'distance' | 'price' | 'available' | 'most_available' | 'rating' | 'best_rated' | 'nearest';
}

export interface NearbyResponse {
  items: ParkingFacility[];
  total: number;
  center_lat?: number;
  center_lng?: number;
  radius_km?: number;
}
