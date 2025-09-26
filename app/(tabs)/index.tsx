import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, Clock, MapPin, Star } from 'lucide-react-native';
import { router } from 'expo-router';

// TODO: Integrar com Supabase para buscar times reais
const teams: any[] = [];

// Function to get max players based on game type
const getMaxPlayers = (type: string) => {
  switch (type) {
    case '4x4':
      return 8; // 4 players per team
    case '5x5':
      return 10; // 5 players per team
    case '12x12':
      return 24; // 12 players per team (including goalkeeper)
    default:
      return 10;
  }
};

export default function TeamsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Montar Times</Text>
          <Text style={styles.subtitle}>Encontre jogadores ou crie seu próprio time</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/create-team?type=4x4')}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Criar Time 4x4</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.createButton, styles.createButton5x5]}
            onPress={() => router.push('/create-team?type=5x5')}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Criar Time 5x5</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, styles.createButton12x12]}
          onPress={() => router.push('/create-team?type=12x12')}
        >
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Criar Time 12x12</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Times Disponíveis</Text>
          
          {teams.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Nenhum time disponível</Text>
              <Text style={styles.emptyStateSubtext}>Seja o primeiro a criar um time!</Text>
            </View>
          ) : (
            teams.map((team) => (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={styles.teamType}>
                  <Users size={20} color="#22C55E" />
                  <Text style={styles.teamTypeText}>{team.type}</Text>
                </View>
                <Text style={styles.teamPrice}>{team.price}</Text>
              </View>

              <View style={styles.teamInfo}>
                <View style={styles.infoRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{team.location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.infoText}>{team.date} às {team.time}</Text>
                </View>
              </View>

              <View style={styles.teamFooter}>
                <View style={styles.rating}>
                  <Star size={16} color="#FCD34D" fill="#FCD34D" />
                  <Text style={styles.ratingText}>{team.rating}</Text>
                </View>
                <Text style={styles.playersCount}>
                  {team.players}/{getMaxPlayers(team.type)} jogadores
                </Text>
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={() => router.push(`/game-details/${team.id}`)}
                >
                  <Text style={styles.joinButtonText}>Participar</Text>
                </TouchableOpacity>
              </View>
            </View>
            ))
          )}
        </View>
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
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  createButton5x5: {
    backgroundColor: '#3B82F6',
  },
  createButton12x12: {
    backgroundColor: '#F59E0B',
    marginHorizontal: 24,
    marginBottom: 32,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamTypeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  teamPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  teamInfo: {
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  playersCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  joinButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});