import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRef } from 'react';
import { Alert } from 'react-native';
import { abacatePayService, SubscriptionData as AbacatePaySubscriptionData } from '@/lib/abacatepay';
import { supabase } from '@/lib/supabase';

export interface SubscriptionData {
  isActive: boolean;
  plan: 'free' | 'premium';
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
  isTrialActive: boolean;
  daysLeftInTrial: number;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData;
  isLoading: boolean;
  createSubscription: () => Promise<boolean>;
  createPaymentLink: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  checkTrialStatus: () => void;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const mountedRef = useRef(true);
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isActive: false,
    plan: 'free',
    trialEndsAt: null,
    subscriptionEndsAt: null,
    isTrialActive: false,
    daysLeftInTrial: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshSubscription();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        refreshSubscription();
      } else if (event === 'SIGNED_OUT') {
        // Reset to default state when user signs out
        if (mountedRef.current) {
          setSubscriptionData({
            isActive: false,
            plan: 'free',
            trialEndsAt: null,
            subscriptionEndsAt: null,
            isTrialActive: false,
            daysLeftInTrial: 0,
          });
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshSubscription = async () => {
    try {
      // Check if user is authenticated before making API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User not authenticated, set to default free state
        if (mountedRef.current) {
          setSubscriptionData({
            isActive: false,
            plan: 'free',
            trialEndsAt: null,
            subscriptionEndsAt: null,
            isTrialActive: false,
            daysLeftInTrial: 0,
          });
        }
        return;
      }

      const abacatePayData = await abacatePayService.getSubscriptionStatus();
      updateSubscriptionFromAbacatePay(abacatePayData);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      // On error, set to default free state
      if (mountedRef.current) {
        setSubscriptionData({
          isActive: false,
          plan: 'free',
          trialEndsAt: null,
          subscriptionEndsAt: null,
          isTrialActive: false,
          daysLeftInTrial: 0,
        });
      }
    }
  };

  const updateSubscriptionFromAbacatePay = (abacatePayData: AbacatePaySubscriptionData) => {
    const now = new Date();
    let isActive = false;
    let plan: 'free' | 'premium' = 'free';
    let trialEndsAt: Date | null = null;
    let subscriptionEndsAt: Date | null = null;
    let isTrialActive = false;
    let daysLeftInTrial = 0;

    switch (abacatePayData.status) {
      case 'trial':
        isActive = true;
        plan = 'free';
        isTrialActive = true;
        if (abacatePayData.trial_end) {
          trialEndsAt = new Date(abacatePayData.trial_end);
          daysLeftInTrial = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          isActive = daysLeftInTrial > 0;
        }
        break;
      case 'active':
        isActive = true;
        plan = 'premium';
        if (abacatePayData.current_period_end) {
          subscriptionEndsAt = new Date(abacatePayData.current_period_end);
          isActive = subscriptionEndsAt > now;
        }
        break;
      case 'expired':
      case 'canceled':
      case 'past_due':
        isActive = false;
        plan = 'free';
        break;
      default:
        isActive = false;
        plan = 'free';
    }

    if (mountedRef.current) {
      setSubscriptionData({
        isActive,
        plan,
        trialEndsAt,
        subscriptionEndsAt,
        isTrialActive,
        daysLeftInTrial,
      });
    }
  };

  const checkTrialStatus = () => {
    refreshSubscription();
  };

  const createSubscription = async (): Promise<boolean> => {
    if (!mountedRef.current) return false;
    
    setIsLoading(true);
    
    try {
      const abacatePayData = await abacatePayService.createSubscription();
      updateSubscriptionFromAbacatePay(abacatePayData);
      
      if (mountedRef.current) {
        Alert.alert('Sucesso!', 'Período de teste iniciado! Você tem 3 dias gratuitos.');
      }
      return true;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      if (mountedRef.current) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível ativar a assinatura. Tente novamente.');
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const createPaymentLink = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    
    try {
      // Create payment for subscription
      const payment = await abacatePayService.createPayment({
        amount: 27.90,
        description: 'Assinatura Premium FutZone - Mensal',
        payment_type: 'subscription',
      });

      if (mountedRef.current) {
        Alert.alert(
          'Pagamento Gerado',
          'Use o código PIX ou QR Code para efetuar o pagamento da assinatura.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Erro ao abrir link de pagamento:', error);
      if (mountedRef.current) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível gerar o pagamento. Tente novamente.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    if (!mountedRef.current) return false;
    
    setIsLoading(true);
    
    try {
      await abacatePayService.cancelSubscription();
      await refreshSubscription();
      
      if (mountedRef.current) {
        Alert.alert('Assinatura Cancelada', 'Sua assinatura foi cancelada com sucesso.');
      }
      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      if (mountedRef.current) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível cancelar a assinatura. Tente novamente.');
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscriptionData,
      isLoading,
      createSubscription,
      createPaymentLink,
      cancelSubscription,
      checkTrialStatus,
      refreshSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}