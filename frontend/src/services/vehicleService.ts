import { request } from './api';
import type { APIResponse, Vehicle, VehicleType } from '../types';

export interface VehicleCreateInput {
  license_plate: string;
  make: string;
  model: string;
  color?: string;
  vehicle_type: VehicleType;
  is_default?: boolean;
}

export const vehicleService = {
  async list(): Promise<APIResponse<Vehicle[]>> {
    return request<APIResponse<Vehicle[]>>('/vehicles/');
  },

  async create(data: VehicleCreateInput): Promise<APIResponse<Vehicle>> {
    return request<APIResponse<Vehicle>>('/vehicles/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<VehicleCreateInput>): Promise<APIResponse<Vehicle>> {
    return request<APIResponse<Vehicle>>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<APIResponse<{ deleted_id: number }>> {
    return request<APIResponse<{ deleted_id: number }>>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },

  async setDefault(id: number): Promise<APIResponse<Vehicle>> {
    return request<APIResponse<Vehicle>>(`/vehicles/${id}/default`, {
      method: 'PUT',
    });
  },
};
