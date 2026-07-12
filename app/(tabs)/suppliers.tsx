import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { Truck, Plus, Edit, Trash2, Save, ArrowLeft, Search, Phone, Mail, MapPin, DollarSign } from 'lucide-react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api/api';
import type { Supplier } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

export default function SuppliersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: ''
  });

  const filteredSuppliers = searchQuery.trim() === '' 
    ? suppliers 
    : suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone?.includes(searchQuery)
      );

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showAlert('Erreur', 'Impossible de charger les fournisseurs');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await api.getSuppliers();
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, [loadSuppliers])
  );

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showAlert('Erreur', 'Le nom du fournisseur est requis');
      return;
    }

    try {
      const data = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        whatsapp: formData.whatsapp || undefined,
        address: formData.address || undefined
      };

      let response;
      if (editingSupplier) {
        response = await api.updateSupplier(editingSupplier.id!, data);
      } else {
        response = await api.createSupplier(data);
      }

      if (response.success) {
        showAlert('Succès', editingSupplier ? 'Fournisseur mis à jour' : 'Fournisseur ajouté');
        setModalVisible(false);
        resetForm();
        loadSuppliers();
      } else {
        showAlert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      showAlert('Erreur', 'Impossible de sauvegarder le fournisseur');
    }
  };

  const handleDelete = (supplier: Supplier) => {
    showAlert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer ${supplier.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteSupplier(supplier.id!);
              if (response.success) {
                showAlert('Succès', 'Fournisseur supprimé');
                loadSuppliers();
              } else {
                showAlert('Erreur', response.message || 'Une erreur est survenue');
              }
            } catch (error) {
              console.error('Error deleting supplier:', error);
              showAlert('Erreur', 'Impossible de supprimer le fournisseur');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      address: ''
    });
    setEditingSupplier(null);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      address: supplier.address || ''
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fournisseurs</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Search size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Rechercher un fournisseur..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
          {filteredSuppliers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Truck size={64} color="#059669" />
              <Text style={[styles.emptyText, { color: colors.text }]}>{searchQuery ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur'}</Text>
              {!searchQuery && <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Ajoutez un fournisseur avec le bouton +</Text>}
            </View>
          ) : (
            filteredSuppliers.map((supplier) => (
              <View key={supplier.id} style={[styles.supplierCard, { backgroundColor: colors.card }]}>
                <View style={styles.supplierInfo}>
                  <View style={styles.supplierHeader}>
                    <Truck size={20} color="#059669" />
                    <Text style={[styles.supplierName, { color: colors.text }]}>{supplier.name}</Text>
                  </View>
                  {supplier.phone && (
                    <View style={styles.supplierDetailRow}>
                      <Phone size={14} color={colors.textSecondary} />
                      <Text style={[styles.supplierDetail, { color: colors.textSecondary }]}>{supplier.phone}</Text>
                    </View>
                  )}
                  {supplier.whatsapp && (
                    <View style={styles.supplierDetailRow}>
                      <Phone size={14} color="#25D366" />
                      <Text style={[styles.supplierDetail, { color: colors.textSecondary }]}>{supplier.whatsapp}</Text>
                    </View>
                  )}
                  {supplier.email && (
                    <View style={styles.supplierDetailRow}>
                      <Mail size={14} color={colors.textSecondary} />
                      <Text style={[styles.supplierDetail, { color: colors.textSecondary }]}>{supplier.email}</Text>
                    </View>
                  )}
                  {supplier.address && (
                    <View style={styles.supplierDetailRow}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <Text style={[styles.supplierDetail, { color: colors.textSecondary }]}>{supplier.address}</Text>
                    </View>
                  )}
                  {supplier.balance !== undefined && supplier.balance !== null && (
                    <View style={[styles.supplierDetailRow, styles.balanceRow, { borderTopColor: colors.border }]}>
                      <DollarSign size={14} color="#059669" />
                      <Text style={[styles.supplierDetail, styles.balanceText]}>
                        Solde: {Number(supplier.balance)} FCFA
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.inputBg }]} onPress={() => openEditModal(supplier)}>
                    <Edit size={20} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.inputBg }]} onPress={() => handleDelete(supplier)}>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <ArrowLeft size={24} color="#059669" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nom *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Entrez le nom du fournisseur"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Entrez l'email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Entrez le numéro de téléphone"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>WhatsApp</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={formData.whatsapp}
                onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                placeholder="Entrez le numéro WhatsApp"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Adresse</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Entrez l'adresse"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingSupplier ? 'Mettre à jour' : 'Ajouter'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  content: { flex: 1, padding: 16, paddingTop: 0 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  supplierCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  supplierInfo: { flex: 1 },
  supplierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  supplierName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  supplierDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  balanceRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  supplierDetail: { fontSize: 14, color: '#6b7280', marginLeft: 8 },
  balanceText: { fontWeight: '600', color: '#059669' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
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
    gap: 8
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

