import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Lock, Store, ArrowRight, BookOpen, LogIn, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';
import { ALL_BUSINESS_TYPES, type BusinessType } from '../../src/config/businessTypes';

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
  const [step, setStep] = useState<1 | 2>(1); // Étape 1: activité, Étape 2: informations
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
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
    businessType?: string;
  }>({});
  const [registerError, setRegisterError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (!username.trim()) newErrors.username = 'Le nom utilisateur est requis';
    if (!validateEmail(email)) newErrors.email = 'Veuillez entrer un email valide';
    if (!businessName.trim()) newErrors.businessName = 'Le nom du commerce est requis';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    else if (password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (!confirmPassword) newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectActivity = (type: BusinessType) => {
    setSelectedBusinessType(type);
  };

  const handleNextStep = () => {
    if (!selectedBusinessType) {
      setErrors(prev => ({ ...prev, businessType: 'Veuillez choisir votre activité' }));
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setRegisterError('');
    try {
      const result = await api.register({
        username,
        email: email || undefined,
        password,
        businessName,
        businessType: selectedBusinessType || 'GENERAL',
      });

      if (result.success) {
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
      showAlert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── ÉTAPE 1 : Choisir l'activité ───────────────────────────────────────────
  if (step === 1) {
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
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Étape 1/2 — Choisissez votre type d'activité
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🏪 Quelle est votre activité ?
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              L'application s'adaptera automatiquement à votre commerce
            </Text>

            {errors.businessType && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color="#ef4444" />
                <Text style={styles.errorBoxText}>{errors.businessType}</Text>
              </View>
            )}

            <View style={styles.activitiesGrid}>
              {ALL_BUSINESS_TYPES.map((config) => {
                const isSelected = selectedBusinessType === config.type;
                return (
                  <TouchableOpacity
                    key={config.type}
                    style={[
                      styles.activityCard,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => handleSelectActivity(config.type)}
                  >
                    <Text style={styles.activityEmoji}>{config.emoji}</Text>
                    <Text style={[styles.activityLabel, { color: colors.text }, isSelected && { color: colors.primary, fontWeight: 'bold' }]}>
                      {config.label}
                    </Text>
                    <Text style={[styles.activityDesc, { color: colors.textTertiary }]} numberOfLines={2}>
                      {config.description}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                        <CheckCircle2 size={14} color="white" />
                        <Text style={styles.selectedBadgeText}>Sélectionné</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: selectedBusinessType ? colors.primary : '#9ca3af' }]}
              onPress={handleNextStep}
              disabled={!selectedBusinessType}
            >
              <Text style={styles.buttonText}>Continuer</Text>
              <ArrowRight size={20} color="white" />
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── ÉTAPE 2 : Informations du compte ───────────────────────────────────────
  const selectedConfig = ALL_BUSINESS_TYPES.find(c => c.type === selectedBusinessType);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 40 }}>{selectedConfig?.emoji}</Text>
          </View>
          <Text style={[styles.title, { color: colors.textSecondary }]}>Étape 2/2 — Vos informations</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>{selectedConfig?.label}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Créez votre compte administrateur</Text>
        </View>

        {/* Bouton retour */}
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Changer d'activité</Text>
        </TouchableOpacity>

        <View style={[styles.form, { backgroundColor: colors.card }]}>

          {/* Nom complet */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Votre Nom Complet</Text>
            <View style={[styles.inputContainer, { borderColor: errors.username ? '#fecaca' : colors.border, backgroundColor: colors.inputBg }]}>
              <User size={20} color={errors.username ? '#ef4444' : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Jean Dupont"
                placeholderTextColor={colors.textTertiary}
                value={username}
                onChangeText={(text) => { setUsername(text); setErrors(p => ({ ...p, username: undefined })); }}
                autoCapitalize="words"
              />
              {username.length > 0 && !errors.username && <CheckCircle2 size={18} color={colors.success} />}
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email (optionnel)</Text>
            <View style={[styles.inputContainer, { borderColor: errors.email ? '#fecaca' : colors.border, backgroundColor: colors.inputBg }]}>
              <Mail size={20} color={errors.email ? '#ef4444' : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: jean@exemple.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={(text) => { setEmail(text); setErrors(p => ({ ...p, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {email.length > 0 && validateEmail(email) && !errors.email && <CheckCircle2 size={18} color={colors.success} />}
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Nom du commerce */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nom de votre Commerce</Text>
            <View style={[styles.inputContainer, { borderColor: errors.businessName ? '#fecaca' : colors.border, backgroundColor: colors.inputBg }]}>
              <Store size={20} color={errors.businessName ? '#ef4444' : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={selectedConfig?.type === 'BIBLES' ? 'Ex: Librairie Chrétienne' : 'Ex: Ma Boutique'}
                placeholderTextColor={colors.textTertiary}
                value={businessName}
                onChangeText={(text) => { setBusinessName(text); setErrors(p => ({ ...p, businessName: undefined })); }}
              />
              {businessName.length > 0 && !errors.businessName && <CheckCircle2 size={18} color={colors.success} />}
            </View>
            {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
          </View>

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mot de passe (min. 8 caractères)</Text>
            <View style={[styles.inputContainer, { borderColor: errors.password ? '#fecaca' : colors.border, backgroundColor: colors.inputBg }]}>
              <Lock size={20} color={errors.password ? '#ef4444' : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => { setPassword(text); setErrors(p => ({ ...p, password: undefined })); }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirmer mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirmer le mot de passe</Text>
            <View style={[styles.inputContainer, { borderColor: errors.confirmPassword ? '#fecaca' : colors.border, backgroundColor: colors.inputBg }]}>
              <Lock size={20} color={errors.confirmPassword ? '#ef4444' : colors.textTertiary} style={styles.icon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirmez votre mot de passe"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOff size={20} color={colors.textTertiary} /> : <Eye size={20} color={colors.textTertiary} />}
              </TouchableOpacity>
              {confirmPassword.length > 0 && password === confirmPassword && !errors.confirmPassword && <CheckCircle2 size={18} color={colors.success} />}
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 30 },
  logoContainer: {
    width: 100, height: 100, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, elevation: 8,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10
  },
  title: { fontSize: 16, fontWeight: '500' },
  appName: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  form: { borderRadius: 25, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, marginBottom: 16 },
  activitiesGrid: { gap: 12, marginBottom: 20 },
  activityCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 16,
    alignItems: 'center',
  },
  activityEmoji: { fontSize: 36, marginBottom: 8 },
  activityLabel: { fontSize: 15, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  activityDesc: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    marginTop: 8
  },
  selectedBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 10, borderRadius: 10, marginBottom: 12 },
  errorBoxText: { color: '#ef4444', fontSize: 13 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, height: 56 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 58, borderRadius: 15, marginTop: 10,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  buttonDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  backBtn: { marginBottom: 12, paddingLeft: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 20 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12, marginBottom: 10
  },
  loginText: { fontSize: 14, fontWeight: '600' },
  footerText: { fontSize: 12, marginTop: 4 },
});
