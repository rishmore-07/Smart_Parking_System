import { request } from './api';
import type { NearbyResponse, FacilityDetail, ParkingSearchFilters } from '../types/parking';

export const parkingService = {
  getNearby: async (
    lat: number,
    lng: number,
    filters: ParkingSearchFilters = {},
    skip = 0,
    limit = 100
  ): Promise<NearbyResponse> => {
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lng', lng.toString());
    if (filters.radius_km !== undefined) params.append('radius_km', filters.radius_km.toString());
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.min_available !== undefined) params.append('min_available', filters.min_available.toString());
    if (filters.has_ev !== undefined && filters.has_ev) params.append('has_ev', 'true');
    if (filters.has_accessibility !== undefined && filters.has_accessibility) params.append('has_accessibility', 'true');
    if (filters.has_security !== undefined && filters.has_security) params.append('has_security', 'true');
    if (filters.min_rating !== undefined && filters.min_rating > 0) params.append('min_rating', filters.min_rating.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const res = await request<{ success: boolean; data: NearbyResponse }>(`/parking/nearby?${params.toString()}`);
    return res.data;
  },

  search: async (
    queryText?: string,
    lat?: number,
    lng?: number,
    filters: ParkingSearchFilters = {},
    skip = 0,
    limit = 100
  ): Promise<NearbyResponse> => {
    const params = new URLSearchParams();
    if (queryText && queryText.trim()) params.append('q', queryText.trim());
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lng !== undefined) params.append('lng', lng.toString());
    if (filters.radius_km !== undefined) params.append('radius_km', filters.radius_km.toString());
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.min_available !== undefined) params.append('min_available', filters.min_available.toString());
    if (filters.has_ev !== undefined && filters.has_ev) params.append('has_ev', 'true');
    if (filters.has_accessibility !== undefined && filters.has_accessibility) params.append('has_accessibility', 'true');
    if (filters.has_security !== undefined && filters.has_security) params.append('has_security', 'true');
    if (filters.min_rating !== undefined && filters.min_rating > 0) params.append('min_rating', filters.min_rating.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());

    const res = await request<{ success: boolean; data: NearbyResponse }>(`/parking/search?${params.toString()}`);
    return res.data;
  },

  getById: async (facilityId: number, lat?: number, lng?: number): Promise<FacilityDetail> => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat.toString());
    if (lng !== undefined) params.append('lng', lng.toString());
    const query = params.toString() ? `?${params.toString()}` : '';

    const res = await request<{ success: boolean; data: FacilityDetail }>(`/parking/${facilityId}${query}`);
    return res.data;
  },
};

