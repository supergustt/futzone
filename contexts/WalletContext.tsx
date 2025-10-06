import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import { abacatePayService, PixPaymentResponse, WithdrawalResponse } from '@/lib/abacatepay';
import { supabase } from '@/lib/supabase';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet_win' | 'bet_loss' | 'team_payment' | 'goalkeeper_payment';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: Date;
  payment_id?: string;
  pix_key?: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  pixKey: string;
  isLoading: boolean;
  updatePixKey: (key: string) => void;
  createDeposit: (amount: number) => Promise<PixPaymentResponse | null>;
  createWithdrawal: (amount: number) => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  refreshBalance: () => void;
  checkPaymentStatus: (paymentId: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pixKey, setPixKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  // Load wallet data from storage on mount
  useEffect(() => {
    loadWalletData();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadWalletData = async () => {
    try {
      // In a real app, this would load from Supabase
      // For now, using localStorage simulation
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const savedBalance = localStorage.getItem('wallet_balance');
      const savedTransactions = localStorage.getItem('wallet_transactions');
      const savedPixKey = localStorage.getItem('user_pix_key');

      if (savedBalance && mountedRef.current) {
        setBalance(parseFloat(savedBalance));
      }
      if (savedTransactions) {
        try {
          const parsedTransactions = JSON.parse(savedTransactions);
          if (mountedRef.current) {
            setTransactions(parsedTransactions.map((t: any) => ({
              ...t,
              created_at: new Date(t.created_at)
            })));
          }
        } catch (e) {
          console.error('Error parsing transactions:', e);
        }
      }
      if (savedPixKey && mountedRef.current) {
        setPixKey(savedPixKey);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const saveWalletData = (newBalance: number, newTransactions: Transaction[]) => {
    if (!mountedRef.current) return;
    
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('wallet_balance', newBalance.toString());
        localStorage.setItem('wallet_transactions', JSON.stringify(newTransactions));
      }
    } catch (e) {
      console.error('Error saving wallet data:', e);
    }
    
    setBalance(newBalance);
    setTransactions(newTransactions);
  };

  const updatePixKey = (key: string) => {
    if (!mountedRef.current) return;
    
    setPixKey(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
      }
      localStorage.setItem('wallet_balance', newBalance.toString());
        localStorage.setItem('user_pix_key', key);
      localStorage.setItem('wallet_transactions', JSON.stringify(newTransactions));
    } catch (e) {
      console.error('Error saving PIX key:', e);
    }
  };

  const createDeposit = async (amount: number): Promise<PixPaymentResponse | null> => {
    if (amount < 1) {
      if (mountedRef.current) {
        Alert.alert('Erro', 'Valor mínimo para depósito é R$ 1,00');
      }
      return null;
    }

    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Create payment with AbacatePay
      const payment = await abacatePayService.createPayment({
        amount,
        description: `Depósito FutZone - R$ ${amount.toFixed(2)}`,
        payment_type: 'deposit',
      });

      // Add pending transaction
      const transaction: Omit<Transaction, 'id' | 'created_at'> = {
        type: 'deposit',
        amount,
        description: `Depósito via PIX - R$ ${amount.toFixed(2)}`,
        status: 'pending',
        payment_id: payment.id,
      };

      addTransaction(transaction);
      return payment;
    } catch (error) {
      console.error('Deposit error:', error);
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'Não foi possível criar o depósito. Tente novamente.';
        Alert.alert('Erro', errorMessage);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const createWithdrawal = async (amount: number): Promise<boolean> => {
    if (amount < 1) {
      if (mountedRef.current) {
        Alert.alert('Erro', 'Valor mínimo para saque é R$ 1,00');
      }
      return false;
    }

    if (amount > balance) {
      if (mountedRef.current) {
        Alert.alert('Erro', 'Saldo insuficiente para saque');
      }
      return false;
    }

    if (!pixKey) {
      if (mountedRef.current) {
        Alert.alert('Erro', 'Cadastre sua chave PIX antes de sacar');
      }
      return false;
    }

    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      // Create withdrawal with AbacatePay
      const withdrawal = await abacatePayService.createWithdrawal({
        amount,
        pix_key: pixKey,
        description: `Saque FutZone - R$ ${amount.toFixed(2)}`,
      });

      // Add withdrawal transaction
      const transaction: Omit<Transaction, 'id' | 'created_at'> = {
        type: 'withdrawal',
        amount: -amount,
        description: `Saque via PIX - R$ ${amount.toFixed(2)}`,
        status: 'completed', // AbacatePay handles it immediately
        pix_key: pixKey,
      };

      addTransaction(transaction);
      
      // Balance is already updated by the AbacatePay function
      const newBalance = balance - amount;
      const newTransactions = [...transactions, {
        ...transaction,
        id: Date.now().toString(),
        created_at: new Date(),
      }];
      
      saveWalletData(newBalance, newTransactions);
      return true;
    } catch (error) {
      console.error('Withdrawal error:', error);
      if (mountedRef.current) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível processar o saque. Tente novamente.');
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!mountedRef.current) return;
    
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      created_at: new Date(),
    };

    const newTransactions = [newTransaction, ...transactions];
    
    // Update balance only for completed transactions or immediate debits
    let newBalance = balance;
    if (transaction.status === 'completed' || transaction.type === 'withdrawal') {
      newBalance += transaction.amount;
    }

    saveWalletData(newBalance, newTransactions);
  };

  const checkPaymentStatus = async (paymentId: string) => {
    if (!mountedRef.current) return;
    
    try {
      // Get payment status from database (updated by webhook)
      const { data: payment, error } = await supabase
        .from('abacatepay_payments')
        .select('status, amount')
        .eq('payment_id', paymentId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return;
      }
      
      if (payment.status === 'paid') {
        // Find and update the transaction
        const updatedTransactions = transactions.map(t => {
          if (t.payment_id === paymentId && t.status === 'pending') {
            return { ...t, status: 'completed' as const };
          }
          return t;
        });

        // Find the transaction amount to add to balance
        const transaction = transactions.find(t => t.payment_id === paymentId);
        if (transaction && transaction.status === 'pending') {
          const newBalance = balance + payment.amount;
          saveWalletData(newBalance, updatedTransactions);
          if (mountedRef.current) {
            Alert.alert('Sucesso!', `Depósito de R$ ${payment.amount.toFixed(2)} confirmado!`);
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const refreshBalance = () => {
    loadWalletData();
  };

  return (
    <WalletContext.Provider value={{
      balance,
      transactions,
      pixKey,
      isLoading,
      updatePixKey,
      createDeposit,
      createWithdrawal,
      addTransaction,
      refreshBalance,
      checkPaymentStatus,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}