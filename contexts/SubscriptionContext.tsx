import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRef } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

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
  openPaymentLink: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  checkTrialStatus: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TRIAL_DURATION_DAYS = 3;

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const mountedRef = useRef(true);
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>(() => {
    // Simular dados iniciais - em produção viria do Supabase
    const trialStartDate = new Date();
    trialStartDate.setDate(trialStartDate.getDate() - 1); // Começou ontem
    
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);
    
    const now = new Date();
    const isTrialActive = now < trialEndDate;
    const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      isActive: isTrialActive, // Ativo durante o trial
      plan: 'free',
      trialEndsAt: trialEndDate,
      subscriptionEndsAt: null,
      isTrialActive,
      daysLeftInTrial: daysLeft,
    };
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const checkTrialStatus = () => {
    if (!subscriptionData.trialEndsAt) return;
    
    const now = new Date();
    const isTrialActive = now < subscriptionData.trialEndsAt;
    const daysLeft = Math.max(0, Math.ceil((subscriptionData.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    setSubscriptionData(prev => ({
      ...prev,
      isTrialActive,
      daysLeftInTrial: daysLeft,
      isActive: isTrialActive || prev.plan === 'premium',
    }));
  };

  const createSubscription = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular criação de assinatura
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 mês
      
      setSubscriptionData(prev => ({
        ...prev,
        isActive: true,
        plan: 'premium',
        subscriptionEndsAt: subscriptionEndDate,
      }));
      
      Alert.alert('Sucesso!', 'Assinatura ativada com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      Alert.alert('Erro', 'Não foi possível ativar a assinatura. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentLink = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Link de pagamento do Kiwify para assinatura mensal
      const paymentUrl = 'https://pay.kiwify.com.br/YtXbYiR';
      
      // Abrir o link de pagamento no navegador
      await WebBrowser.openBrowserAsync(paymentUrl);
      
      // Simular ativação da assinatura após pagamento  
      // Em produção, isso seria feito via webhook do Kiwify
      setTimeout(() => {
        if (mountedRef.current) {
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
          
          setSubscriptionData(prev => ({
            ...prev,
            isActive: true,
            plan: 'premium',
            subscriptionEndsAt: subscriptionEndDate,
          }));
          
          Alert.alert('Sucesso!', 'Assinatura ativada com sucesso!');
        }
      }, 3000); // Simula delay do processamento
      
    } catch (error) {
      console.error('Erro ao abrir link de pagamento:', error);
      if (mountedRef.current) {
        Alert.alert('Erro', 'Não foi possível abrir o link de pagamento. Tente novamente.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const cancelSubscription = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular cancelamento de assinatura
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubscriptionData(prev => ({
        ...prev,
        isActive: false,
        plan: 'free',
        subscriptionEndsAt: null,
      }));
      
      Alert.alert('Assinatura Cancelada', 'Sua assinatura foi cancelada com sucesso.');
      return true;
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      Alert.alert('Erro', 'Não foi possível cancelar a assinatura. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Verificar status do trial a cada minuto
    const interval = setInterval(checkTrialStatus, 60000);
    return () => {
      clearInterval(interval);
      mountedRef.current = false;
    };
  }, [subscriptionData.trialEndsAt]);

  return (
    <SubscriptionContext.Provider value={{
      subscriptionData,
      isLoading,
      createSubscription,
      openPaymentLink,
      cancelSubscription,
      checkTrialStatus,
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