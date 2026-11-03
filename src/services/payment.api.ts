import {apiCall} from './api.client';

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

// P10: Cloud Run API (module `payments`, debt N2 — off until then); the donor is the signed-in account.
const paymentApi = {
  createDonation: async (params: CreateDonationParams): Promise<CreateDonationResponse> =>
    apiCall<CreateDonationResponse>({
      method: 'post',
      url: '/payments/create',
      data: {amount: params.amount, ...(params.description ? {description: params.description} : {})},
    }),

  getStatus: async (id: string | number): Promise<PaymentStatusResponse> =>
    apiCall<PaymentStatusResponse>({method: 'get', url: `/payments/status/${id}`}),
};

export default paymentApi;

