import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Lock, Store, ArrowRight, BookOpen, LogIn, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    businessName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!username.trim()) {
      newErrors.username = 'Le nom dutilisateur est requis';
    }

    if (!validateEmail(email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }

    if (!businessName.trim()) {
      newErrors.businessName = 'Le nom du commerce est requis';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [registerError, setRegisterError] = useState('');

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setRegisterError('');
    try {
      const result = await api.register({
        username,
        email: email || undefined,
        password,
        businessName
      });

      if (result.success) {
        // Sur le web, Alert avec callback ne fonctionne pas — on redirige directement
        router.replace('/(tabs)');
      } else {
        const msg = result.message || 'Impossible de créer le compte';
        setRegisterError(msg);
        if (Platform.OS === 'web') {
          window.alert('Erreur\n\n' + msg);
        } else {
          showAlert('Erreur', msg);
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      const msg = 'Une erreur est survenue. Veuillez réessayer.';
      setRegisterError(msg);
      if (Platform.OS === 'web') {
        window.alert('Erreur\n\n' + msg);
      } else {
        showAlert('Erreur', msg);
      }
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
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <BookOpen size={50} color="white" />
          </View>
          <Text style={[styles.title, { color: colors.textSecondary }]}>Bienvenue sur</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>Comptabilité Chrétiens</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sécurisez votre travail en créant votre compte</Text>
        </View>

        <View style={[styles.form, { backgroundColor: colors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Votre Nom Complet</Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.username ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.username && styles.inputContainerError]}>
              <User size={20} color={errors.username ? colors.error : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor={colors.textTertiary}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (errors.username) {
                    setErrors(prev => ({ ...prev, username: undefined }));
                  }
                }}
                autoCapitalize="words"
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
            <Text style={[styles.label, { color: colors.text }]}>Email (optionnel)</Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.email ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.email && styles.inputContainerError]}>
              <Mail size={20} color={errors.email ? colors.error : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: jean@exemple.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {email.length > 0 && validateEmail(email) && !errors.email && (
                <CheckCircle2 size={18} color={colors.success} />
              )}
              {errors.email && (
                <AlertCircle size={18} color={colors.error} />
              )}
            </View>
            {errors.email && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} style={styles.errorIcon} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nom de votre Commerce</Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.businessName ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.businessName && styles.inputContainerError]}>
              <Store size={20} color={errors.businessName ? colors.error : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Ma Boutique Chrétienne"
                placeholderTextColor={colors.textTertiary}
                value={businessName}
                onChangeText={(text) => {
                  setBusinessName(text);
                  if (errors.businessName) {
                    setErrors(prev => ({ ...prev, businessName: undefined }));
                  }
                }}
              />
              {businessName.length > 0 && !errors.businessName && (
                <CheckCircle2 size={18} color={colors.success} />
              )}
              {errors.businessName && (
                <AlertCircle size={18} color={colors.error} />
              )}
            </View>
            {errors.businessName && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} style={styles.errorIcon} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.businessName}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mot de passe (min. 8 caractères)</Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.password ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.password && styles.inputContainerError]}>
              <Lock size={20} color={errors.password ? colors.error : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                  if (errors.confirmPassword && text === confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
              </TouchableOpacity>
              {password.length >= 8 && !errors.password && (
                <CheckCircle2 size={18} color={colors.success} />
              )}
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe</Text>
            <View style={[
              styles.inputContainer, 
              { borderColor: errors.confirmPassword ? colors.errorBorder : colors.border, backgroundColor: colors.inputBg },
              errors.confirmPassword && styles.inputContainerError]}>
              <Lock size={20} color={errors.confirmPassword ? colors.error : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
              </TouchableOpacity>
              {confirmPassword.length > 0 && password === confirmPassword && !errors.confirmPassword && (
                <CheckCircle2 size={18} color={colors.success} />
              )}
              {errors.confirmPassword && (
                <AlertCircle size={18} color={colors.error} />
              )}
            </View>
            {errors.confirmPassword && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} style={styles.errorIcon} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.confirmPassword}</Text>
              </View>
            )}
          </View>

          {registerError ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <Text style={{ color: '#dc2626', fontSize: 14, textAlign: 'center' }}>{registerError}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>Créer mon compte</Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: colors.primaryLight }]} 
            onPress={() => router.push('/(auth)/login')}
          >
            <LogIn size={16} color={colors.primary} />
            <Text style={[styles.loginText, { color: colors.primary }]}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>© {new Date().getFullYear()} Comptabilite Chretiens</Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Sécurité et Confidentialité Garanties</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContent: { padding: 30, paddingBottom: 50, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
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
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    marginBottom: 10
  },
  loginText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600'
  },
  footerText: { color: '#9ca3af', fontSize: 12, marginTop: 4 }
});

