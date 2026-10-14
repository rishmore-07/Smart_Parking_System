import type { VehicleType } from './index';

export type ReservationStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export type SpotType = 'standard' | 'compact' | 'ev' | 'handicapped' | 'bike';

export interface FacilityBrief {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price_per_hour: number;
  opening_time?: string | null;
  closing_time?: string | null;
}

export interface SpotBrief {
  id: number;
  spot_number: string;
  floor: string;
  spot_type: SpotType;
}

export interface VehicleBrief {
  id: number;
  license_plate: string;
  make: string;
  model: string;
  color?: string;
  vehicle_type: VehicleType;
}

export interface UserBrief {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
}

export interface PaymentBrief {
  id: number;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
}

export interface Reservation {
  id: number;
  booking_code: string;
  user_id: number;
  facility_id: number;
  spot_id?: number | null;
  vehicle_id: number;
  start_time: string;
  end_time: string;
  total_amount: number;
  rate_per_hour?: number;
  currency: string;
  status: ReservationStatus;
  check_in_time?: string | null;
  check_out_time?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;

  facility?: FacilityBrief;
  spot?: SpotBrief;
  vehicle?: VehicleBrief;
  user?: UserBrief;
  payment?: PaymentBrief;
}


export interface CreateReservationPayload {
  facility_id: number;
  vehicle_id: number;
  start_time: string;
  end_time: string;
  spot_id?: number | null;
  spot_type?: SpotType | null;
}

export interface ReservationEstimatePayload {
  facility_id: number;
  start_time: string;
  end_time: string;
  spot_id?: number | null;
  spot_type?: SpotType | null;
}

export interface ReservationEstimate {
  facility_id: number;
  start_time: string;
  end_time: string;
  duration_hours: number;
  billed_hours: number;
  rate_per_hour: number;
  total_amount: number;
  currency: string;
  available: boolean;
  available_spaces: number;
  assigned_spot_id?: number | null;
  assigned_spot_number?: string | null;
  assigned_spot_type?: string | null;
  message?: string | null;
}

export interface FacilityAvailability {
  facility_id: number;
  start_time: string;
  end_time: string;
  is_open: boolean;
  total_capacity: number;
  available_spaces: number;
  booked_spaces: number;
  tier: string;
}

export interface SpaceAvailabilityItem {
  id: number;
  spot_number: string;
  floor: string;
  spot_type: SpotType;
  is_active: boolean;
  is_available: boolean;
}
