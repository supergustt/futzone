import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Star, Calendar, MapPin, Clock, MessageCircle, History, Edit, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';

// TODO: Integrar com Supabase para buscar goleiros reais
const goalkeepers: any[] = [];

export default function GoalkeeperScreen() {
  const { profileData } = useProfile();
  const [activeFilter, setActiveFilter] = useState('today');
  
  const filteredGoalkeepers = useMemo(() => {
    if (goalkeepers.length === 0) return [];
    
    let filtered = [...goalkeepers];
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(g => g.available_today);
        break;
      case 'nearby':
        filtered = filtered.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        filtered = filtered.sort((a, b) => a.price_per_game - b.price_per_game);
        break;
    }
    
    return filtered;
  }, [activeFilter]);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Alugar Goleiro</Text>
          <Text style={styles.subtitle}>Encontre o goleiro perfeito para seu time</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.becomeGoalkeeper}
          onPress={() => router.push('/become-goalkeeper')}
        >
          <Shield size={24} color="#FFFFFF" />
          <Text style={styles.becomeGoalkeeperText}>Quero ser goleiro</Text>
        </TouchableOpacity>

        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.filter, activeFilter === 'today' && styles.filterActive]}
              onPress={() => setActiveFilter('today')}
            >
              <Text style={[styles.filterText, activeFilter === 'today' && styles.filterActiveText]}>Disponível hoje</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filter, activeFilter === 'nearby' && styles.filterActive]}
              onPress={() => setActiveFilter('nearby')}
            >
              <Text style={[styles.filterText, activeFilter === 'nearby' && styles.filterActiveText]}>Perto de mim</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filter, activeFilter === 'rating' && styles.filterActive]}
              onPress={() => setActiveFilter('rating')}
            >
              <Text style={[styles.filterText, activeFilter === 'rating' && styles.filterActiveText]}>Melhor avaliado</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filter, activeFilter === 'price' && styles.filterActive]}
              onPress={() => setActiveFilter('price')}
            >
              <Text style={[styles.filterText, activeFilter === 'price' && styles.filterActiveText]}>Menor preço</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {profileData.isGoalkeeper ? 'Outros Goleiros' : 'Goleiros Disponíveis'}
          </Text>
          
          {filteredGoalkeepers.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Nenhum goleiro disponível</Text>
              <Text style={styles.emptyStateSubtext}>
                {profileData.isGoalkeeper 
                  ? 'Você é o único goleiro cadastrado!' 
                  : 'Seja o primeiro goleiro da plataforma!'
                }
              </Text>
            </View>
          ) : (
            filteredGoalkeepers.map((goalkeeper) => (
            <View key={goalkeeper.id} style={styles.goalkeeperCard}>
              <Image source={{ uri: goalkeeper.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }} style={styles.avatar} />
              
              <View style={styles.goalkeeperInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{goalkeeper.name}</Text>
                  <Text style={styles.price}>R$ {goalkeeper.price_per_game}/jogo</Text>
                </View>
                
                <View style={styles.rating}>
                  <Star size={16} color="#FCD34D" fill="#FCD34D" />
                  <Text style={styles.ratingText}>{goalkeeper.rating}</Text>
                  <Text style={styles.experience}>• {goalkeeper.experience_years} anos</Text>
                </View>

                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{goalkeeper.location}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.detailText}>Disponível hoje</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.chatButton}
                    onPress={() => router.push(`/chat/${goalkeeper.name}`)}
                  >
                    <Text style={styles.chatButtonText}>Conversar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.hireButton}>
                    <Text style={styles.hireButtonText}>Contratar</Text>
                  </TouchableOpacity>
                </View>
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
  becomeGoalkeeper: {
    marginHorizontal: 24,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  becomeGoalkeeperText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  filters: {
    paddingLeft: 24,
    marginBottom: 24,
  },
  filter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterActiveText: {
    color: '#FFFFFF',
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
  goalkeeperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  goalkeeperInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  experience: {
    fontSize: 14,
    color: '#6B7280',
  },
  details: {
    marginBottom: 16,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  hireButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  hireButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  myProfileSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  myProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    gap: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  myAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  myProfileInfo: {
    flex: 1,
  },
  myName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  myPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  myProfileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chatsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  chatMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatMessageUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 8,
  },
  historySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTeam: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#22C55E',
  },
  historyDetails: {
    marginBottom: 12,
    gap: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  bottomPadding: {
    height: 20,
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
    textAlign: 'center',
  },
});