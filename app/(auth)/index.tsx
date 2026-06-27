import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Shield, Store, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../src/theme/ThemeContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <BookOpen size={60} color="white" />
          </View>
          <Text style={styles.appName}>Comptabilite Chretiens</Text>
          <Text style={styles.subtitle}>Gestion comptable simplifiee</Text>
        </View>

        {/* Choice Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: 'white' }]}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#dbeafe' }]}>
              <Shield size={40} color="#2563eb" />
            </View>
            <Text style={[styles.cardTitle, { color: '#111827' }]}>Administrateur</Text>
            <Text style={[styles.cardDescription, { color: '#6b7280' }]}>
              Gerer votre commerce, les employes et les parametres
            </Text>
            <View style={[styles.cardButton, { backgroundColor: '#2563eb' }]}>
              <Text style={styles.cardButtonText}>Se connecter</Text>
              <ArrowRight size={18} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, { backgroundColor: 'white' }]}
            onPress={() => router.push('/(auth)/login?mode=employee')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIcon, { backgroundColor: '#dcfce7' }]}>
              <Store size={40} color="#16a34a" />
            </View>
            <Text style={[styles.cardTitle, { color: '#111827' }]}>Employe</Text>
            <Text style={[styles.cardDescription, { color: '#6b7280' }]}>
              Acceder a votre espace avec votre code employe
            </Text>
            <View style={[styles.cardButton, { backgroundColor: '#16a34a' }]}>
              <Text style={styles.cardButtonText}>Se connecter</Text>
              <ArrowRight size={18} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.registerBtn, { borderColor: 'rgba(255,255,255,0.3)' }]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>Creer un compte administrateur</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>v1.2.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  cardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  registerBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  registerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});
