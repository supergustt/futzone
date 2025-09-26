import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, MapPin, Clock, Calendar, DollarSign, Users, FileText } from 'lucide-react-native';
import { useProfile } from '@/contexts/ProfileContext';

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const weekDays = [
  { id: 'today', label: 'Hoje', value: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã', value: 'Amanhã' },
  { id: 'monday', label: 'Segunda', value: 'Segunda' },
  { id: 'tuesday', label: 'Terça', value: 'Terça' },
  { id: 'wednesday', label: 'Quarta', value: 'Quarta' },
  { id: 'thursday', label: 'Quinta', value: 'Quinta' },
  { id: 'friday', label: 'Sexta', value: 'Sexta' },
  { id: 'saturday', label: 'Sábado', value: 'Sábado' },
  { id: 'sunday', label: 'Domingo', value: 'Domingo' },
];

export default function CreateTeamScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { profileData } = useProfile();
  
  const [formData, setFormData] = useState({
    location: '',
    date: '',
    time: '',
    price: '',
    description: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMaxPlayers = (gameType: string) => {
    switch (gameType) {
      case '4x4': return 8;
      case '5x5': return 10;
      case '12x12': return 24;
      default: return 10;
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.location.trim() || !formData.date || !formData.time || 
        !formData.price.trim() || !formData.description.trim()) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios');
      return;
    }

    // Create new team object
    const newTeam = {
      id: Date.now(),
      type: type || '4x4',
      location: formData.location,
      time: formData.time,
      date: formData.date,
      players: 1, // Creator is the first player
      rating: 0, // New team starts with no rating
      price: `R$ ${formData.price}`,
      priceValue: parseInt(formData.price),
      description: formData.description,
      creator: profileData.name,
      teamA: [profileData.name], // Creator starts in team A
      teamB: [],
      availableSpots: getMaxPlayers(type || '4x4') - 1,
    };

    // In a real app, this would be saved to a database
    // For now, we'll just show success and navigate back
    Alert.alert('Sucesso!', 'Time criado com sucesso!', [
      { 
        text: 'OK', 
        onPress: () => {
          router.replace('/(tabs)');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Criar Time {type}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.typeCard}>
          <Users size={32} color="#22C55E" />
          <View style={styles.typeInfo}>
            <Text style={styles.typeTitle}>Time {type}</Text>
            <Text style={styles.typeSubtitle}>
              {getMaxPlayers(type || '4x4')} jogadores • {type === '12x12' ? 'Campo completo' : 'Society'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Jogo</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Local do jogo *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                placeholder="Ex: Arena Sports, Campo Central"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição *</Text>
            <View style={styles.inputWithIcon}>
              <FileText size={20} color="#6B7280" />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Descreva o jogo, nível dos jogadores, regras especiais..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço por jogador (R$) *</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(value) => updateField('price', value)}
                placeholder="Ex: 120"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data e Horário</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dia *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.daysContainer}>
                {weekDays.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayButton,
                      formData.date === day.value && styles.dayButtonActive
                    ]}
                    onPress={() => updateField('date', day.value)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      formData.date === day.value && styles.dayButtonTextActive
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Horário *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timesContainer}>
                {timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeButton,
                      formData.time === time && styles.timeButtonActive
                    ]}
                    onPress={() => updateField('time', time)}
                  >
                    <Clock size={16} color={formData.time === time ? "#FFFFFF" : "#6B7280"} />
                    <Text style={[
                      styles.timeButtonText,
                      formData.time === time && styles.timeButtonTextActive
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitButtonText}>Criar Time {type}</Text>
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  dayButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  timesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  timeButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    marginHorizontal: 24,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});