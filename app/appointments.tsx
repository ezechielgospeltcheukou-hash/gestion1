import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Save, Trash2, Calendar, Edit } from 'lucide-react-native';
import { api } from '../src/api/api';
import type { Appointment } from '../src/api/api';

function AppointmentItem({ 
  appointment, 
  index, 
  onEdit, 
  onDelete,
  formatDate,
  getStatusColor
}: { 
  appointment: Appointment, 
  index: number, 
  onEdit: (appointment: Appointment) => void, 
  onDelete: (appointment: Appointment) => void,
  formatDate: (dateStr: string) => string,
  getStatusColor: (status?: string) => string
}) {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [itemFadeAnim, index]);

  return (
    <Animated.View 
      key={appointment.id}
      style={[
        styles.appointmentCard,
        {
          opacity: itemFadeAnim,
          transform: [
            {
              translateY: itemFadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }
          ]
        }
      ]}
    >
      <View style={styles.appointmentInfo}>
        <View style={styles.appointmentHeader}>
          <Calendar size={20} color="#059669" />
          <Text style={styles.appointmentTitle}>{appointment.title}</Text>
        </View>
        <Text style={styles.appointmentDate}>{formatDate(appointment.date)}{appointment.time ? ` à ${appointment.time}` : ''}</Text>
        {appointment.clientName && (
          <Text style={styles.clientName}>Client: {appointment.clientName}</Text>
        )}
        {appointment.description && (
          <Text style={styles.appointmentDescription}>{appointment.description}</Text>
        )}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status) }]} />
          <Text style={styles.statusText}>{appointment.status}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(appointment)} activeOpacity={0.7}>
          <Edit size={20} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(appointment)} activeOpacity={0.7}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    clientId: null as number | null,
    clientName: '',
    status: 'PENDING' as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getAppointments();
      if (response.success && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, scaleAnim]);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.date) {
      Alert.alert('Erreur', 'Veuillez renseigner le titre et la date du rendez-vous');
      return;
    }

    try {
      let response: any;
      if (editingAppointment) {
        response = await api.updateAppointment(editingAppointment.id!, formData);
      } else {
        response = await api.createAppointment(formData);
      }

      if (response.success) {
        Alert.alert('Succès', editingAppointment ? 'Rendez-vous mis à jour' : 'Rendez-vous créé');
        setModalVisible(false);
        resetForm();
        loadAppointments();
      } else {
        Alert.alert('Erreur', response.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le rendez-vous');
    }
  };

  const handleDelete = (appointment: Appointment) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce rendez-vous ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteAppointment(appointment.id!);
              if (response.success) {
                Alert.alert('Succès', 'Rendez-vous supprimé');
                loadAppointments();
              } else {
                Alert.alert('Erreur', response.message || 'Impossible de supprimer le rendez-vous');
              }
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le rendez-vous');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      clientId: null,
      clientName: '',
      status: 'PENDING'
    });
    setEditingAppointment(null);
  };

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      title: appointment.title,
      description: appointment.description || '',
      date: appointment.date,
      time: appointment.time || '',
      clientId: appointment.clientId || null,
      clientName: appointment.clientName || '',
      status: appointment.status || 'PENDING'
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
      year: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return '#059669';
      case 'CONFIRMED': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rendez-vous</Text>
        <TouchableOpacity style={styles.headerButton} onPress={openAddModal} activeOpacity={0.7}>
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
        <ScrollView style={styles.content}>
          {appointments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Calendar size={64} color="#059669" />
              </View>
              <Text style={styles.emptyText}>Aucun rendez-vous</Text>
              <Text style={styles.emptySubtext}>Ajoutez votre premier rendez-vous</Text>
            </View>
          ) : (
            appointments.map((appointment, index) => (
              <AppointmentItem
                key={appointment.id}
                appointment={appointment}
                index={index}
                onEdit={openEditModal}
                onDelete={handleDelete}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </ScrollView>
        </Animated.View>
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
            <Text style={styles.modalTitle}>{editingAppointment ? 'Modifier rendez-vous' : 'Nouveau rendez-vous'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={text => setFormData({ ...formData, title: text })}
                placeholder="Titre du rendez-vous"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={text => setFormData({ ...formData, date: text })}
                placeholder="AAAA-MM-JJ"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Heure</Text>
              <TextInput
                style={styles.input}
                value={formData.time}
                onChangeText={text => setFormData({ ...formData, time: text })}
                placeholder="14:30"
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
              <Text style={styles.label}>Statut</Text>
              <ScrollView horizontal style={styles.statusPicker}>
                {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      formData.status === status && styles.statusOptionSelected
                    ]}
                    onPress={() => setFormData({ ...formData, status: status as any })}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      formData.status === status && styles.statusOptionTextSelected
                    ]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Save size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {editingAppointment ? 'Mettre à jour' : 'Créer'}
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
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 16, color: '#6b7280', fontSize: 16 },
  contentContainer: {
    flex: 1,
  },
  content: { flex: 1, padding: 16, paddingTop: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  appointmentCard: {
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
  appointmentInfo: { flex: 1 },
  appointmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  appointmentTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  appointmentDate: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  clientName: { fontSize: 14, color: '#059669', marginTop: 4 },
  appointmentDescription: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, color: '#6b7280' },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8 },
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
  statusPicker: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusOption: {
    padding: 12,
    borderRadius: 8,
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
    gap: 8
  },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
