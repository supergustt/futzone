export const ABACATEPAY_CONFIG = {
  API_KEY: 'abc_dev_sW4hJwZsEUqSUPJuL4S6NBS3',
  BASE_URL: 'https://api.abacatepay.com/v1',
  WEBHOOK_URL: process.env.EXPO_PUBLIC_WEBHOOK_URL || 'https://futzone-app-he6q.bolt.host/api/webhooks/abacatepay',
};

export interface PaymentRequest {
  amount: number;
  description: string;
  customer_email?: string;
  customer_name?: string;
  external_id?: string;
  return_url?: string;
  completion_url?: string;
}

export interface PixPaymentResponse {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  amount: number;
  pix_code: string;
  pix_qr_code: string;
  expires_at: string;
  created_at: string;
}

export class AbacatePayService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ABACATEPAY_CONFIG.API_KEY;
    this.baseUrl = ABACATEPAY_CONFIG.BASE_URL;
  }

  async createPixPayment(paymentData: PaymentRequest): Promise<PixPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/billing/pix`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          amount: Math.round(paymentData.amount * 100), // Convert to cents
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data,
        amount: data.amount / 100, // Convert back to reais
      };
    } catch (error) {
      console.error('AbacatePay Error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PixPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/billing/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data,
        amount: data.amount / 100,
      };
    } catch (error) {
      console.error('AbacatePay Status Error:', error);
      throw error;
    }
  }

  async createWithdrawal(amount: number, pixKey: string, description: string = 'Saque FutZone') {
    try {
      const response = await fetch(`${this.baseUrl}/payout/pix`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          pix_key: pixKey,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Withdrawal failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AbacatePay Withdrawal Error:', error);
      throw error;
    }
  }
}

export const abacatePayService = new AbacatePayService();