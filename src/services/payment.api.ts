import axios from 'axios';
import {env} from '../utils/env';

export interface CreateDonationParams {
  amount: number;
  userId?: number;
  description?: string;
}

export interface CreateDonationResponse {
  orderCode: number;
  paymentLinkId: string;
  qrCode?: string; // base64 data URL or raw base64 from backend
  checkoutUrl?: string;
}

export interface PaymentStatusResponse {
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  amountPaid?: number;
  orderCode?: number;
  paymentLinkId?: string;
}

const BASE = env.PAYOS_BACKEND_URL || '';

const paymentApi = {
  createDonation: async (params: CreateDonationParams): Promise<CreateDonationResponse> => {
    if (!BASE) {
      throw new Error('PAYOS_BACKEND_URL is not configured');
    }
    const res = await axios.post(`${BASE}/payments/create`, params);
    return res.data;
  },

  getStatus: async (id: string | number): Promise<PaymentStatusResponse> => {
    if (!BASE) {
      throw new Error('PAYOS_BACKEND_URL is not configured');
    }
    const res = await axios.get(`${BASE}/payments/status/${id}`);
    return res.data;
  },
};

export default paymentApi;

