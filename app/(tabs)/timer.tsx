import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer, Play, Pause, Square, Clock, Save, Plus, Users, MapPin, Calendar } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';

interface GameSession {
  id: string;
  teamType: '4x4' | '5x5' | '12x12';
  location: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  status: 'running' | 'paused' | 'completed';
  players: string[];
  notes?: string;
}

export default function TimerScreen() {
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [newGame, setNewGame] = useState({
    teamType: '4x4' as '4x4' | '5x5' | '12x12',
    location: '',
    players: '',
    notes: '',
  });

  // Load saved sessions from storage
  useEffect(() => {
    loadSessions();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const loadSessions = () => {
    // In a real app, this would load from Supabase
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSessions = localStorage.getItem('game_sessions');
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions));
        }
      }
    } catch (e) {
      console.error('Error loading sessions:', e);
    }
  };

  const saveSessions = (newSessions: GameSession[]) => {
    setSessions(newSessions);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('game_sessions', JSON.stringify(newSessions));
      }
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (!isRunning) {
      // Starting new game
      setShowNewGameModal(true);
    } else if (isPaused) {
      // Resume
      setIsPaused(false);
    }
  };

  const startNewGame = () => {
    if (!newGame.location.trim()) {
      Alert.alert('Erro', 'Digite o local do jogo');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    setCurrentTime(0);
    setShowNewGameModal(false);
    
    // Reset form
    setNewGame({
      teamType: '4x4',
      location: '',
      players: '',
      notes: '',
    });
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const stopTimer = () => {
    if (currentTime > 0) {
      setShowSaveModal(true);
    } else {
      resetTimer();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentTime(0);
  };

  const saveSession = (notes?: string) => {
    const now = new Date();
    const session: GameSession = {
      id: Date.now().toString(),
      teamType: newGame.teamType,
      location: newGame.location,
      date: now.toLocaleDateString('pt-BR'),
      startTime: new Date(now.getTime() - currentTime * 1000).toLocaleTimeString('pt-BR'),
      endTime: now.toLocaleTimeString('pt-BR'),
      duration: currentTime,
      status: 'completed',
      players: newGame.players.split(',').map(p => p.trim()).filter(p => p),
      notes: notes || newGame.notes,
    };

    const newSessions = [session, ...sessions];
    saveSessions(newSessions);
    
    setShowSaveModal(false);
    resetTimer();
    
    Alert.alert('Sucesso!', 'Sessão de jogo salva com sucesso!');
  };

  const deleteSession = (sessionId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja excluir esta sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            const newSessions = sessions.filter(s => s.id !== sessionId);
            saveSessions(newSessions);
          }
        }
      ]
    );
  };

  const getTimerColor = () => {
    if (!isRunning) return '#6B7280';
    if (isPaused) return '#F59E0B';
    return '#22C55E';
  };

  const getStatusText = () => {
    if (!isRunning) return 'Parado';
    if (isPaused) return 'Pausado';
    return 'Rodando';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cronômetro</Text>
          <Text style={styles.subtitle}>Registre o tempo real dos jogos</Text>
        </View>

        {/* Timer Display */}
        <View style={styles.timerCard}>
          <View style={styles.timerDisplay}>
            <Timer size={32} color={getTimerColor()} />
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {formatTime(currentTime)}
            </Text>
          </View>
          
          <Text style={[styles.statusText, { color: getTimerColor() }]}>
            {getStatusText()}
          </Text>

          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.startButton]}
              onPress={startTimer}
            >
              <Play size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>
                {!isRunning ? 'Iniciar' : isPaused ? 'Continuar' : 'Iniciado'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]}
              onPress={pauseTimer}
              disabled={!isRunning || isPaused}
            >
              <Pause size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Pausar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopTimer}
              disabled={!isRunning}
            >
              <Square size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Parar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Game Sessions History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Jogos</Text>
          
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Nenhum jogo registrado</Text>
              <Text style={styles.emptyStateSubtext}>Inicie o cronômetro para registrar seu primeiro jogo</Text>
            </View>
          ) : (
            sessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionType}>
                    <Users size={20} color="#22C55E" />
                    <Text style={styles.sessionTypeText}>{session.teamType}</Text>
                  </View>
                  <Text style={styles.sessionDuration}>
                    {formatTime(session.duration)}
                  </Text>
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.infoRow}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{session.location}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.infoText}>{session.date}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      {session.startTime} - {session.endTime}
                    </Text>
                  </View>
                </View>

                {session.players.length > 0 && (
                  <View style={styles.playersSection}>
                    <Text style={styles.playersTitle}>Jogadores:</Text>
                    <Text style={styles.playersText}>
                      {session.players.join(', ')}
                    </Text>
                  </View>
                )}

                {session.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesTitle}>Observações:</Text>
                    <Text style={styles.notesText}>{session.notes}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteSession(session.id)}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* New Game Modal */}
      <Modal visible={showNewGameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Jogo</Text>
            
            <View style={styles.typeSelector}>
              {(['4x4', '5x5', '12x12'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newGame.teamType === type && styles.typeButtonActive
                  ]}
                  onPress={() => setNewGame(prev => ({ ...prev, teamType: type }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newGame.teamType === type && styles.typeButtonTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={newGame.location}
              onChangeText={(text) => setNewGame(prev => ({ ...prev, location: text }))}
              placeholder="Local do jogo *"
              placeholderTextColor="#9CA3AF"
            />
            
            <TextInput
              style={styles.modalInput}
              value={newGame.players}
              onChangeText={(text) => setNewGame(prev => ({ ...prev, players: text }))}
              placeholder="Jogadores (separados por vírgula)"
              placeholderTextColor="#9CA3AF"
            />
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={newGame.notes}
              onChangeText={(text) => setNewGame(prev => ({ ...prev, notes: text }))}
              placeholder="Observações (opcional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowNewGameModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={startNewGame}
              >
                <Text style={styles.modalConfirmText}>Iniciar Jogo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Session Modal */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Salvar Sessão</Text>
            <Text style={styles.modalSubtitle}>
              Tempo jogado: {formatTime(currentTime)}
            </Text>
            
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="Observações sobre o jogo (opcional)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              onChangeText={(text) => setNewGame(prev => ({ ...prev, notes: text }))}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSaveModal(false);
                  resetTimer();
                }}
              >
                <Text style={styles.modalCancelText}>Descartar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={() => saveSession()}
              >
                <Text style={styles.modalConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  timerCard: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 32,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#22C55E',
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTypeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
  },
  sessionDuration: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  sessionInfo: {
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
  playersSection: {
    marginBottom: 12,
  },
  playersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  playersText: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
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
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#22C55E',
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
    backgroundColor: '#22C55E',
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