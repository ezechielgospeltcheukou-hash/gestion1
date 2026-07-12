import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, Edit, Trash2, Save, ArrowLeft, Shield, RefreshCw, MapPin, Eye } from 'lucide-react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../src/api/api';
import type { Employee, Permissions } from '../src/api/api';
import { useTheme, useThemeColors } from '../src/theme/ThemeContext';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

const defaultPermissions: Permissions = {
  sales: true,
  inventory: true,
  clients: true,
  suppliers: true,
  expenses: true,
  invoices: true,
  cash: true,
  reports: true,
  appointments: true,
  credits: true,
  messages: true,
  employees: false
};

const permissionLabels: Record<keyof Permissions, string> = {
  sales: 'Ventes',
  inventory: 'Stock',
  clients: 'Clients',
  suppliers: 'Fournisseurs',
  expenses: 'Dépenses',
  invoices: 'Factures',
  cash: 'Caisse',
  reports: 'Rapports',
  appointments: 'Rendez-vous',
  credits: 'Crédits',
  messages: 'Messages',
  employees: 'Employés'
};

export default function EmployeesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resettingCode, setResettingCode] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    locality: '',
    password: '',
    salary: '',
    role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE',
    permissions: { ...defaultPermissions }
  });

  const filteredEmployees = employees.filter(employee => 
    employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.phone?.includes(searchQuery)
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showAlert('Erreur', 'Impossible de charger les employés');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEmployees();
    }, [loadEmployees])
  );

  const handleSubmit = async () => {
    if (!formData.username) {
      showAlert('Erreur', 'Le nom d\'utilisateur est requis');
      return;
    }

    if (!editingEmployee && !formData.password) {
      showAlert('Erreur', 'Le mot de passe est requis');
      return;
    }

    try {
      const data = {
        username: formData.username,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        locality: formData.locality || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        password: formData.password || undefined,
        role: formData.role,
        permissions: formData.role === 'ADMIN' 
          ? { 
              sales: true, inventory: true, clients: true, suppliers: true, 
              expenses: true, invoices: true, cash: true, reports: true, 
              appointments: true, credits: true, messages: true, employees: true 
            } 
          : formData.permissions
      };

      let response;
      if (editingEmployee) {
        const { password, ...updateData } = data;
        response = await api.updateEmployee(editingEmployee.id!, updateData);
      } else {
        response = await api.createEmployee(data);
      }

      if (response.success) {
        showAlert('Succes', editingEmployee ? 'Employe mis a jour' : 'Employe ajoute avec succes !');
        setModalVisible(false);
        resetForm();
        loadEmployees();
      } else {
        showAlert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showAlert('Erreur', 'Impossible de sauvegarder l\'employe: ' + (error as Error).message);
    }
  };

  const handleDelete = (employee: Employee) => {
    showAlert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer ${employee.username} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteEmployee(employee.id!);
              if (response.success) {
                showAlert('Succès', 'Employé supprimé');
                loadEmployees();
              } else {
                showAlert('Erreur', response.message || 'Une erreur est survenue');
              }
            } catch (error) {
              console.error('Error deleting employee:', error);
              showAlert('Erreur', 'Impossible de supprimer l\'employé');
            }
          }
        }
      ]
    );
  };

  const handleResetCode = (employee: Employee) => {
    showAlert(
      'Réinitialiser le code',
      `Voulez-vous générer un nouveau code employé pour ${employee.username} ?\n\nAncien code: ${employee.employeeCode || 'N/A'}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              setResettingCode(employee.id!);
              const response = await api.resetEmployeeCode(employee.id!);
              if (response.success) {
                showAlert('Nouveau code', `Le nouveau code de ${employee.username} est:\n\n${response.data?.employeeCode || 'N/A'}\n\nCommuniquez ce code à l'employé.`);
                loadEmployees();
              } else {
                showAlert('Erreur', response.message || 'Impossible de réinitialiser le code');
              }
            } catch (error) {
              console.error('Error resetting code:', error);
              showAlert('Erreur', 'Impossible de réinitialiser le code');
            } finally {
              setResettingCode(null);
            }
          }
        }
      ]
    );
  };

  const handleCopyCode = (code: string) => {
    showAlert('Code Employé', `Le code de cet employé est:\n\n${code}\n\nNotez-le et communiquez-le à l'employé.`);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      phone: '',
      address: '',
      locality: '',
      password: '',
      salary: '',
      role: 'EMPLOYEE',
      permissions: { ...defaultPermissions }
    });
    setEditingEmployee(null);
  };

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      locality: employee.locality || '',
      password: '',
      salary: employee.salary?.toString() || '',
      role: employee.role || 'EMPLOYEE',
      permissions: typeof employee.permissions === 'string'
        ? (() => { try { return JSON.parse(employee.permissions); } catch { return { ...defaultPermissions }; } })()
        : (employee.permissions || { ...defaultPermissions })
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const togglePermission = (key: keyof Permissions) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key]
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employés</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Users size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un employé..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={64} color="#059669" />
              <Text style={styles.emptyText}>{searchQuery ? 'Aucun employé trouvé' : 'Aucun employé'}</Text>
              {!searchQuery && <Text style={styles.emptySubtext}>Ajoutez un employé avec le bouton +</Text>}
            </View>
          ) : (
            filteredEmployees.map((employee) => (
              <View key={employee.id} style={[styles.employeeCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.employeeInfo}>
                  <Text style={[styles.employeeName, { color: colors.text }]}>{employee.username}</Text>
                  {employee.employeeCode && (
                    <View style={styles.codeRow}>
                      <Text style={[styles.employeeCode, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{employee.employeeCode}</Text>
                      <TouchableOpacity onPress={() => handleCopyCode(employee.employeeCode!)} style={styles.copyBtn}>
                        <Eye size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleResetCode(employee)} disabled={resettingCode === employee.id} style={styles.copyBtn}>
                        {resettingCode === employee.id ? (
                          <ActivityIndicator size={14} color={colors.primary} />
                        ) : (
                          <RefreshCw size={14} color={colors.warning} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.roleContainer}>
                    <Text style={[styles.roleText, employee.role === 'ADMIN' ? { color: '#2563eb', backgroundColor: '#dbeafe' } : { color: '#16a34a', backgroundColor: '#dcfce7' }]}>
                      {employee.role === 'ADMIN' ? 'Administrateur' : 'Employé'}
                    </Text>
                  </View>
                  {employee.email && <Text style={[styles.employeeDetail, { color: colors.textSecondary }]}>{employee.email}</Text>}
                  {employee.phone && <Text style={[styles.employeeDetail, { color: colors.textSecondary }]}>{employee.phone}</Text>}
                  {employee.locality && (
                    <View style={styles.localityRow}>
                      <MapPin size={14} color={colors.textTertiary} />
                      <Text style={[styles.employeeDetail, { color: colors.textSecondary }]}>{employee.locality}</Text>
                    </View>
                  )}
                  {employee.salary && <Text style={[styles.employeeDetail, { color: colors.textSecondary }]}>Salaire: {employee.salary} FCFA</Text>}
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, employee.isActive ? styles.active : styles.inactive]} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>{employee.isActive ? 'Actif' : 'Inactif'}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primaryLight }]} onPress={() => openEditModal(employee)}>
                    <Edit size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.errorLight }]} onPress={() => handleDelete(employee)}>
                    <Trash2 size={20} color={colors.error} />
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <ArrowLeft size={24} color="#059669" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingEmployee ? 'Modifier Employé' : 'Nouvel Employé'}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom d'utilisateur *</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Entrez le nom d'utilisateur"
              />
            </View>

            {!editingEmployee && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  placeholder="Entrez le mot de passe"
                  secureTextEntry
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rôle</Text>
              <View style={styles.roleSelectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'EMPLOYEE' && styles.roleOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'EMPLOYEE' })}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      formData.role === 'EMPLOYEE' && styles.roleOptionTextSelected
                    ]}
                  >
                    Employé
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'ADMIN' && styles.roleOptionSelected
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'ADMIN' })}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      formData.role === 'ADMIN' && styles.roleOptionTextSelected
                    ]}
                  >
                    Administrateur
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.role === 'EMPLOYEE' && (
              <View style={styles.permissionsSection}>
                <View style={styles.permissionsHeader}>
                  <Shield size={20} color="#059669" />
                  <Text style={styles.permissionsTitle}>Permissions</Text>
                </View>
                <View style={styles.permissionsList}>
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <View key={key} style={styles.permissionItem}>
                      <Text style={styles.permissionLabel}>{label}</Text>
                      <Switch
                        value={formData.permissions[key as keyof Permissions]}
                        onValueChange={() => togglePermission(key as keyof Permissions)}
                        trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
                        thumbColor={formData.permissions[key as keyof Permissions] ? '#059669' : '#9ca3af'}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Entrez l'email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Entrez le numéro de téléphone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Entrez l'adresse"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salaire</Text>
              <TextInput
                style={styles.input}
                value={formData.salary}
                onChangeText={(text) => setFormData({ ...formData, salary: text })}
                placeholder="Entrez le salaire"
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={() => {
                handleSubmit();
              }}
            >
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingEmployee ? 'Mettre à jour' : 'Ajouter'}
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
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  employeeCard: {
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
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  employeeCode: { fontSize: 14, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
  copyBtn: { padding: 4 },
  localityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  roleContainer: { marginTop: 4 },
  roleText: { fontSize: 12, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  roleAdmin: { backgroundColor: '#fef3c7', color: '#d97706' },
  roleEmployee: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  employeeDetail: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  active: { backgroundColor: '#10b981' },
  inactive: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 12, color: '#6b7280' },
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
  roleSelectorContainer: {
    flexDirection: 'row',
    gap: 12
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  roleOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5'
  },
  roleOptionText: {
    fontSize: 16,
    color: '#6b7280'
  },
  roleOptionTextSelected: {
    color: '#059669',
    fontWeight: 'bold'
  },
  permissionsSection: {
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  permissionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  permissionsList: {
    gap: 12
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  permissionLabel: {
    fontSize: 16,
    color: '#374151'
  },
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

