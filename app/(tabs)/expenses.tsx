import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Animated, RefreshControl } from 'react-native';
import { Receipt, Plus, Edit, Trash2, Save, ArrowLeft, Calendar, DollarSign, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api/api';
import type { Expense } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

function ExpenseItem({ expense, index, onEdit, onDelete }: { expense: Expense, index: number, onEdit: (expense: Expense) => void, onDelete: (expense: Expense) => void }) {
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
      year: 'numeric'
    });
  };

  return (
    <Animated.View style={[styles.expenseCard, { opacity: itemFadeAnim }]}>
      <View style={styles.expenseInfo}>
        <View style={styles.expenseHeader}>
          <Receipt size={20} color="#059669" />
          <Text style={styles.expenseDescription}>{expense.description}</Text>
        </View>
        <View style={styles.expenseDetails}>
          <View style={styles.detailRow}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.expenseDetail}>{formatDate(expense.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Tag size={14} color="#6b7280" />
            <Text style={styles.expenseDetail}>{expense.category}</Text>
          </View>
          {expense.paymentMethod && (
            <View style={styles.detailRow}>
              <DollarSign size={14} color="#6b7280" />
              <Text style={styles.expenseDetail}>{expense.paymentMethod}</Text>
            </View>
          )}
        </View>
        {expense.notes && (
          <Text style={styles.expenseNotes}>{expense.notes}</Text>
        )}
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>{Number(expense.amount).toFixed(2)} FCFA</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(expense)}>
            <Edit size={20} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(expense)}>
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function ExpensesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Général',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Espèces',
    notes: ''
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getExpenses();
      if (response.success && response.data) {
        setExpenses(response.data);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      showAlert('Erreur', 'Impossible de charger les dépenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await api.getExpenses();
      if (response.success && response.data) {
        setExpenses(response.data);
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
      loadExpenses();
    }, [loadExpenses])
  );

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.amount) {
      showAlert('Erreur', 'La description et le montant sont requis');
      return;
    }

    try {
      const data = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined
      };

      let response;
      if (editingExpense) {
        response = await api.updateExpense(editingExpense.id!, data);
      } else {
        response = await api.createExpense(data);
      }

      if (response.success) {
        showAlert('Succès', editingExpense ? 'Dépense mise à jour' : 'Dépense ajoutée');
        setModalVisible(false);
        resetForm();
        loadExpenses();
      } else {
        showAlert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      showAlert('Erreur', 'Impossible de sauvegarder la dépense');
    }
  };

  const handleDelete = (expense: Expense) => {
    showAlert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer cette dépense de ${expense.amount} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteExpense(expense.id!);
              if (response.success) {
                showAlert('Succès', 'Dépense supprimée');
                loadExpenses();
              } else {
                showAlert('Erreur', response.message || 'Une erreur est survenue');
              }
            } catch (error) {
              console.error('Error deleting expense:', error);
              showAlert('Erreur', 'Impossible de supprimer la dépense');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'Général',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Espèces',
      notes: ''
    });
    setEditingExpense(null);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: Number(expense.amount).toString(),
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod || 'Espèces',
      notes: expense.notes || ''
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Dépenses</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total des dépenses</Text>
        <Text style={styles.totalAmount}>{Number(totalExpenses).toFixed(2)} FCFA</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Receipt size={40} color="#059669" />
          </View>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />}>
          {expenses.length === 0 ? (
            <Animated.View style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}>
              <Receipt size={64} color="#059669" />
              <Text style={styles.emptyText}>Aucune dépense</Text>
              <Text style={styles.emptySubtext}>Ajoutez une dépense avec le bouton +</Text>
            </Animated.View>
          ) : (
            expenses.map((expense, index) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                index={index}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          )}
        </ScrollView>
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
            <Text style={styles.modalTitle}>{editingExpense ? 'Modifier Dépense' : 'Nouvelle Dépense'}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Entrez la description"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Catégorie</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="Général"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="AAAA-MM-JJ"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Méthode de paiement</Text>
              <TextInput
                style={styles.input}
                value={formData.paymentMethod}
                onChangeText={(text) => setFormData({ ...formData, paymentMethod: text })}
                placeholder="Espèces"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Entrez des notes supplémentaires"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.7}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingExpense ? 'Mettre à jour' : 'Ajouter'}
              </Text>
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
  totalContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  totalLabel: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  totalAmount: { fontSize: 28, fontWeight: 'bold', color: '#ef4444' },
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
  content: { flex: 1, padding: 16, paddingTop: 0 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  expenseInfo: { flex: 1, marginRight: 16 },
  expenseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  expenseDescription: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  expenseDetails: { marginTop: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  expenseDetail: { fontSize: 14, color: '#6b7280', marginLeft: 8 },
  expenseNotes: { fontSize: 14, color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  expenseRight: { alignItems: 'flex-end' },
  expenseAmount: { fontSize: 20, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
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
  textArea: { height: 100, textAlignVertical: 'top' },
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

