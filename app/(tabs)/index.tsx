import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ShoppingCart, 
  Receipt, 
  Package, 
  PieChart, 
  DollarSign, 
  TrendingDown, 
  Users, 
  Truck, 
  Menu, 
  User as UserIcon,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  AlertTriangle,
  Settings as SettingsIcon,
  FileText,
  Calendar,
  LogOut,
  MessageSquare,
  HelpCircle
} from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api/api';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currency = '€';
  const shopName = 'Comptabilité Chrétiens';

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await api.logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statsResponse = await api.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      const user = await api.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const isAdmin = currentUser?.role === 'ADMIN';

  const menuItems: MenuItem[] = [
    { id: 'sales', title: 'VENTES', icon: <ShoppingCart size={40} color="#3b82f6" />, route: '/sales' },
    { id: 'expenses', title: 'DECAISSEMENT', icon: <Receipt size={40} color="#ef4444" />, route: '/expenses' },
    { id: 'inventory', title: 'STOCK', icon: <Package size={40} color="#f59e0b" />, route: '/inventory' },
    { id: 'reports', title: 'BILAN', icon: <PieChart size={40} color="#10b981" />, route: '/reports' },
    { id: 'cash', title: 'CAISSE', icon: <DollarSign size={40} color="#059669" />, route: '/cash' },
    { id: 'invoices', title: 'FACTURES', icon: <FileText size={40} color="#3b82f6" />, route: '/invoices' },
    { id: 'appointments', title: 'RENDEZ-VOUS', icon: <Calendar size={40} color="#8b5cf6" />, route: '/appointments' },
    { id: 'chat', title: 'MESSAGES', icon: <MessageSquare size={40} color="#3b82f6" />, route: '/chat-list' },
    { id: 'benefit_expenses', title: 'DEPENSE SUR BENEFICE', icon: <TrendingDown size={40} color="#db2777" />, route: '/expenses' },
    { id: 'client_credits', title: 'Crédit Client', icon: <Users size={40} color="#6366f1" />, route: '/credits' },
    { id: 'supplier_credits', title: 'Crédit Fournisseur', icon: <Truck size={40} color="#4b5563" />, route: '/credits' },
    ...(isAdmin ? [{ id: 'employees', title: 'EMPLOYES', icon: <UserIcon size={40} color="#059669" />, route: '/employees' }] : []),
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#059669" barStyle="light-content" />
      
      {/* Green Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <Menu size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <BookOpen size={24} color="white" />
          <Text style={styles.headerTitle} numberOfLines={1}>{shopName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerBtn}
            onPress={() => router.push('/tutorial')}
          >
            <HelpCircle size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerBtn}
            onPress={() => router.push('/settings')}
          >
            <SettingsIcon size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
            <LogOut size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Section */}
        {isAdmin && (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerOverlay}>
              <View style={styles.quickStats}>
                <View style={styles.quickStatItem}>
                  <ArrowUpRight size={16} color="#34d399" />
                  <Text style={styles.quickStatLabel}>Profit Net</Text>
                  <Text style={styles.quickStatValue}>
                    {stats ? (stats.netProfit || 0).toFixed(2) : '0.00'} {currency}
                  </Text>
                </View>
                <View style={styles.quickStatDivider} />
                <View style={styles.quickStatItem}>
                  <ArrowDownRight size={16} color="#fb7185" />
                  <Text style={styles.quickStatLabel}>Dépenses</Text>
                  <Text style={styles.quickStatValue}>
                    {stats ? (stats.expenses || 0).toFixed(2) : '0.00'} {currency}
                  </Text>
                </View>
              </View>
            </View>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.bannerImage}
              blurRadius={2}
            />
          </View>
        )}

        {/* Menu Grid */}
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.iconWrapper}>
                {item.icon}
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{shopName} v1.4.0</Text>
          {!isAdmin && <Text style={styles.footerText}>Mode Employé</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  loadingText: { marginTop: 10, color: '#6b7280' },
  header: { 
    height: 60, 
    backgroundColor: '#059669', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 }
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: 'white', 
    marginLeft: 8 
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { padding: 8, position: 'relative' },
  scrollContent: { paddingBottom: 20 },
  bannerContainer: { height: 160, position: 'relative', overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    zIndex: 1, 
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  quickStats: { 
    backgroundColor: 'white', 
    borderRadius: 15, 
    flexDirection: 'row', 
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 }
  },
  quickStatItem: { flex: 1, alignItems: 'center' },
  quickStatDivider: { width: 1, height: '100%', backgroundColor: '#f3f4f6' },
  quickStatLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  quickStatValue: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 10, 
    marginTop: 10,
    justifyContent: 'space-between'
  },
  gridItem: { 
    width: '48%', 
    backgroundColor: 'white', 
    borderRadius: 20, 
    paddingVertical: 25, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  iconWrapper: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#f9fafb', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 12
  },
  itemTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#4b5563', 
    textAlign: 'center',
    paddingHorizontal: 10
  },
  footer: { alignItems: 'center', marginTop: 10, padding: 20 },
  footerText: { color: '#9ca3af', fontSize: 12, marginTop: 4 }
});
