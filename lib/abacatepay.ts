import { supabase } from './supabase';

export interface PaymentRequest {
  amount: number;
  description: string;
  payment_type: 'deposit' | 'subscription' | 'bet_payment';
  external_id?: string;
}

export interface PixPaymentResponse {
  id: string;
  amount: number;
  pix_code: string;
  pix_qr_code: string;
  expires_at: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
}

export interface WithdrawalRequest {
  amount: number;
  pix_key: string;
  description?: string;
}

export interface WithdrawalResponse {
  id: string;
  amount: number;
  pix_key: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface SubscriptionData {
  status: 'not_started' | 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  plan_id?: string;
  amount?: number;
  currency?: string;
  trial_start?: string;
  trial_end?: string;
  current_period_start?: string;
  current_period_end?: string;
}

class AbacatePayService {
  async createPayment(paymentData: PaymentRequest): Promise<PixPaymentResponse> {
    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Try to get user from current session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Usuário não autenticado. Faça login para continuar.');
        }
        
        // Get fresh session
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (!newSession) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }

      const { data, error } = await supabase.functions.invoke('abacatepay-payment', {
        body: paymentData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Falha ao criar pagamento. Tente novamente.');
      }

      return data;
    } catch (error) {
      console.error('AbacatePay payment error:', error);
      throw error;
    }
  }

  async createWithdrawal(withdrawalData: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('abacatepay-withdrawal', {
        body: withdrawalData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Withdrawal creation error:', error);
        throw new Error(error.message || 'Failed to create withdrawal');
      }

      return data;
    } catch (error) {
      console.error('AbacatePay withdrawal error:', error);
      throw error;
    }
  }

  async createSubscription(planId: string = 'premium'): Promise<SubscriptionData> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('abacatepay-subscription', {
        body: { action: 'create', plan_id: planId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Subscription creation error:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      return data;
    } catch (error) {
      console.error('AbacatePay subscription error:', error);
      throw error;
    }
  }

  async cancelSubscription(): Promise<{ status: string; message: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('abacatepay-subscription', {
        body: { action: 'cancel' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Subscription cancellation error:', error);
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      return data;
    } catch (error) {
      console.error('AbacatePay subscription cancellation error:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionData> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('abacatepay-subscription', {
        body: { action: 'status' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Subscription status error:', error);
        throw new Error(error.message || 'Failed to get subscription status');
      }

      return data;
    } catch (error) {
      console.error('AbacatePay subscription status error:', error);
      throw error;
    }
  }

  async getUserPayments() {
    try {
      const { data, error } = await supabase
        .from('abacatepay_user_payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user payments:', error);
      throw error;
    }
  }

  async getUserWithdrawals() {
    try {
      const { data, error } = await supabase
        .from('abacatepay_user_withdrawals')
        .select('*')
        .order('withdrawal_date', { ascending: false });

      if (error) {
        console.error('Error fetching withdrawals:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user withdrawals:', error);
      throw error;
    }
  }

  async getUserSubscription() {
    try {
      const { data, error } = await supabase
        .from('abacatepay_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }
}

export const abacatePayService = new AbacatePayService();