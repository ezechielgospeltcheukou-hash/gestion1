import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Save, Trash2, DollarSign, Edit } from 'lucide-react-native';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';
import type { Credit } from '../../src/api/api';

// Helper pour afficher alertes sur web et mobile
const showAlert = (title: string, message: string = '') => {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message ? (title + '\n\n' + message) : title);
  } else {
    showAlert(title, message || undefined);
  }
};
export default function CreditsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [formData, setFormData] = useState({
    personId: 0,
    personType: 'CLIENT' as 'CLIENT' | 'SUPPLIER',
    personName: '',
    amount: '',
    description: ''
  });

  const loadCredits = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getCredits();
      if (response.success && response.data) {
        setCredits(response.data);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
      showAlert('Erreur', 'Impossible de charger les crédits');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCredits();
    }, [loadCredits])
  );

  const handleSubmit = async () => {
    const amount = parseFloat(formData.amount);
    if (!formData.personName.trim() || !formData.amount || isNaN(amount)) {
      showAlert('Erreur', 'Veuillez renseigner le nom et le montant');
      return;
    }

    try {
      const data = {
        personId: formData.personId || Date.now(),
        personType: formData.personType,
        amount: amount,
        description: formData.description || undefined
      };

      let response;
      if (editingCredit) {
        response = await api.updateCredit(editingCredit.id!, data);
      } else {
        response = await api.createCredit(data);
      }

      if (response.success) {
        showAlert('Succès', editingCredit ? 'Crédit mis à jour' : 'Crédit créé');
        setModalVisible(false);
        resetForm();
        loadCredits();
      } else {
        showAlert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving credit:', error);
      showAlert('Erreur', 'Impossible de sauvegarder le crédit');
    }
  };

  const handleToggleRepaid = async (credit: Credit) => {
    try {
      const response = await api.updateCredit(credit.id!, {
        isRepaid: !credit.isRepaid,
        repaidAt: !credit.isRepaid ? new Date().toISOString() : undefined
      });
      if (response.success) {
        showAlert('Succès', credit.isRepaid ? 'Crédit marqué comme non remboursé' : 'Crédit marqué comme remboursé');
        loadCredits();
      }
    } catch (error) {
      console.error('Error toggling credit:', error);
      showAlert('Erreur', 'Impossible de modifier le statut du crédit');
    }
  };

  const handleDelete = (credit: Credit) => {
    showAlert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce crédit ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteCredit(credit.id!);
              if (response.success) {
                showAlert('Succès', 'Crédit supprimé');
                loadCredits();
              } else {
                showAlert('Erreur', response.message || 'Impossible de supprimer le crédit');
              }
            } catch (error) {
              console.error('Error deleting credit:', error);
              showAlert('Erreur', 'Impossible de supprimer le crédit');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      personId: 0,
      personType: 'CLIENT',
      personName: '',
      amount: '',
      description: ''
    });
    setEditingCredit(null);
  };

  const openEditModal = (credit: Credit) => {
    setEditingCredit(credit);
    setFormData({
      personId: credit.personId,
      personType: credit.personType,
      personName: credit.personName || '',
      amount: Number(credit.amount).toString(),
      description: credit.description || ''
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Crédits</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
          {credits.length === 0 ? (
            <View style={styles.emptyContainer}>
              <DollarSign size={64} color="#059669" />
              <Text style={styles.emptyText}>Aucun crédit</Text>
              <Text style={styles.emptySubtext}>Ajoutez votre premier crédit</Text>
            </View>
          ) : (
            credits.map(credit => (
              <View key={credit.id} style={styles.creditCard}>
                <View style={styles.creditInfo}>
                  <View style={styles.creditHeader}>
                    <DollarSign size={20} color="#059669" />
                    <Text style={styles.creditPerson}>{credit.personName || 'Inconnu'}</Text>
                    <Text style={[styles.creditType, credit.personType === 'CLIENT' ? styles.clientType : styles.supplierType]}>
                      {credit.personType === 'CLIENT' ? 'Client' : 'Fournisseur'}
                    </Text>
                  </View>
                  <Text style={styles.creditAmount}>{Number(credit.amount).toFixed(2)} FCFA</Text>
                  {credit.description && (
                    <Text style={styles.creditDescription}>{credit.description}</Text>
                  )}
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: credit.isRepaid ? '#059669' : '#f59e0b' }]} />
                    <Text style={styles.statusText}>{credit.isRepaid ? 'Remboursé' : 'Non remboursé'}</Text>
                  </View>
                  {credit.createdAt && (
                    <Text style={styles.creditDate}>Créé le {formatDate(credit.createdAt)}</Text>
                  )}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.statusButton} onPress={() => handleToggleRepaid(credit)}>
                    <Text style={styles.statusButtonText}>{credit.isRepaid ? 'Annuler' : 'Marquer'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(credit)}>
                    <Edit size={20} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(credit)}>
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
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
            <Text style={styles.modalTitle}>{editingCredit ? 'Modifier crédit' : 'Nouveau crédit'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.personType === 'CLIENT' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, personType: 'CLIENT' })}
                >
                  <Text style={[styles.typeButtonText, formData.personType === 'CLIENT' && styles.typeButtonTextActive]}>Client</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.personType === 'SUPPLIER' && styles.typeButtonActive]}
                  onPress={() => setFormData({ ...formData, personType: 'SUPPLIER' })}
                >
                  <Text style={[styles.typeButtonText, formData.personType === 'SUPPLIER' && styles.typeButtonTextActive]}>Fournisseur</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={formData.personName}
                onChangeText={text => setFormData({ ...formData, personName: text })}
                placeholder="Nom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant *</Text>
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
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={text => setFormData({ ...formData, description: text })}
                placeholder="Description"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingCredit ? 'Mettre à jour' : 'Créer'}
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
    justifyContent: 'space-between'
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  content: { flex: 1, padding: 16, paddingTop: 0 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  creditCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  creditInfo: { flex: 1 },
  creditHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  creditPerson: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  creditType: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  clientType: { backgroundColor: '#d1fae5', color: '#059669' },
  supplierType: { backgroundColor: '#fef3c7', color: '#d97706' },
  creditAmount: { fontSize: 20, fontWeight: 'bold', color: '#059669', marginTop: 8 },
  creditDescription: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, color: '#6b7280' },
  creditDate: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionButton: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8 },
  statusButton: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  statusButtonText: { color: 'white', fontSize: 12, fontWeight: '500' },
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center'
  },
  typeButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#059669'
  },
  typeButtonText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  typeButtonTextActive: { color: 'white' },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

