import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Save, Trash2, FileText, Edit } from 'lucide-react-native';
import { api } from '../src/api/api';
import { useThemeColors } from '../src/theme/ThemeContext';
import type { Invoice } from '../src/api/api';

function InvoiceItem({ invoice, index, onEdit, onDelete }: {
  invoice: Invoice;
  index: number;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
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
      year: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PAID': return '#059669';
      case 'SENT': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Animated.View style={[styles.invoiceCard, { opacity: itemFadeAnim }]}>
      <View style={styles.invoiceInfo}>
        <View style={styles.invoiceHeader}>
          <FileText size={20} color="#059669" />
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        </View>
        {invoice.clientName && (
          <Text style={styles.clientName}>{invoice.clientName}</Text>
        )}
        <Text style={styles.invoiceAmount}>{Number(invoice.totalAmount).toFixed(2)} FCFA</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(invoice.status) }]} />
          <Text style={styles.statusText}>{invoice.status}</Text>
        </View>
        {invoice.createdAt && (
          <Text style={styles.invoiceDate}>Créé le {formatDate(invoice.createdAt)}</Text>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(invoice)}>
          <Edit size={20} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(invoice)}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function InvoicesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientId: null as number | null,
    clientName: '',
    totalAmount: '',
    status: 'DRAFT' as 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED',
    items: '',
    notes: '',
    dueDate: ''
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getInvoices();
      if (response.success && response.data) {
        setInvoices(response.data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      Alert.alert('Erreur', 'Impossible de charger les factures');
    } finally {
      setLoading(false);
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
      loadInvoices();
    }, [loadInvoices])
  );

  const handleSubmit = async () => {
    const totalAmount = parseFloat(formData.totalAmount);
    if (!formData.invoiceNumber.trim() || !formData.totalAmount || isNaN(totalAmount)) {
      Alert.alert('Erreur', 'Veuillez renseigner le numéro et le montant de la facture');
      return;
    }

    try {
      const data = {
        ...formData,
        totalAmount
      };

      let response;
      if (editingInvoice) {
        response = await api.updateInvoice(editingInvoice.id!, data);
      } else {
        response = await api.createInvoice(data);
      }

      if (response.success) {
        Alert.alert('Succès', editingInvoice ? 'Facture mise à jour' : 'Facture créée');
        setModalVisible(false);
        resetForm();
        loadInvoices();
      } else {
        Alert.alert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la facture');
    }
  };

  const handleDelete = (invoice: Invoice) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer cette facture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteInvoice(invoice.id!);
              if (response.success) {
                Alert.alert('Succès', 'Facture supprimée');
                loadInvoices();
              } else {
                Alert.alert('Erreur', response.message || 'Impossible de supprimer la facture');
              }
            } catch (error) {
              console.error('Error deleting invoice:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la facture');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      clientId: null,
      clientName: '',
      totalAmount: '',
      status: 'DRAFT',
      items: '',
      notes: '',
      dueDate: ''
    });
    setEditingInvoice(null);
  };

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId || null,
      clientName: invoice.clientName || '',
      totalAmount: Number(invoice.totalAmount).toString(),
      status: invoice.status || 'DRAFT',
      items: invoice.items || '',
      notes: invoice.notes || '',
      dueDate: invoice.dueDate || ''
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Factures</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <FileText size={40} color="#059669" />
          </View>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={[styles.content, { backgroundColor: colors.background }]}>
          {invoices.length === 0 ? (
            <Animated.View style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}>
              <FileText size={64} color="#059669" />
              <Text style={styles.emptyText}>Aucune facture</Text>
              <Text style={styles.emptySubtext}>Ajoutez votre première facture</Text>
            </Animated.View>
          ) : (
            invoices.map((invoice, index) => (
              <InvoiceItem
                key={invoice.id}
                invoice={invoice}
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
            <Text style={styles.modalTitle}>{editingInvoice ? 'Modifier facture' : 'Nouvelle facture'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de facture *</Text>
              <TextInput
                style={styles.input}
                value={formData.invoiceNumber}
                onChangeText={text => setFormData({ ...formData, invoiceNumber: text })}
                placeholder="FAC-2024-001"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du client</Text>
              <TextInput
                style={styles.input}
                value={formData.clientName}
                onChangeText={text => setFormData({ ...formData, clientName: text })}
                placeholder="Nom du client"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Montant total *</Text>
              <TextInput
                style={styles.input}
                value={formData.totalAmount}
                onChangeText={text => setFormData({ ...formData, totalAmount: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Statut</Text>
              <ScrollView horizontal style={styles.statusPicker}>
                {['DRAFT', 'SENT', 'PAID', 'CANCELLED'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      formData.status === status && styles.statusOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, status: status as any })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      formData.status === status && styles.statusOptionTextSelected
                    ]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date d'échéance</Text>
              <TextInput
                style={styles.input}
                value={formData.dueDate}
                onChangeText={text => setFormData({ ...formData, dueDate: text })}
                placeholder="AAAA-MM-JJ"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Éléments (JSON)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.items}
                onChangeText={text => setFormData({ ...formData, items: text })}
                placeholder="[]"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                placeholder="Notes supplémentaires"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.7}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingInvoice ? 'Mettre à jour' : 'Créer'}
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
  invoiceCard: {
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
  invoiceInfo: { flex: 1 },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  invoiceNumber: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  clientName: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  invoiceAmount: { fontSize: 20, fontWeight: 'bold', color: '#059669', marginTop: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, color: '#6b7280' },
  invoiceDate: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 12 },
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
  statusPicker: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8
  },
  statusOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#059669'
  },
  statusOptionText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  statusOptionTextSelected: { color: 'white' },
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
