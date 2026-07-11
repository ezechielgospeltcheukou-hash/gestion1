import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, ArrowRight, BookOpen, User, Plus, Mail, Eye, EyeOff, CheckCircle2, AlertCircle, Shield, Store } from 'lucide-react-native';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const colors = useThemeColors();
  const isEmployeeMode = mode === 'employee';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [errors, setErrors] = useState<{username?: string; password?: string}>({});

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {username?: string; password?: string} = {};

    if (!username.trim()) {
      newErrors.username = isEmployeeMode 
        ? 'Le code employe est requis' 
        : 'Le nom d\'utilisateur est requis';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 4) {
      newErrors.password = 'Le mot de passe doit contenir au moins 4 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoginError('');
    try {
      let result;
      if (isEmployeeMode) {
        result = await api.loginByCode({ employeeCode: username, password });
      } else {
        result = await api.login({ username, password });
      }
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        const msg = result.message || 'Identifiants incorrects';
        setLoginError(msg);
        showAlert('Erreur', msg);
      }
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      const msg = 'Une erreur est survenue. Veuillez reessayer: ' + (error as Error).message;
      setLoginError(msg);
      showAlert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mode Indicator */}
        <TouchableOpacity 
          style={[styles.modeIndicator, { backgroundColor: isEmployeeMode ? '#dcfce7' : '#dbeafe' }]}
          onPress={() => router.replace(isEmployeeMode ? '/(auth)/login' : '/(auth)/login?mode=employee')}
        >
          {isEmployeeMode ? (
            <Store size={16} color="#16a34a" />
          ) : (
            <Shield size={16} color="#2563eb" />
          )}
          <Text style={[styles.modeText, { color: isEmployeeMode ? '#16a34a' : '#2563eb' }]}>
            {isEmployeeMode ? 'Espace Employe' : 'Espace Administrateur'}
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <BookOpen size={50} color="white" />
          </View>
          <Text style={[styles.title, { color: colors.textSecondary }]}>Bienvenue sur</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>Comptabilite Chretiens</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isEmployeeMode ? 'Connectez-vous avec votre code employe' : 'Connectez-vous pour continuer'}
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {isEmployeeMode ? 'Connexion Employe' : 'Connexion'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {isEmployeeMode ? 'Code Employe' : 'Nom d\'utilisateur'}
            </Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.username ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.username && styles.inputContainerError]}>
              {isEmployeeMode ? (
                <Store size={20} color={errors.username ? colors.error : colors.textTertiary} style={styles.icon} />
              ) : (
                <User size={20} color={errors.username ? colors.error : colors.textTertiary} style={styles.icon} />
              )}
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={isEmployeeMode ? 'Ex: EMP-001' : 'Votre nom d\'utilisateur'}
                placeholderTextColor={colors.textTertiary}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) {
                    setErrors(prev => ({ ...prev, username: undefined }));
                  }
                }}
                autoCapitalize="none"
                autoComplete="username"
              />
              {username.length > 0 && !errors.username && (
                <CheckCircle2 size={18} color={colors.success} />
              )}
              {errors.username && (
                <AlertCircle size={18} color={colors.error} />
              )}
            </View>
            {errors.username && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} style={styles.errorIcon} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.username}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mot de passe</Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.password ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.password && styles.inputContainerError]}>
              <Lock size={20} color={errors.password ? colors.error : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Votre mot de passe"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
              </TouchableOpacity>
              {errors.password && (
                <AlertCircle size={18} color={colors.error} />
              )}
            </View>
            {errors.password && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} style={styles.errorIcon} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.password}</Text>
              </View>
            )}
          </View>

          {loginError ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <Text style={{ color: '#dc2626', fontSize: 14, textAlign: 'center' }}>{loginError}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>Se connecter</Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          {!isEmployeeMode && (
            <TouchableOpacity 
              style={[styles.createAccountBtn, { backgroundColor: colors.primaryLight }]} 
              onPress={() => router.push('/(auth)/register')}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.createAccountText, { color: colors.primary }]}>Creer un compte</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.replace('/(auth)')}>
            <Text style={[styles.backToHome, { color: colors.primary }]}>Retour a l'accueil</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>© {new Date().getFullYear()} Comptabilite Chretiens</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 30, paddingBottom: 50, flexGrow: 1 },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    gap: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logoContainer: { 
    width: 100, 
    height: 100, 
    backgroundColor: '#059669', 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  title: { fontSize: 18, color: '#4b5563', fontWeight: '500' },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#059669', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  form: { backgroundColor: 'white', borderRadius: 25, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 30, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 15, paddingHorizontal: 15, height: 56, backgroundColor: '#f9fafb' },
  inputContainerError: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  errorIcon: { marginRight: 6 },
  errorText: { color: '#ef4444', fontSize: 12 },
  button: { backgroundColor: '#059669', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 15, marginTop: 10, shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  footer: { alignItems: 'center', marginTop: 40 },
  createAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    marginBottom: 10
  },
  createAccountText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600'
  },
  backToHome: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  footerText: { color: '#9ca3af', fontSize: 12, marginTop: 4 }
});
