import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, MapPin, Clock, Star, DollarSign, Calendar, User } from 'lucide-react-native';
import { useProfile } from '@/contexts/ProfileContext';

// Mock data - in a real app this would come from a database
const teamsData: { [key: string]: any } = {
  '1': {
    id: 1,
    type: '4x4',
    location: 'Campo Central',
    time: '19:00',
    date: 'Hoje',
    players: 6,
    rating: 4.5,
    price: 'R$ 120',
    priceValue: 120,
    description: 'Rachão no campo central, venha jogar!',
    creator: 'João Silva',
    teamA: ['João Silva', 'Pedro Costa', 'Lucas Santos'],
    teamB: ['Carlos Lima', 'Roberto Silva', 'Fernando Costa'],
    availableSpots: 2,
  },
  '2': {
    id: 2,
    type: '5x5',
    location: 'Arena Sports',
    time: '20:30',
    date: 'Hoje',
    players: 8,
    rating: 4.8,
    price: 'R$ 150',
    priceValue: 150,
    description: 'Futebol society na arena, campo sintético',
    creator: 'Pedro Santos',
    teamA: ['Pedro Santos', 'André Silva', 'Marcos Lima', 'Diego Costa'],
    teamB: ['Rafael Santos', 'Bruno Lima', 'Thiago Costa', 'Gabriel Silva'],
    availableSpots: 2,
  },
  '3': {
    id: 3,
    type: '4x4',
    location: 'Quadra do Parque',
    time: '18:00',
    date: 'Amanhã',
    players: 5,
    rating: 4.2,
    price: 'R$ 100',
    priceValue: 100,
    description: 'Quadra coberta no parque, boa para iniciantes',
    creator: 'Carlos Lima',
    teamA: ['Carlos Lima', 'José Santos', 'Paulo Costa'],
    teamB: ['Miguel Silva', 'Antonio Lima'],
    availableSpots: 3,
  },
  '4': {
    id: 4,
    type: '12x12',
    location: 'Campo do Clube',
    time: '16:00',
    date: 'Sábado',
    players: 18,
    rating: 4.6,
    price: 'R$ 80',
    priceValue: 80,
    description: 'Futebol de campo completo, gramado natural',
    creator: 'Roberto Costa',
    teamA: [
      'Roberto Costa (Goleiro)', 'João Silva', 'Pedro Lima', 'Carlos Santos',
      'André Costa', 'Lucas Silva', 'Diego Lima', 'Bruno Santos', 'Rafael Costa'
    ],
    teamB: [
      'Fernando Lima (Goleiro)', 'Marcos Silva', 'Paulo Santos', 'Gabriel Costa',
      'Thiago Lima', 'Miguel Silva', 'Antonio Santos', 'José Costa', 'Daniel Lima'
    ],
    availableSpots: 6,
  },
};

const getMaxPlayers = (type: string) => {
  switch (type) {
    case '4x4':
      return 8;
    case '5x5':
      return 10;
    case '12x12':
      return 24;
    default:
      return 10;
  }
};

const getPlayersPerTeam = (type: string) => {
  switch (type) {
    case '4x4':
      return 4;
    case '5x5':
      return 5;
    case '12x12':
      return 12;
    default:
      return 5;
  }
};

