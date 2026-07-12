import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Bell, Lock, HelpCircle, LogOut, Edit, Save } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../../src/api/api';
import { storage } from '../../src/utils/storage';
import { useTheme, useThemeColors } from '../../src/theme/ThemeContext';

// Helper: affiche alertes sur web et mobile
const showAlert = (title: string, message?: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).alert === 'function') {
    (window as any).alert(message ? (title + '\n\n' + message) : title);
  } else {
    Alert.alert(title, message);
  }
};

function SettingItem({ icon: Icon, title, subtitle, onPress, rightComponent }: { 
  icon: any; 
  title: string; 
  subtitle?: string; 
  onPress?: () => void; 
  rightComponent?: any; 
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Icon size={20} color={colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(theme === 'dark');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);

  // Load preferences and user
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          setLoading(true);
          const currentUser = await api.getUser();
          setUser(currentUser);
          if (currentUser) {
            setEditForm({
              username: currentUser.username || '',
              email: currentUser.email || '',
              phone: currentUser.phone || '',
              address: '',
            });
          }
          
          // Load saved preferences
          const savedNotifications = await storage.getItem('notifications_enabled');
          const savedDarkMode = await storage.getItem('dark_mode_enabled');
          
          if (savedNotifications !== null) {
            setNotificationsEnabled(savedNotifications === 'true');
          }
          if (savedDarkMode !== null) {
            setDarkModeEnabled(savedDarkMode === 'true');
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  // Save preferences
  const savePreferences = useCallback(async (key: string, value: boolean) => {
    try {
      await storage.setItem(key, value.toString());
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  }, []);

  const handleNotificationsChange = (value: boolean) => {
    setNotificationsEnabled(value);
    savePreferences('notifications_enabled', value);
  };

  const handleDarkModeChange = (value: boolean) => {
    setDarkModeEnabled(value);
    savePreferences('dark_mode_enabled', value);
    if ((theme === 'dark') !== value) {
      toggleTheme();
    }
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) {
      showAlert('Erreur', 'Le nom d\'utilisateur est obligatoire');
      return;
    }

    try {
      setSaving(true);
      // Update user via API if available
      const response = await api.updateUser(editForm);
      
      if (response.success) {
        setUser({ ...user, ...response.data });
        showAlert('Succès', 'Profil mis à jour');
        setEditModalVisible(false);
      } else {
        showAlert('Erreur', response.message || 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        api.logout().then(() => {
          try {
            router.replace('/(auth)');
          } catch {
            router.push('/(auth)');
          }
        });
      }
      return;
    }

    showAlert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await api.logout();
            try {
              router.replace('/(auth)');
            } catch {
              router.push('/(auth)');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.headerText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>Paramètres</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.headerText }]}>Paramètres</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {user && (
          <View style={[styles.profileSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <User size={32} color={colors.headerText} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>{user.username}</Text>
              <Text style={[styles.profileRole, { color: colors.primary }]}>
                {user.role === 'ADMIN' ? 'Administrateur' : 'Employé'}
              </Text>
              {user.email && <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email}</Text>}
            </View>
            <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primaryLight }]} onPress={handleEditProfile}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, backgroundColor: colors.borderLight }]}>Préférences</Text>
          <SettingItem
            icon={Bell}
            title="Notifications"
            subtitle="Activer les notifications"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsChange}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
          <SettingItem
            icon={Lock}
            title="Mode sombre"
            subtitle="Activer le mode sombre"
            rightComponent={
              <Switch
                value={darkModeEnabled}
                onValueChange={handleDarkModeChange}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={darkModeEnabled ? colors.primary : colors.textTertiary}
              />
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, backgroundColor: colors.borderLight }]}>Support</Text>
          <SettingItem
            icon={HelpCircle}
            title="Aide et assistance"
            subtitle="Consulter la FAQ et contacter le support"
            onPress={() => router.push('/help')}
          />
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card }]} onPress={handleLogout}>
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Modifier le profil</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Save size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nom d'utilisateur *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={editForm.username}
                onChangeText={(text) => setEditForm({ ...editForm, username: text })}
                placeholder="Entrez votre nom d'utilisateur"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Entrez votre email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Téléphone</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Entrez votre numéro de téléphone"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Adresse</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
                value={editForm.address}
                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                placeholder="Entrez votre adresse"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.saveButtonDisabled]} 
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Save size={20} color="white" />
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </>
              )}
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
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileSection: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileRole: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  editButton: {
    padding: 12,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: { flex: 1 },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  modalContainer: { flex: 1, backgroundColor: 'white' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    backgroundColor: '#f9fafb',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

