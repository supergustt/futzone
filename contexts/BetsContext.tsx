import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';

export interface Bet {
  id: string;
  creator_id: string;
  creator_name: string;
  title: string;
  teamA: string;
  teamB: string;
  selectedTeam: 'A' | 'B';
  description: string;
  bet_type: 'friends' | 'sports';
  amount: number;
  max_participants?: number;
  current_participants: number;
  odds?: number;
  deadline?: Date;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  result?: string;
  winner_id?: string;
  winner_name?: string;
  created_at: Date;
  participants: BetParticipant[];
}

export interface BetParticipant {
  id: string;
  bet_id: string;
  user_id: string;
  user_name: string;
  prediction?: string;
  amount: number;
  joined_at: Date;
}

interface BetsContextType {
  bets: Bet[];
  userBets: Bet[];
  isLoading: boolean;
  createBet: (betData: Omit<Bet, 'id' | 'creator_id' | 'creator_name' | 'current_participants' | 'status' | 'created_at' | 'participants'>) => Promise<boolean>;
  joinBet: (betId: string, prediction?: string) => Promise<boolean>;
  completeBet: (betId: string, result: string, winnerId: string) => Promise<boolean>;
  getUserBets: (userId: string) => Bet[];
}

const BetsContext = createContext<BetsContextType | undefined>(undefined);

export function BetsProvider({ children }: { children: ReactNode }) {
  // TODO: Integrar com Supabase para buscar apostas reais
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock balance for now - in real app would come from WalletContext
  const balance = 100;
  const addTransaction = (transaction: any) => {
    console.log('Transaction added:', transaction);
  };

  const createBet = async (betData: Omit<Bet, 'id' | 'creator_id' | 'creator_name' | 'current_participants' | 'status' | 'created_at' | 'participants'>): Promise<boolean> => {
    if (balance < betData.amount) {
      Alert.alert('Saldo Insuficiente', 'Você não tem saldo suficiente para criar esta aposta.');
      return false;
    }

    setIsLoading(true);
    try {
      const newBet: Bet = {
        ...betData,
        id: Date.now().toString(),
        creator_id: 'current_user', // In real app, get from auth
        creator_name: 'Você', // In real app, get from profile
        current_participants: 1,
        status: 'open',
        created_at: new Date(),
        participants: [{
          id: Date.now().toString(),
          bet_id: Date.now().toString(),
          user_id: 'current_user',
          user_name: 'Você',
          amount: betData.amount,
          joined_at: new Date(),
        }]
      };

      setBets(prev => [newBet, ...prev]);

      // Deduct amount from wallet
      addTransaction({
        type: 'bet_loss', // Initially treated as expense
        amount: -betData.amount,
        description: `Aposta criada: ${betData.title}`,
        status: 'completed',
      });

      return true;
    } catch (error) {
      console.error('Error creating bet:', error);
      Alert.alert('Erro', 'Não foi possível criar a aposta. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const joinBet = async (betId: string, prediction?: string): Promise<boolean> => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) {
      Alert.alert('Erro', 'Aposta não encontrada.');
      return false;
    }

    if (bet.status !== 'open') {
      Alert.alert('Erro', 'Esta aposta não está mais disponível.');
      return false;
    }

    if (balance < bet.amount) {
      Alert.alert('Saldo Insuficiente', 'Você não tem saldo suficiente para participar desta aposta.');
      return false;
    }

    if (bet.max_participants && bet.current_participants >= bet.max_participants) {
      Alert.alert('Erro', 'Esta aposta já atingiu o número máximo de participantes.');
      return false;
    }

    // Check if user already joined
    const alreadyJoined = bet.participants.some(p => p.user_id === 'current_user');
    if (alreadyJoined) {
      Alert.alert('Erro', 'Você já está participando desta aposta.');
      return false;
    }

    setIsLoading(true);
    try {
      const newParticipant: BetParticipant = {
        id: Date.now().toString(),
        bet_id: betId,
        user_id: 'current_user',
        user_name: 'Você',
        prediction,
        amount: bet.amount,
        joined_at: new Date(),
      };

      setBets(prev => prev.map(b => {
        if (b.id === betId) {
          return {
            ...b,
            current_participants: b.current_participants + 1,
            participants: [...b.participants, newParticipant]
          };
        }
        return b;
      }));

      // Deduct amount from wallet
      addTransaction({
        type: 'bet_loss', // Initially treated as expense
        amount: -bet.amount,
        description: `Participação na aposta: ${bet.title}`,
        status: 'completed',
      });

      Alert.alert('Sucesso!', 'Você entrou na aposta com sucesso!');
      return true;
    } catch (error) {
      console.error('Error joining bet:', error);
      Alert.alert('Erro', 'Não foi possível participar da aposta. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeBet = async (betId: string, result: string, winnerId: string): Promise<boolean> => {
    const bet = bets.find(b => b.id === betId);
    if (!bet) return false;

    setIsLoading(true);
    try {
      const totalPot = bet.current_participants * bet.amount;
      const winner = bet.participants.find(p => p.user_id === winnerId);

      setBets(prev => prev.map(b => {
        if (b.id === betId) {
          return {
            ...b,
            status: 'completed' as const,
            result,
            winner_id: winnerId,
            winner_name: winner?.user_name || 'Desconhecido'
          };
        }
        return b;
      }));

      // If current user won, add winnings to wallet
      if (winnerId === 'current_user') {
        addTransaction({
          type: 'bet_win',
          amount: totalPot,
          description: `Vitória na aposta: ${bet.title}`,
          status: 'completed',
        });
        Alert.alert('Parabéns!', `Você ganhou R$ ${totalPot.toFixed(2)} na aposta "${bet.title}"!`);
      }

      return true;
    } catch (error) {
      console.error('Error completing bet:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBets = (userId: string): Bet[] => {
    return bets.filter(bet => 
      bet.creator_id === userId || 
      bet.participants.some(p => p.user_id === userId)
    );
  };

  const userBets = getUserBets('current_user');

  return (
    <BetsContext.Provider value={{
      bets,
      userBets,
      isLoading,
      createBet,
      joinBet,
      completeBet,
      getUserBets,
    }}>
      {children}
    </BetsContext.Provider>
  );
}

export function useBets() {
  const context = useContext(BetsContext);
  if (context === undefined) {
    throw new Error('useBets must be used within a BetsProvider');
  }
  return context;
}