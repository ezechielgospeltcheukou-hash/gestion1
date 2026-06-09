import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, Edit, Trash2, Save, ArrowLeft, CheckCircle, XCircle } from 'lucide-react-native'; 
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../src/api/api';
import type { Employee } from '../src/api/api';

export default function EmployeesScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    salary: ''
  });

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Erreur', 'Impossible de charger les employés');
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
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return;
    }

    if (!editingEmployee && !formData.password) {
      Alert.alert('Erreur', 'Le mot de passe est requis');
      return;
    }

    try {
      const data = {
        username: formData.username,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        password: formData.password || undefined
      };

      let response;
      if (editingEmployee) {
        const { password, ...updateData } = data;
        response = await api.updateEmployee(editingEmployee.id!, updateData);
      } else {
        response = await api.createEmployee(data);
      }

      if (response.success) {
        Alert.alert('Succès', editingEmployee ? 'Employé mis à jour' : 'Employé ajouté');
        setModalVisible(false);
        resetForm();
        loadEmployees();
      } else {
        Alert.alert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'employé');
    }
  };

  const handleDelete = (employee: Employee) => {
    Alert.alert(
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
                Alert.alert('Succès', 'Employé supprimé');
                loadEmployees();
              } else {
                Alert.alert('Erreur', response.message || 'Une erreur est survenue');
              }
            } catch (error) {
              console.error('Error deleting employee:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'employé');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      salary: ''
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
      password: '',
      salary: employee.salary?.toString() || ''
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {employees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={64} color="#059669" />
              <Text style={styles.emptyText}>Aucun employé</Text>
              <Text style={styles.emptySubtext}>Ajoutez un employé avec le bouton +</Text>
            </View>
          ) : (
            employees.map((employee) => (
              <View key={employee.id} style={styles.employeeCard}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.username}</Text>
                  {employee.email && <Text style={styles.employeeDetail}>{employee.email}</Text>}
                  {employee.phone && <Text style={styles.employeeDetail}>{employee.phone}</Text>}
                  {employee.salary && <Text style={styles.employeeDetail}>Salaire: {employee.salary} €</Text>}
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, employee.isActive ? styles.active : styles.inactive]} />
                    <Text style={styles.statusText}>{employee.isActive ? 'Actif' : 'Inactif'}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(employee)}>
                    <Edit size={20} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(employee)}>
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

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
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
