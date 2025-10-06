import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Trophy, Target, Users, Settings, Award, TrendingUp, Crown, Calendar, CheckCircle, XCircle, LogIn, LogOut } from 'lucide-react-native';
import { calculatePlayerRanking, getRankColor, getRankDescription } from '@/utils/ranking';
import { router } from 'expo-router';
import { useProfile } from '@/contexts/ProfileContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

const achievements = [
  { id: 1, title: 'Artilheiro', description: '10 gols em um mês', icon: '⚽', unlocked: true },
  { id: 2, title: 'Assist King', description: '15 assistências', icon: '🎯', unlocked: true },
  { id: 3, title: 'Campeão', description: '5 vitórias seguidas', icon: '👑', unlocked: false },
  { id: 4, title: 'Goleiro Reserva', description: 'Jogou como goleiro 3x', icon: '🧤', unlocked: true },
];

export default function ProfileScreen() {
  const { profileData } = useProfile();
  const { subscriptionData, isLoading, createSubscription, cancelSubscription, createPaymentLink } = useSubscription();
  const [user, setUser] = useState<any>(null);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const playerStats = {
    wins: profileData.wins,
    games_played: profileData.gamesPlayed,
    goals: profileData.goals,
    assists: profileData.assists,
  };

  const stats = [
    { label: 'Jogos', value: playerStats.games_played.toString(), icon: Users },
    { label: 'Gols', value: playerStats.goals.toString(), icon: Target },
    { label: 'Assistências', value: playerStats.assists.toString(), icon: TrendingUp },
    { label: 'Vitórias', value: playerStats.wins.toString(), icon: Trophy },
  ];

  const ranking = calculatePlayerRanking(playerStats);
  const rankColor = getRankColor(ranking.rank);
  const rankDescription = getRankDescription(ranking.rank);
  const winRate = playerStats.games_played > 0 ? ((playerStats.wins / playerStats.games_played) * 100).toFixed(1) : '0.0';

  const handleSubscribe = async () => {
    await createSubscription();
  };

  const handleCancelSubscription = async () => {
    await cancelSubscription();
  };

  const handleCreatePayment = async () => {
    await createPaymentLink();
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            setIsLogoutLoading(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Erro', 'Não foi possível fazer logout. Tente novamente.');
              } else {
                Alert.alert('Logout realizado', 'Você foi desconectado com sucesso.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erro', 'Ocorreu um erro inesperado.');
            } finally {
              setIsLogoutLoading(false);
            }
          }
        }
      ]
    );
  };

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={styles.defaultAvatar}>
                <Users size={40} color="#9CA3AF" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Visitante</Text>
                <Text style={styles.position}>Faça login para acessar seu perfil</Text>
              </View>
            </View>
          </View>

          <View style={styles.loginPrompt}>
            <LogIn size={48} color="#22C55E" />
            <Text style={styles.loginPromptTitle}>Entre na sua conta</Text>
            <Text style={styles.loginPromptText}>
              Faça login para acessar seu perfil, estatísticas, assinatura e muito mais!
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <LogIn size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Fazer Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image 
              source={{ 
                uri: profileData.avatarUrl || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop' 
              }}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profileData.name}</Text>
              <View style={styles.rating}>
                <Star size={20} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.ratingText}>{profileData.rating}</Text>
                <Text style={styles.ratingCount}>({profileData.ratingCount} avaliações)</Text>
              </View>
              <Text style={styles.position}>{profileData.position} • {profileData.yearsPlaying} anos jogando</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={handleLogout}
            disabled={isLogoutLoading}
          >
            <LogOut size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Crown size={24} color={subscriptionData.plan === 'premium' ? '#F59E0B' : '#6B7280'} />
            <View style={styles.subscriptionInfo}>
              <Text style={styles.subscriptionTitle}>
                {subscriptionData.plan === 'premium' ? 'FutZone Premium' : 'Plano Gratuito'}
              </Text>
              <View style={styles.subscriptionStatus}>
                {subscriptionData.isActive ? (
                  <CheckCircle size={16} color="#22C55E" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={[
                  styles.subscriptionStatusText,
                  { color: subscriptionData.isActive ? '#22C55E' : '#EF4444' }
                ]}>
                  {subscriptionData.isActive ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </View>
          </View>

          {subscriptionData.isTrialActive && subscriptionData.daysLeftInTrial > 0 && (
            <View style={styles.trialInfo}>
              <Calendar size={16} color="#F59E0B" />
              <Text style={styles.trialText}>
                {subscriptionData.daysLeftInTrial} dia{subscriptionData.daysLeftInTrial !== 1 ? 's' : ''} restante{subscriptionData.daysLeftInTrial !== 1 ? 's' : ''} no período gratuito
              </Text>
            </View>
          )}

          {subscriptionData.plan === 'premium' && subscriptionData.subscriptionEndsAt && (
            <View style={styles.subscriptionDetails}>
              <Text style={styles.subscriptionDetailText}>
                Renovação: {subscriptionData.subscriptionEndsAt.toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}

          {subscriptionData.isTrialActive && subscriptionData.daysLeftInTrial > 0 && (
            <View style={styles.subscriptionActions}>
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={handleCreatePayment}
                disabled={isLoading}
              >
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.subscribeButtonText}>
                  {isLoading ? 'Gerando pagamento...' : 'Assinar Premium'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.subscriptionPrice}>R$ 27,90/mês</Text>
            </View>
          )}

          {!subscriptionData.isTrialActive && subscriptionData.plan === 'free' && (
            <View style={styles.subscriptionActions}>
              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={handleCreatePayment}
                disabled={isLoading}
              >
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.subscribeButtonText}>
                  {isLoading ? 'Gerando pagamento...' : 'Assinar Premium'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.subscriptionPrice}>R$ 27,90/mês</Text>
              <Text style={styles.subscriptionExpired}>Período gratuito expirado</Text>
            </View>
          )}

          {subscriptionData.plan === 'premium' && (
            <View style={styles.subscriptionActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>
                  {isLoading ? 'Processando...' : 'Cancelar Assinatura'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.premiumFeatures}>
            <Text style={styles.premiumFeaturesTitle}>Benefícios Premium:</Text>
            <Text style={styles.premiumFeature}>• Apostas ilimitadas</Text>
            <Text style={styles.premiumFeature}>• Acesso prioritário a goleiros</Text>
            <Text style={styles.premiumFeature}>• Estatísticas avançadas</Text>
            <Text style={styles.premiumFeature}>• Suporte prioritário</Text>
          </View>
        </View>
        <View style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <View style={styles.rankBadge}>
              <Text style={[styles.rankLetter, { color: rankColor }]}>{ranking.rank}</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.rankTitle}>Rank {rankDescription}</Text>
              <Text style={styles.rankScore}>Nota: {ranking.score}/100</Text>
            </View>
          </View>
          <View style={styles.rankProgress}>
            <View style={styles.rankProgressBar}>
              <View style={[
                styles.rankProgressFill,
                { width: `${ranking.score}%`, backgroundColor: rankColor }
              ]} />
            </View>
            <Text style={styles.rankProgressText}>{ranking.score}%</Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>Nível Profissional</Text>
            <Award size={24} color="#F59E0B" />
          </View>
          <Text style={styles.levelDescription}>
            Continue jogando para alcançar o nível Expert
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '75%' }]} />
          </View>
          <Text style={styles.progressText}>750 / 1000 XP</Text>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <stat.icon size={24} color="#22C55E" />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>Performance Recente</Text>
          <View style={styles.performanceStats}>
            <View style={styles.performanceStat}>
              <Text style={styles.performanceValue}>{winRate}%</Text>
              <Text style={styles.performanceLabel}>Taxa de vitória</Text>
            </View>
            <View style={styles.performanceStat}>
              <Text style={styles.performanceValue}>{(playerStats.goals / playerStats.games_played).toFixed(1)}</Text>
              <Text style={styles.performanceLabel}>Gols por jogo</Text>
            </View>
            <View style={styles.performanceStat}>
              <Text style={styles.performanceValue}>{(playerStats.assists / playerStats.games_played).toFixed(1)}</Text>
              <Text style={styles.performanceLabel}>Assist por jogo</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[
                styles.achievementCard,
                !achievement.unlocked && styles.lockedAchievement
              ]}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.lockedText
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.unlocked && styles.lockedText
                  ]}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Trophy size={16} color="#F59E0B" />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.editProfile}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.editProfileText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLogoutLoading}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>
            {isLogoutLoading ? 'Saindo...' : 'Sair da Conta'}
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
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  position: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsButton: {
    padding: 8,
  },
  subscriptionCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscriptionStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  trialText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  subscriptionDetails: {
    marginBottom: 16,
  },
  subscriptionDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionActions: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
    minWidth: 200,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  subscriptionExpired: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumFeatures: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  premiumFeaturesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  premiumFeature: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  rankCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankLetter: {
    fontSize: 28,
    fontWeight: '800',
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  rankScore: {
    fontSize: 14,
    color: '#6B7280',
  },
  rankProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  rankProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rankProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'right',
  },
  levelCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  levelDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  performanceCard: {
    marginHorizontal: 24,
    backgroundColor: '#22C55E',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#DCFCE7',
    textAlign: 'center',
  },
  achievementsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lockedAchievement: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  unlockedBadge: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 20,
  },
  editProfile: {
    marginHorizontal: 24,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loginPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    gap: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});