export default function GameDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profileData } = useProfile();
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null);
  const [teamData, setTeamData] = useState(() => {
    const initialData = teamsData[id || '1'];
    return initialData ? { ...initialData } : null;
  });
  
  const team = teamData;

  useEffect(() => {
    const initialData = teamsData[id || '1'];
    if (initialData) {
      setTeamData({ ...initialData });
    }
  }, [id]);
  
  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Jogo não encontrado</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const maxPlayers = getMaxPlayers(team.type);
  const playersPerTeam = getPlayersPerTeam(team.type);

  const handleJoinTeam = () => {
    if (!selectedTeam) {
      Alert.alert('Erro', 'Selecione um time para participar');
      return;
    }

    if (!team) {
      Alert.alert('Erro', 'Dados do jogo não encontrados');
      return;
    }

    const playerName = profileData.name;
    
    // Check if player is already in either team
    const isInTeamA = team.teamA.includes(playerName);
    const isInTeamB = team.teamB.includes(playerName);
    
    if (isInTeamA || isInTeamB) {
      Alert.alert('Aviso', 'Você já está participando deste jogo!');
      return;
    }
    Alert.alert(
      'Confirmar Participação',
      `Deseja participar do Time ${selectedTeam}?\n\nValor: ${team.price}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            // Create updated team data
            const updatedTeam = { ...team };
            
            if (selectedTeam === 'A') {
              updatedTeam.teamA = [...updatedTeam.teamA, playerName];
            } else {
              updatedTeam.teamB = [...updatedTeam.teamB, playerName];
            }
            
            // Update players count
            updatedTeam.players = updatedTeam.teamA.length + updatedTeam.teamB.length;
            
            // Update available spots
            const maxPlayersCount = getMaxPlayers(updatedTeam.type);
            updatedTeam.availableSpots = maxPlayersCount - updatedTeam.players;
            
            // Update local state
            setTeamData(updatedTeam);
            
            Alert.alert('Sucesso!', `Você foi adicionado ao Time ${selectedTeam}!`, [
              { 
                text: 'OK', 
                onPress: () => {
                  // Reset selection
                  setSelectedTeam(null);
                }
              }
            ]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Jogo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.gameCard}>
          <View style={styles.gameHeader}>
            <View style={styles.gameType}>
              <Users size={24} color="#22C55E" />
              <Text style={styles.gameTypeText}>{team.type}</Text>
            </View>
            <Text style={styles.gamePrice}>{team.price}</Text>
          </View>

          <Text style={styles.gameDescription}>{team.description}</Text>

          <View style={styles.gameInfo}>
            <View style={styles.infoRow}>
              <MapPin size={18} color="#6B7280" />
              <Text style={styles.infoText}>{team.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={18} color="#6B7280" />
              <Text style={styles.infoText}>{team.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={18} color="#6B7280" />
              <Text style={styles.infoText}>{team.time}</Text>
            </View>
            <View style={styles.infoRow}>
              <User size={18} color="#6B7280" />
              <Text style={styles.infoText}>Criado por {team.creator}</Text>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <Star size={20} color="#FCD34D" fill="#FCD34D" />
            <Text style={styles.ratingText}>{team.rating}</Text>
            <Text style={styles.playersCount}>
              {team.players}/{maxPlayers} jogadores
            </Text>
          </View>
        </View>

        <View style={styles.teamsSection}>
          <Text style={styles.sectionTitle}>Times</Text>
          
          <View style={styles.teamsContainer}>
            <TouchableOpacity 
              style={[
                styles.teamCard,
                selectedTeam === 'A' && styles.selectedTeamCard
              ]}
              onPress={() => setSelectedTeam(selectedTeam === 'A' ? null : 'A')}
            >
              <View style={styles.teamHeader}>
                <Text style={styles.teamTitle}>Time A</Text>
                <Text style={styles.teamCount}>
                  {team.teamA.length}/{playersPerTeam}
                </Text>
              </View>
              
              <View style={styles.playersList}>
                {team.teamA.map((player: string, index: number) => (
                  <View key={index} style={styles.playerItem}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {player.split(' ').map((n: string) => n[0]).join('')}
                      </Text>
                    </View>
                    <Text style={styles.playerName}>{player}</Text>
                  </View>
                ))}
                
                {/* Empty spots */}
                {Array.from({ length: playersPerTeam - team.teamA.length }).map((_, index) => (
                  <View key={`empty-a-${index}`} style={styles.emptySpot}>
                    <View style={styles.emptyAvatar}>
                      <Text style={styles.emptyAvatarText}>?</Text>
                    </View>
                    <Text style={styles.emptySpotText}>Vaga disponível</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.teamCard,
                selectedTeam === 'B' && styles.selectedTeamCard
              ]}
              onPress={() => setSelectedTeam(selectedTeam === 'B' ? null : 'B')}
            >
              <View style={styles.teamHeader}>
                <Text style={styles.teamTitle}>Time B</Text>
                <Text style={styles.teamCount}>
                  {team.teamB.length}/{playersPerTeam}
                </Text>
              </View>
              
              <View style={styles.playersList}>
                {team.teamB.map((player: string, index: number) => (
                  <View key={index} style={styles.playerItem}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {player.split(' ').map((n: string) => n[0]).join('')}
                      </Text>
                    </View>
                    <Text style={styles.playerName}>{player}</Text>
                  </View>
                ))}
                
                {/* Empty spots */}
                {Array.from({ length: playersPerTeam - team.teamB.length }).map((_, index) => (
                  <View key={`empty-b-${index}`} style={styles.emptySpot}>
                    <View style={styles.emptyAvatar}>
                      <Text style={styles.emptyAvatarText}>?</Text>
                    </View>
                    <Text style={styles.emptySpotText}>Vaga disponível</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Informações de Pagamento</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <DollarSign size={20} color="#22C55E" />
              <Text style={styles.paymentLabel}>Valor por jogador:</Text>
              <Text style={styles.paymentValue}>{team.price}</Text>
            </View>
            <Text style={styles.paymentNote}>
              Pagamento será processado após confirmação
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.joinButton,
            !selectedTeam && styles.joinButtonDisabled
          ]}
          onPress={handleJoinTeam}
          disabled={!selectedTeam}
        >
          <Text style={[
            styles.joinButtonText,
            !selectedTeam && styles.joinButtonTextDisabled
          ]}>
            {selectedTeam ? `Participar do Time ${selectedTeam}` : 'Selecione um time'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gameType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameTypeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
  },
  gamePrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  gameDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  gameInfo: {
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  playersCount: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 'auto',
  },
  teamsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  teamsContainer: {
    gap: 16,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedTeamCard: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  teamCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  playersList: {
    gap: 12,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playerName: {
    fontSize: 16,
    color: '#1F2937',
  },
  emptySpot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    opacity: 0.6,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  emptyAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptySpotText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  paymentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  paymentNote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  joinButton: {
    marginHorizontal: 24,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  joinButtonTextDisabled: {
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});