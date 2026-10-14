import { request } from './api';
import type { APIResponse } from '../types';
import type {
  Reservation,
  CreateReservationPayload,
  ReservationEstimatePayload,
  ReservationEstimate,
  FacilityAvailability,
  SpaceAvailabilityItem,
} from '../types/reservation';

export const reservationService = {
  async create(data: CreateReservationPayload): Promise<APIResponse<Reservation>> {
    return request<APIResponse<Reservation>>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async estimate(data: ReservationEstimatePayload): Promise<APIResponse<ReservationEstimate>> {
    return request<APIResponse<ReservationEstimate>>('/reservations/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMyReservations(filterType?: string, status?: string): Promise<APIResponse<Reservation[]>> {
    const params = new URLSearchParams();
    if (filterType) params.append('filter_type', filterType);
    if (status) params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<APIResponse<Reservation[]>>(`/reservations/me${qs}`);
  },

  async getById(id: number): Promise<APIResponse<Reservation>> {
    return request<APIResponse<Reservation>>(`/reservations/${id}`);
  },

  async cancel(id: number, reason?: string): Promise<APIResponse<Reservation>> {
    return request<APIResponse<Reservation>>(`/reservations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Cancelled by driver' }),
    });
  },

  async getFacilityAvailability(
    facilityId: number,
    startTime: string,
    endTime: string
  ): Promise<APIResponse<FacilityAvailability>> {
    const params = new URLSearchParams({
      start_time: startTime,
      end_time: endTime,
    });
    return request<APIResponse<FacilityAvailability>>(`/facilities/${facilityId}/availability?${params.toString()}`);
  },

  async getFacilitySpaces(
    facilityId: number,
    startTime: string,
    endTime: string
  ): Promise<APIResponse<SpaceAvailabilityItem[]>> {
    const params = new URLSearchParams({
      start_time: startTime,
      end_time: endTime,
    });
    return request<APIResponse<SpaceAvailabilityItem[]>>(`/facilities/${facilityId}/spaces/availability?${params.toString()}`);
  },

  async getOperatorReservations(params?: {
    facility_id?: number;
    status?: string;
  }): Promise<APIResponse<Reservation[]>> {
    const query = new URLSearchParams();
    if (params?.facility_id) query.append('facility_id', params.facility_id.toString());
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<APIResponse<Reservation[]>>(`/operator/reservations${qs}`);
  },

  async updateOperatorStatus(id: number, status: string): Promise<APIResponse<Reservation>> {
    return request<APIResponse<Reservation>>(`/operator/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getAdminReservations(params?: {
    facility_id?: number;
    user_id?: number;
    status?: string;
  }): Promise<APIResponse<Reservation[]>> {
    const query = new URLSearchParams();
    if (params?.facility_id) query.append('facility_id', params.facility_id.toString());
    if (params?.user_id) query.append('user_id', params.user_id.toString());
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<APIResponse<Reservation[]>>(`/admin/reservations${qs}`);
  },
};
