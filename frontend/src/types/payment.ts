export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'RAZORPAY' | 'WALLET' | 'CARD' | 'UPI' | 'TEST_MOCK';

export interface Receipt {
  id: number;
  receipt_number: string;
  payment_id: number;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  pdf_url?: string;
  details_json?: string;
  created_at: string;
}

export interface Payment {
  id: number;
  reservation_id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
  receipt?: Receipt;
}

export interface PaymentOrderResponse {
  order_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  key_id: string;
  reservation_id: number;
  booking_code: string;
  business_name: string;
  description: string;
  notes?: Record<string, string>;
}

export interface PaymentVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  reservation_id?: number;
}
