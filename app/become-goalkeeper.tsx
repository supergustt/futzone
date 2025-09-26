import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Save, Clock, MapPin, DollarSign, User, Ruler, Weight } from 'lucide-react-native';
import { useProfile } from '../contexts/ProfileContext';

const timeSlots = [
  { id: 'morning', label: 'Manhã (6h-12h)', value: 'morning' },
  { id: 'afternoon', label: 'Tarde (12h-18h)', value: 'afternoon' },
  { id: 'evening', label: 'Noite (18h-24h)', value: 'evening' },
];

const weekDays = [
  { id: 'monday', label: 'Segunda', value: 'monday' },
  { id: 'tuesday', label: 'Terça', value: 'tuesday' },
  { id: 'wednesday', label: 'Quarta', value: 'wednesday' },
  { id: 'thursday', label: 'Quinta', value: 'thursday' },
  { id: 'friday', label: 'Sexta', value: 'friday' },
  { id: 'saturday', label: 'Sábado', value: 'saturday' },
  { id: 'sunday', label: 'Domingo', value: 'sunday' },
];

export default function BecomeGoalkeeperScreen() {
  const { updateProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    experienceYears: '',
    location: '',
    pricePerGame: '',
    bio: '',
    availableDays: [] as string[],
    availableTimes: [] as string[],
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const toggleTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(time)
        ? prev.availableTimes.filter(t => t !== time)
        : [...prev.availableTimes, time]
    }));
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.height.trim() || !formData.weight.trim() || !formData.experienceYears.trim() || 
        !formData.location.trim() || !formData.pricePerGame.trim() || !formData.bio.trim()) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios');
      return;
    }

    if (formData.availableDays.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um dia da semana');
      return;
    }

    if (formData.availableTimes.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um horário');
      return;
    }

    // Update profile with goalkeeper data
    updateProfile({
      isGoalkeeper: true,
      goalkeeperProfile: {
        height: formData.height,
        weight: formData.weight,
        experienceYears: formData.experienceYears,
        location: formData.location,
        pricePerGame: formData.pricePerGame,
        bio: formData.bio,
        availableDays: formData.availableDays,
        availableTimes: formData.availableTimes,
      }
    });

    // Navigate to goalkeeper tab immediately
    router.replace('/(tabs)/goalkeeper');
    
    // Show success message after navigation
    setTimeout(() => {
      Alert.alert('Sucesso', 'Perfil de goleiro criado com sucesso!');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Quero ser Goleiro</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Físicas</Text>
          
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Altura (cm) *</Text>
              <View style={styles.inputWithIcon}>
                <Ruler size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.height}
                  onChangeText={(value) => updateField('height', value)}
                  placeholder="Ex: 180"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso (kg) *</Text>
              <View style={styles.inputWithIcon}>
                <Weight size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(value) => updateField('weight', value)}
                  placeholder="Ex: 75"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experiência</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Anos jogando como goleiro *</Text>
            <View style={styles.inputWithIcon}>
              <User size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.experienceYears}
                onChangeText={(value) => updateField('experienceYears', value)}
                placeholder="Ex: 5"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Conte sobre sua experiência *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => updateField('bio', value)}
              placeholder="Descreva sua experiência como goleiro, clubes que jogou, conquistas..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localização e Preço</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Onde você mora/atende *</Text>
            <View style={styles.inputWithIcon}>
              <MapPin size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                placeholder="Ex: Vila Madalena, São Paulo"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço por jogo (R$) *</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.pricePerGame}
                onChangeText={(value) => updateField('pricePerGame', value)}
                placeholder="Ex: 80"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilidade</Text>
          <Text style={styles.sectionSubtitle}>Selecione os dias da semana que você está disponível</Text>
          
          <View style={styles.daysGrid}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  formData.availableDays.includes(day.value) && styles.dayButtonActive
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Text style={[
                  styles.dayButtonText,
                  formData.availableDays.includes(day.value) && styles.dayButtonTextActive
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
          <Text style={styles.sectionSubtitle}>Selecione os períodos que você pode jogar</Text>
          
          <View style={styles.timesGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time.id}
                style={[
                  styles.timeButton,
                  formData.availableTimes.includes(time.value) && styles.timeButtonActive
                ]}
                onPress={() => toggleTime(time.value)}
              >
                <Clock size={20} color={formData.availableTimes.includes(time.value) ? "#FFFFFF" : "#6B7280"} />
                <Text style={[
                  styles.timeButtonText,
                  formData.availableTimes.includes(time.value) && styles.timeButtonTextActive
                ]}>
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
          <Text style={styles.submitButtonText}>Criar Perfil de Goleiro</Text>
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
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    flex: 1,
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
    alignItems: 'center',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  timesGrid: {
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  timeButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  timeButtonText: {
    fontSize: 16,
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
    marginTop: 32,
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