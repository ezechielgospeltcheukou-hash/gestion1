import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Save, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { api } from '../../src/api/api';
import type { CashTransaction } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

function CashTransactionItem({ transaction, index, onDelete }: {
  transaction: CashTransaction;
  index: number;
  onDelete: (transaction: CashTransaction) => void;
}) {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [itemFadeAnim, index]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Animated.View style={[
      styles.transactionCard,
      { opacity: itemFadeAnim }
    ]}>
      <View style={styles.transactionLeft}>
        {transaction.type === 'IN' ? (
          <TrendingUp size={24} color="#059669" />
        ) : (
          <TrendingDown size={24} color="#ef4444" />
        )}
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{transaction.description || 'Sans description'}</Text>
        {transaction.category && (
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
        )}
        <Text style={styles.transactionDate}>{formatDate(transaction.createdAt || new Date().toISOString())}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: transaction.type === 'IN' ? '#059669' : '#ef4444' }
        ]}>
          {transaction.type === 'IN' ? '+' : '-'}{Number(transaction.amount).toFixed(2)} FCFA
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(transaction)}>
          <Trash2 size={16} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function CashScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'IN' as 'IN' | 'OUT',
    description: '',
    category: '',
    reference: ''
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getCash();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading cash data:', error);
      showAlert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await api.getCash();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, scaleAnim]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSubmit = async () => {
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      showAlert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    try {
      const response = await api.createCash({
        ...formData,
        amount
      });
      if (response.success) {
        showAlert('Succès', 'Transaction enregistrée');
        setModalVisible(false);
        loadData();
      } else {
        showAlert('Erreur', response.message || 'Impossible d\'enregistrer la transaction');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      showAlert('Erreur', 'Impossible d\'enregistrer la transaction');
    }
  };

  const handleDelete = (transaction: CashTransaction) => {
    showAlert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteCash(transaction.id!);
              if (response.success) {
                showAlert('Succès', 'Transaction supprimée');
                loadData();
              } else {
                showAlert('Erreur', response.message || 'Impossible de supprimer la transaction');
              }
            } catch (error) {
              console.error('Error deleting transaction:', error);
              showAlert('Erreur', 'Impossible de supprimer la transaction');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Caisse</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Wallet size={40} color="#059669" />
          </View>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <>
          <Animated.View style={[
            styles.balanceCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}>
            <Wallet size={32} color="#059669" />
            <Text style={styles.balanceLabel}>Solde actuel</Text>
            <Text style={[styles.balanceAmount, { color: Number(data?.balance || 0) >= 0 ? '#059669' : '#ef4444' }]}>
              {Number(data?.balance || 0).toFixed(2)} FCFA
            </Text>
            <View style={styles.balanceDetails}>
              <View style={styles.balanceDetail}>
                <TrendingUp size={16} color="#059669" />
                <Text style={styles.balanceDetailText}>Entrées: {Number(data?.totalIn || 0).toFixed(2)} FCFA</Text>
              </View>
              <View style={styles.balanceDetail}>
                <TrendingDown size={16} color="#ef4444" />
                <Text style={styles.balanceDetailText}>Sorties: {Number(data?.totalOut || 0).toFixed(2)} FCFA</Text>
              </View>
            </View>
          </Animated.View>

          <ScrollView style={[styles.content, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />}>
            {data?.transactions?.length === 0 ? (
              <Animated.View style={[
                styles.emptyContainer,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
              ]}>
                <Wallet size={64} color="#059669" />
                <Text style={styles.emptyText}>Aucune transaction</Text>
                <Text style={styles.emptySubtext}>Enregistrez votre première transaction</Text>
              </Animated.View>
            ) : (
              data?.transactions?.map((transaction: CashTransaction, index: number) => (
                <CashTransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                  onDelete={handleDelete}
                />
              ))
            )}
          </ScrollView>
        </>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <ArrowLeft size={24} color="#059669" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle transaction</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'IN' && styles.typeButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'IN' })}
                activeOpacity={0.7}
              >
                <TrendingUp size={20} color={formData.type === 'IN' ? 'white' : '#059669'} />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'IN' && styles.typeButtonTextActive
                ]}>Entrée</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'OUT' && styles.typeButtonActive]}
                onPress={() => setFormData({ ...formData, type: 'OUT' })}
                activeOpacity={0.7}
              >
                <TrendingDown size={20} color={formData.type === 'OUT' ? 'white' : '#ef4444'} />
                <Text style={[
                  styles.typeButtonText,
                  formData.type === 'OUT' && styles.typeButtonTextActive
                ]}>Sortie</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={text => setFormData({ ...formData, amount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={text => setFormData({ ...formData, description: text })}
                placeholder="Description de la transaction"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catégorie</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={text => setFormData({ ...formData, category: text })}
                placeholder="Catégorie (optionnel)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Référence</Text>
              <TextInput
                style={styles.input}
                value={formData.reference}
                onChangeText={text => setFormData({ ...formData, reference: text })}
                placeholder="Référence (optionnel)"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.7}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingIcon: { 
    width: 100, 
    height: 100, 
    backgroundColor: '#d1fae5', 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  balanceCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  balanceLabel: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  balanceDetails: { flexDirection: 'row', marginTop: 20, gap: 24 },
  balanceDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceDetailText: { fontSize: 14, color: '#6b7280' },
  content: { flex: 1, padding: 16, paddingTop: 0 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  transactionLeft: { padding: 8, borderRadius: 12, backgroundColor: '#f3f4f6' },
  transactionInfo: { flex: 1, marginLeft: 16 },
  transactionDescription: { fontSize: 16, fontWeight: '500', color: '#111827' },
  transactionCategory: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  transactionDate: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 12
  },
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalContent: { flex: 1, padding: 20 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb'
  },
  typeButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#059669'
  },
  typeButtonText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  typeButtonTextActive: { color: 'white' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb'
  },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

