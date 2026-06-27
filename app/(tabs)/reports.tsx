import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, ShoppingCart, Package, Users, Truck, DollarSign, CreditCard, BarChart3, PieChart, Wallet, AlertTriangle, FileText } from 'lucide-react-native';
import { api } from '../../src/api/api';
import type { BilanData } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

export default function ReportsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [bilan, setBilan] = useState<BilanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBilan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getBilan();
      if (response.success && response.data) {
        setBilan(response.data);
      } else {
        setError(response.message || 'Impossible de charger le bilan');
      }
    } catch (error) {
      console.error('Error loading bilan:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBilan();
    }, [loadBilan])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>Bilan</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement du bilan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !bilan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>Bilan</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <AlertTriangle size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Données indisponibles'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBilan}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (val: number) => `${val.toLocaleString()} FCFA`;
  const d = bilan.bilan;
  const p = bilan.performance;
  const i = bilan.indicateurs;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Bilan Comptable</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Section Actif */}
        <Text style={styles.sectionTitle}>Actif</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Package size={28} color="#059669" />
            <Text style={styles.statLabel}>Stock</Text>
            <Text style={styles.statValue}>{formatCurrency(d.actif.stock.valeur)}</Text>
            <Text style={styles.statSubtext}>{d.actif.stock.unites} unités</Text>
          </View>
          <View style={styles.statCard}>
            <Wallet size={28} color="#059669" />
            <Text style={styles.statLabel}>Trésorerie</Text>
            <Text style={styles.statValue}>{formatCurrency(d.actif.tresorerie)}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={28} color="#2563eb" />
            <Text style={styles.statLabel}>Encaissements</Text>
            <Text style={styles.statValue}>{formatCurrency(d.actif.encaissement)}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingDown size={28} color="#ef4444" />
            <Text style={styles.statLabel}>Décaissements</Text>
            <Text style={styles.statValue}>{formatCurrency(d.actif.decaissement)}</Text>
          </View>
          <View style={styles.statCard}>
            <CreditCard size={28} color="#db2777" />
            <Text style={styles.statLabel}>Crédits Clients</Text>
            <Text style={styles.statValue}>{formatCurrency(d.actif.creditsClients)}</Text>
          </View>
          <View style={styles.statCard}>
            <FileText size={28} color="#f59e0b" />
            <Text style={styles.statLabel}>Factures Impayées</Text>
            <Text style={styles.statValue}>{formatCurrency(d.actif.facturesImpayees)}</Text>
          </View>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Actif</Text>
          <Text style={styles.totalValue}>{formatCurrency(d.actif.totalActif)}</Text>
        </View>

        {/* Section Passif */}
        <Text style={styles.sectionTitle}>Passif</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <CreditCard size={28} color="#ef4444" />
            <Text style={styles.statLabel}>Crédits Fournisseurs</Text>
            <Text style={styles.statValue}>{formatCurrency(d.passif.creditsFournisseurs)}</Text>
          </View>
          <View style={styles.statCard}>
            <Truck size={28} color="#ef4444" />
            <Text style={styles.statLabel}>Soldes Fournisseurs</Text>
            <Text style={styles.statValue}>{formatCurrency(d.passif.soldesFournisseurs)}</Text>
          </View>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Passif</Text>
          <Text style={styles.totalValue}>{formatCurrency(d.passif.totalPassif)}</Text>
        </View>

        {/* Capitaux Propres */}
        <View style={[styles.totalCard, { backgroundColor: '#d1fae5' }]}>
          <Text style={styles.totalLabel}>Capitaux Propres</Text>
          <Text style={[styles.totalValue, { color: '#059669' }]}>{formatCurrency(d.capitauxPropres)}</Text>
        </View>

        {/* Performance */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BarChart3 size={28} color="#059669" />
            <Text style={styles.statLabel}>CA Total</Text>
            <Text style={styles.statValue}>{formatCurrency(p.chiffreAffaires.total)}</Text>
          </View>
          <View style={styles.statCard}>
            <BarChart3 size={28} color="#059669" />
            <Text style={styles.statLabel}>CA du Mois</Text>
            <Text style={styles.statValue}>{formatCurrency(p.chiffreAffaires.moisEnCours)}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={28} color="#059669" />
            <Text style={styles.statLabel}>CA Aujourd'hui</Text>
            <Text style={styles.statValue}>{formatCurrency(p.chiffreAffaires.aujourdhui)}</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={28} color="#ef4444" />
            <Text style={styles.statLabel}>Coût des Ventes</Text>
            <Text style={styles.statValue}>{formatCurrency(p.coutDesVentes)}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={28} color="#059669" />
            <Text style={styles.statLabel}>Marge Brute</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>{formatCurrency(p.margeBrute)}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingDown size={28} color="#ef4444" />
            <Text style={styles.statLabel}>Dépenses Total</Text>
            <Text style={styles.statValue}>{formatCurrency(p.depenses.total)}</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingDown size={28} color="#ef4444" />
            <Text style={styles.statLabel}>Dépenses du Mois</Text>
            <Text style={styles.statValue}>{formatCurrency(p.depenses.moisEnCours)}</Text>
          </View>
          <View style={styles.statCard}>
            <PieChart size={28} color={p.resultatNet >= 0 ? '#059669' : '#ef4444'} />
            <Text style={styles.statLabel}>Résultat Net</Text>
            <Text style={[styles.statValue, { color: p.resultatNet >= 0 ? '#059669' : '#ef4444' }]}>{formatCurrency(p.resultatNet)}</Text>
          </View>
        </View>

        {/* Indicateurs */}
        <Text style={styles.sectionTitle}>Indicateurs</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Package size={28} color="#059669" />
            <Text style={styles.statLabel}>Produits</Text>
            <Text style={styles.statValue}>{i.totalProduits}</Text>
          </View>
          <View style={styles.statCard}>
            <ShoppingCart size={28} color="#059669" />
            <Text style={styles.statLabel}>Ventes</Text>
            <Text style={styles.statValue}>{i.totalVentes}</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={28} color="#059669" />
            <Text style={styles.statLabel}>Clients</Text>
            <Text style={styles.statValue}>{i.totalClients}</Text>
          </View>
          <View style={styles.statCard}>
            <Truck size={28} color="#059669" />
            <Text style={styles.statLabel}>Fournisseurs</Text>
            <Text style={styles.statValue}>{i.totalFournisseurs}</Text>
          </View>
          <View style={styles.statCard}>
            <DollarSign size={28} color="#059669" />
            <Text style={styles.statLabel}>Panier Moyen</Text>
            <Text style={styles.statValue}>{formatCurrency(i.valeurMoyennePanier)}</Text>
          </View>
          <View style={styles.statCard}>
            <PieChart size={28} color="#059669" />
            <Text style={styles.statLabel}>Ratio Marge</Text>
            <Text style={styles.statValue}>{i.ratioMarge.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Répartition des Ventes */}
        {bilan.repartitionVentes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Répartition des Ventes</Text>
            <View style={styles.tableCard}>
              {bilan.repartitionVentes.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{item.methode}</Text>
                  <Text style={styles.tableValue}>{item.nombre} ventes</Text>
                  <Text style={styles.tableAmount}>{formatCurrency(item.total)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Évolution Mensuelle */}
        {bilan.evolutionMensuelle.revenus.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Évolution Mensuelle (12 mois)</Text>
            <View style={styles.tableCard}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableLabel, styles.tableHeaderText]}>Mois</Text>
                <Text style={[styles.tableValue, styles.tableHeaderText]}>Revenus</Text>
                <Text style={[styles.tableAmount, styles.tableHeaderText]}>Dépenses</Text>
              </View>
              {bilan.evolutionMensuelle.revenus.map((rev, idx) => {
                const dep = bilan.evolutionMensuelle.depenses[idx];
                return (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={styles.tableLabel}>{rev.mois}</Text>
                    <Text style={[styles.tableValue, { color: '#059669' }]}>{formatCurrency(rev.total)}</Text>
                    <Text style={[styles.tableAmount, { color: '#ef4444' }]}>{dep ? formatCurrency(dep.total) : '-'}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  errorText: { marginTop: 10, color: '#ef4444', fontSize: 16, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16, marginTop: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#059669', marginTop: 2 },
  statSubtext: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  totalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  tableHeader: { borderBottomWidth: 2, borderBottomColor: '#e5e7eb' },
  tableHeaderText: { fontWeight: 'bold', color: '#111827' },
  tableLabel: { flex: 1, fontSize: 14, color: '#374151' },
  tableValue: { fontSize: 14, color: '#059669', fontWeight: '500', textAlign: 'center', minWidth: 100 },
  tableAmount: { fontSize: 14, color: '#ef4444', fontWeight: '500', textAlign: 'right', minWidth: 100 },
  footer: { height: 40 }
});
