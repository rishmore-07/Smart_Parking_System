import { request } from './api';
import type {
  Payment,
  Receipt,
  PaymentOrderResponse,
  PaymentVerifyRequest,
} from '../types/payment';

interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

export const paymentService = {
  async createPaymentOrder(reservationId: number): Promise<APIResponse<PaymentOrderResponse>> {
    return request<APIResponse<PaymentOrderResponse>>(
      `/reservations/${reservationId}/payment/order`,
      { method: 'POST' }
    );
  },

  async verifyPayment(data: PaymentVerifyRequest): Promise<APIResponse<Payment>> {
    return request<APIResponse<Payment>>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getReservationPayment(reservationId: number): Promise<APIResponse<Payment>> {
    return request<APIResponse<Payment>>(`/reservations/${reservationId}/payment`);
  },

  async getReservationReceipt(reservationId: number): Promise<APIResponse<Receipt>> {
    return request<APIResponse<Receipt>>(`/reservations/${reservationId}/receipt`);
  },

  async getMyPayments(params?: { skip?: number; limit?: number }): Promise<APIResponse<Payment[]>> {
    const query = new URLSearchParams();
    if (params?.skip) query.append('skip', String(params.skip));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<APIResponse<Payment[]>>(`/payments/me${qs}`);
  },

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },
};
