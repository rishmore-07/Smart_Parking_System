export type UserRole = 'guest' | 'driver' | 'operator' | 'admin';

export type VehicleType = 'car' | 'suv' | 'bike' | 'ev' | 'truck';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  auth_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  license_plate: string;
  make: string;
  model: string;
  color?: string;
  vehicle_type: VehicleType;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: User;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
