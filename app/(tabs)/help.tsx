import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../src/theme/ThemeContext';

export default function HelpScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Clock size={64} color="#059669" />
        <Text style={[styles.title, { color: colors.text }]}>En cours de développement</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Cette fonctionnalité sera disponible très bientôt !
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
  },
});
