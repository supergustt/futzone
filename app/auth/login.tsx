import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleAuth = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        Alert.alert('Erro', 'Nome é obrigatório para cadastro');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Erro', 'Senhas não coincidem');
        return;
      }
      if (formData.password.length < 6) {
        Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          Alert.alert('Erro no Login', error.message);
          return;
        }

        if (data.user) {
          Alert.alert('Sucesso!', 'Login realizado com sucesso!');
          router.replace('/(tabs)');
        }
      } else {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              name: formData.name.trim(),
            }
          }
        });

        if (error) {
          Alert.alert('Erro no Cadastro', error.message);
          return;
        }

        if (data.user) {
          // Criar perfil do usuário
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              name: formData.name.trim(),
              position: 'Meio-campo',
              years_playing: 0,
              rating: 0.0,
              rating_count: 0,
              games_played: 0,
              goals: 0,
              assists: 0,
              wins: 0,
              rank: 'C',
              experience_points: 0,
              level: 'Iniciante',
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            Alert.alert('Aviso', 'Conta criada, mas houve um problema ao criar o perfil. Você pode completar seu perfil depois.');
          } else {
            console.log('Perfil criado com sucesso');
          }

          Alert.alert(
            'Cadastro Realizado!', 
            'Sua conta foi criada com sucesso. Você já pode usar o app!',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>{isLogin ? 'Entrar' : 'Criar Conta'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>⚽</Text>
          <Text style={styles.appName}>FutZone</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta e comece a jogar'}
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome completo *</Text>
              <View style={styles.inputWithIcon}>
                <User size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputWithIcon}>
              <Mail size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="Digite seu email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha *</Text>
            <View style={styles.inputWithIcon}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                placeholder={isLogin ? "Digite sua senha" : "Mínimo 6 caracteres"}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar senha *</Text>
              <View style={styles.inputWithIcon}>
                <Lock size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.authButton, isLoading && styles.authButtonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <Text style={styles.authButtonText}>
              {isLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchAuth}>
            <Text style={styles.switchAuthText}>
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchAuthLink}>
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 24,
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  authButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  authButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchAuth: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchAuthLink: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});