import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Users, Clock, DollarSign, Plus, Target, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { useBets } from '@/contexts/BetsContext';
import { useWallet } from '@/contexts/WalletContext';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

export default function BetsScreen() {
  const { bets, createBet, joinBet, isLoading } = useBets();
  const { balance } = useWallet();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBet, setNewBet] = useState({
    teamA: '',
    teamB: '',
    description: '',
    bet_type: 'friends' as 'friends' | 'sports',
    amount: '',
    max_participants: '',
    deadline: '',
    selectedTeam: '',
  });

  const myBets = bets.filter(bet => bet.is_creator);
  const availableBets = bets.filter(bet => !bet.is_creator && bet.status === 'open');

  const handleShareBet = async (betId: string) => {
    const shareLink = `https://futzone.app/bet/${betId}`;
    await Clipboard.setStringAsync(shareLink);
    Alert.alert('Link copiado!', 'O link da aposta foi copiado para a área de transferência');
  };

  const handleCreateBet = async () => {
    const amount = parseFloat(newBet.amount);
    const maxParticipants = newBet.max_participants ? parseInt(newBet.max_participants) : undefined;
    
    if (!newBet.teamA.trim() || !newBet.teamB.trim() || !newBet.selectedTeam || isNaN(amount) || amount < 1) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const betData = {
      title: `${newBet.teamA.trim()} x ${newBet.teamB.trim()}`,
      teamA: newBet.teamA.trim(),
      teamB: newBet.teamB.trim(),
      selectedTeam: newBet.selectedTeam,
      description: newBet.description.trim(),
      bet_type: newBet.bet_type,
      amount,
      max_participants: maxParticipants,
      deadline: newBet.deadline ? new Date(newBet.deadline) : undefined,
    };

    const success = await createBet(betData);
    if (success) {
      setShowCreateModal(false);
      setNewBet({
        teamA: '',
        teamB: '',
        description: '',
        bet_type: 'friends',
        amount: '',
        max_participants: '',
        deadline: '',
        selectedTeam: '',
      });
      Alert.alert('Sucesso!', 'Aposta criada com sucesso!', [
        { 
          text: 'OK', 
          onPress: () => {
            // Force refresh of the bets tab
            router.replace('/(tabs)/bets');
          }
        }
      ]);
    }
  };

  const handleJoinBet = async (betId: string, amount: number) => {
    if (balance < amount) {
      Alert.alert('Saldo insuficiente', 'Você não tem saldo suficiente para participar desta aposta');
      return;
    }

    const success = await joinBet(betId, amount);
    if (success) {
      Alert.alert('Sucesso!', 'Você entrou na aposta!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Apostas</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Nova Aposta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Minhas Apostas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Apostas</Text>
          {myBets.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Você ainda não criou nenhuma aposta</Text>
              <Text style={styles.emptySubtext}>Crie sua primeira aposta e convide seus amigos!</Text>
            </View>
          ) : (
            myBets.map((bet) => (
              <View key={bet.id} style={styles.betCard}>
                <View style={styles.betHeader}>
                  <Text style={styles.betTitle}>{bet.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: bet.status === 'open' ? '#10B981' : '#6B7280' }]}>
                    <Text style={styles.statusText}>
                      {bet.status === 'open' ? 'Aberta' : 'Fechada'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.betDescription}>{bet.description}</Text>
                
                <View style={styles.betStats}>
                  <View style={styles.statItem}>
                    <DollarSign size={16} color="#10B981" />
                    <Text style={styles.statText}>R$ {bet.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Users size={16} color="#6366F1" />
                    <Text style={styles.statText}>
                      {bet.current_participants}/{bet.max_participants || '∞'}
                    </Text>
                  </View>
                  {bet.deadline && (
                    <View style={styles.statItem}>
                      <Clock size={16} color="#F59E0B" />
                      <Text style={styles.statText}>
                        {new Date(bet.deadline).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={() => handleShareBet(bet.id)}
                >
                  <Text style={styles.shareButtonText}>Compartilhar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Apostas Disponíveis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apostas Disponíveis</Text>
          {availableBets.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Nenhuma aposta disponível</Text>
              <Text style={styles.emptySubtext}>Aguarde novas apostas ou crie a sua!</Text>
            </View>
          ) : (
            availableBets.map((bet) => (
              <View key={bet.id} style={styles.betCard}>
                <View style={styles.betHeader}>
                  <Text style={styles.betTitle}>{bet.title}</Text>
                  <View style={styles.creatorBadge}>
                    <Text style={styles.creatorText}>por {bet.creator_name}</Text>
                  </View>
                </View>
                
                <Text style={styles.betDescription}>{bet.description}</Text>
                
                <View style={styles.betStats}>
                  <View style={styles.statItem}>
                    <DollarSign size={16} color="#10B981" />
                    <Text style={styles.statText}>R$ {bet.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Users size={16} color="#6366F1" />
                    <Text style={styles.statText}>
                      {bet.current_participants}/{bet.max_participants || '∞'}
                    </Text>
                  </View>
                  {bet.deadline && (
                    <View style={styles.statItem}>
                      <Clock size={16} color="#F59E0B" />
                      <Text style={styles.statText}>
                        {new Date(bet.deadline).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.betActions}>
                  <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={() => handleShareBet(bet.id)}
                  >
                    <Text style={styles.shareButtonText}>Compartilhar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.joinButton}
                    onPress={() => handleJoinBet(bet.id, bet.amount)}
                    disabled={isLoading}
                  >
                    <Text style={styles.joinButtonText}>
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Bet Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Nova Aposta</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newBet.teamA}
              onChangeText={(text) => setNewBet(prev => ({ ...prev, teamA: text }))}
              placeholder="Time A (ex: Santos)"
              maxLength={100}
            />
            
            <TextInput
              style={styles.modalInput}
              value={newBet.teamB}
              onChangeText={(text) => setNewBet(prev => ({ ...prev, teamB: text }))}
              placeholder="Time B (ex: Flamengo)"
              maxLength={100}
            />

            <Text style={styles.modalLabel}>Qual time você acha que vai ganhar?</Text>
            <View style={styles.teamSelector}>
              <TouchableOpacity
                style={[
                  styles.teamButton,
                  newBet.selectedTeam === 'A' && styles.teamButtonActive
                ]}
                onPress={() => setNewBet(prev => ({ ...prev, selectedTeam: 'A' }))}
              >
                <Text style={[
                  styles.teamButtonText,
                  newBet.selectedTeam === 'A' && styles.teamButtonTextActive
                ]}>
                  {newBet.teamA || 'Time A'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.teamButton,
                  newBet.selectedTeam === 'B' && styles.teamButtonActive
                ]}
                onPress={() => setNewBet(prev => ({ ...prev, selectedTeam: 'B' }))}
              >
                <Text style={[
                  styles.teamButtonText,
                  newBet.selectedTeam === 'B' && styles.teamButtonTextActive
                ]}>
                  {newBet.teamB || 'Time B'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newBet.description}
              onChangeText={(text) => setNewBet(prev => ({ ...prev, description: text }))}
              placeholder="Descrição da aposta"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newBet.bet_type === 'friends' && styles.typeButtonActive
                ]}
                onPress={() => setNewBet(prev => ({ ...prev, bet_type: 'friends' }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  newBet.bet_type === 'friends' && styles.typeButtonTextActive
                ]}>
                  Entre Amigos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  newBet.bet_type === 'sports' && styles.typeButtonActive
                ]}
                onPress={() => setNewBet(prev => ({ ...prev, bet_type: 'sports' }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  newBet.bet_type === 'sports' && styles.typeButtonTextActive
                ]}>
                  Esportes
                </Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newBet.amount}
              onChangeText={(text) => setNewBet(prev => ({ ...prev, amount: text }))}
              placeholder="Valor da aposta (R$)"
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.modalInput}
              value={newBet.max_participants}
              onChangeText={(text) => setNewBet(prev => ({ ...prev, max_participants: text }))}
              placeholder="Máximo de participantes (opcional)"
              keyboardType="numeric"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleCreateBet}
                disabled={isLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoading ? 'Criando...' : 'Criar Aposta'}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  betCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  betTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  creatorBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creatorText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  betDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  betStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  betActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  teamSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  teamButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  teamButtonActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  teamButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  teamButtonTextActive: {
    color: '#10B981',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#6366F1',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
});