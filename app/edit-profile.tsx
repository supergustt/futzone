import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import { useProfile } from '@/contexts/ProfileContext';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Image } from 'react-native';

export default function EditProfileScreen() {
  const { profileData, updateProfile } = useProfile();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  
  const [formData, setFormData] = useState({
    name: profileData.name,
    position: profileData.position,
    yearsPlaying: profileData.yearsPlaying.toString(),
    address: profileData.address,
    gamesPlayed: profileData.gamesPlayed.toString(),
    goals: profileData.goals.toString(),
    assists: profileData.assists.toString(),
    wins: profileData.wins.toString(),
    avatarUrl: profileData.avatarUrl || '',
  });

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome é obrigatório');
      return;
    }

    // Update the profile data in context
    updateProfile({
      name: formData.name.trim(),
      position: formData.position,
      yearsPlaying: parseInt(formData.yearsPlaying) || 0,
      address: formData.address,
      gamesPlayed: parseInt(formData.gamesPlayed) || 0,
      goals: parseInt(formData.goals) || 0,
      assists: parseInt(formData.assists) || 0,
      wins: parseInt(formData.wins) || 0,
      avatarUrl: formData.avatarUrl,
    });

    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTakePhoto = async () => {
    if (!permission) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert('Erro', 'Permissão da câmera é necessária para alterar a foto');
        return;
      }
    }

    if (!permission.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert('Erro', 'Permissão da câmera é necessária para alterar a foto');
        return;
      }
    }

    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        if (photo) {
          updateField('avatarUrl', photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível tirar a foto');
      }
    }
  };

  if (showCamera) {
    return <CameraScreen onTakePicture={takePicture} onCancel={() => setShowCamera(false)} setCameraRef={setCameraRef} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Save size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handleTakePhoto}>
            <Image 
              source={{ 
                uri: formData.avatarUrl || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop' 
              }}
              style={styles.profilePhoto}
            />
            <View style={styles.cameraButton}>
              <Camera size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoText}>Toque para alterar foto</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Digite seu nome"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              placeholder="Digite seu endereço"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Posição</Text>
            <TextInput
              style={styles.input}
              value={formData.position}
              onChangeText={(value) => updateField('position', value)}
              placeholder="Ex: Meio-campo, Atacante, Zagueiro"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Anos Jogando</Text>
            <TextInput
              style={styles.input}
              value={formData.yearsPlaying}
              onChangeText={(value) => updateField('yearsPlaying', value)}
              placeholder="Quantos anos você joga futebol?"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estatísticas</Text>
          <Text style={styles.sectionSubtitle}>
            Atualize suas estatísticas para melhorar seu ranking
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statInput}>
              <Text style={styles.label}>Jogos</Text>
              <TextInput
                style={styles.input}
                value={formData.gamesPlayed}
                onChangeText={(value) => updateField('gamesPlayed', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.statInput}>
              <Text style={styles.label}>Vitórias</Text>
              <TextInput
                style={styles.input}
                value={formData.wins}
                onChangeText={(value) => updateField('wins', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statInput}>
              <Text style={styles.label}>Gols</Text>
              <TextInput
                style={styles.input}
                value={formData.goals}
                onChangeText={(value) => updateField('goals', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.statInput}>
              <Text style={styles.label}>Assistências</Text>
              <TextInput
                style={styles.input}
                value={formData.assists}
                onChangeText={(value) => updateField('assists', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CameraScreen({ onTakePicture, onCancel, setCameraRef }: {
  onTakePicture: () => void;
  onCancel: () => void;
  setCameraRef: (ref: CameraView | null) => void;
}) {
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        facing="front"
        ref={setCameraRef}
      >
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={onTakePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
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
    marginBottom: 24,
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
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statInput: {
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22C55E',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    width: 80,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22C55E',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});