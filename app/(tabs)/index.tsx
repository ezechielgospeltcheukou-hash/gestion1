import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Animated, RefreshControl } from 'react-native';
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
  HelpCircle,
  Shield,
  CreditCard
} from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api/api';
import { useThemeColors } from '../../src/theme/ThemeContext';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

// Composant séparé pour chaque élément du menu (respecte les règles des Hooks)
function MenuGridItem({ item, index }: { item: MenuItem; index: number }) {
  const router = useRouter();
  const colors = useThemeColors();
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, [itemFadeAnim, index]);

  return (
    <Animated.View 
      style={{
        opacity: itemFadeAnim,
        transform: [
          {
            translateY: itemFadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            })
          }
        ]
      }}
    >
      <TouchableOpacity 
        style={[styles.gridItem, { backgroundColor: `${item.color}10` }]}
        activeOpacity={0.7}
        onPress={() => router.push(item.route as any)}
      >
        <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
          {item.icon}
        </View>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const colors = useThemeColors();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currency = 'FCFA';
  const shopName = 'Comptabilite Chretiens';

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const statsResponse = await api.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      const user = await api.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
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
      fetchData();
    }, [fetchData])
  );

  const isAdmin = currentUser?.role === 'ADMIN';

  const allMenuItems: Array<MenuItem & { permission: keyof any }> = [
    { id: 'sales', title: 'VENTES', icon: <ShoppingCart size={32} color="white" />, route: '/sales', color: '#3b82f6', permission: 'sales' },
    { id: 'expenses', title: 'DECAISSEMENT', icon: <Receipt size={32} color="white" />, route: '/expenses', color: '#ef4444', permission: 'expenses' },
    { id: 'inventory', title: 'STOCK', icon: <Package size={32} color="white" />, route: '/inventory', color: '#f59e0b', permission: 'inventory' },
    { id: 'reports', title: 'BILAN', icon: <PieChart size={32} color="white" />, route: '/reports', color: '#10b981', permission: 'reports' },
    { id: 'cash', title: 'CAISSE', icon: <DollarSign size={32} color="white" />, route: '/cash', color: '#059669', permission: 'cash' },
    { id: 'invoices', title: 'FACTURES', icon: <FileText size={32} color="white" />, route: '/invoices', color: '#3b82f6', permission: 'invoices' },
    { id: 'appointments', title: 'RENDEZ-VOUS', icon: <Calendar size={32} color="white" />, route: '/appointments', color: '#8b5cf6', permission: 'appointments' },
    { id: 'chat', title: 'MESSAGES', icon: <MessageSquare size={32} color="white" />, route: '/chat-list', color: '#3b82f6', permission: 'messages' },
    { id: 'credits', title: 'CREDITS', icon: <CreditCard size={32} color="white" />, route: '/credits', color: '#db2777', permission: 'credits' },
    ...(isAdmin ? [{ id: 'employees', title: 'EMPLOYES', icon: <Shield size={32} color="white" />, route: '/employees', color: '#059669', permission: 'employees' as const }] : []),
  ];

  const menuItems = allMenuItems.filter(item => {
    if (isAdmin) return true;
    const perms = typeof currentUser?.permissions === 'string'
      ? (() => { try { return JSON.parse(currentUser.permissions); } catch { return {}; } })()
      : currentUser?.permissions;
    return perms?.[item.permission as keyof typeof perms] ?? false;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingLogo, { backgroundColor: colors.primaryLight }]}>
          <BookOpen size={60} color={colors.primary} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.statusBar} barStyle={colors.statusBarStyle} />
      
      {/* Green Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/settings')}>
          <Menu size={24} color={colors.headerText} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <BookOpen size={24} color={colors.headerText} />
          <Text style={[styles.headerTitle, { color: colors.headerText }]} numberOfLines={1}>{shopName}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerBtn}
            onPress={() => router.push('/tutorial')}
          >
            <HelpCircle size={24} color={colors.headerText} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerBtn}
            onPress={() => router.push('/settings')}
          >
            <SettingsIcon size={24} color={colors.headerText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
            <LogOut size={24} color={colors.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: colors.background }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} tintColor="#059669" />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Bonjour 👋</Text>
          <Text style={[styles.welcomeName, { color: colors.text }]}>{currentUser?.username || 'Utilisateur'}</Text>
        </View>

        {/* Stats Cards */}
        <Animated.View style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <ArrowUpRight size={24} color="#2563eb" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Ventes</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats ? (stats.totalSalesThisMonth || 0).toLocaleString() : '0'} {currency}
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fee2e2' }]}>
              <ArrowDownRight size={24} color="#dc2626" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Depenses</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stats ? (stats.totalExpensesThisMonth || 0).toLocaleString() : '0'} {currency}
            </Text>
          </View>

          <View style={[styles.statCard, styles.statCardFullWidth, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
              <PieChart size={24} color="#16a34a" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Profit Net</Text>
            <Text style={[styles.statValue, { color: (stats?.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626' }]}>
              {stats ? (stats.netProfit || 0).toLocaleString() : '0'} {currency}
            </Text>
          </View>
        </Animated.View>

        {/* Menu Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu Principal</Text>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <MenuGridItem key={item.id} item={item} index={index} />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>{shopName} v1.2.0</Text>
          {!isAdmin && <Text style={[styles.footerText, { color: colors.textTertiary }]}>Mode Employé</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
  loadingLogo: { 
    width: 120, 
    height: 120, 
    backgroundColor: '#dcfce7', 
    borderRadius: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  loadingText: { marginTop: 10, color: '#6b7280', fontSize: 16 },
  header: { 
    height: 60, 
    backgroundColor: '#059669', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }
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
  welcomeSection: { paddingHorizontal: 20, paddingVertical: 15 },
  welcomeText: { fontSize: 16, color: '#6b7280' },
  welcomeName: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginTop: 4 },
  statsContainer: { paddingHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { 
    width: '48%', 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 }
  },
  statCardFullWidth: { width: '100%' },
  statIconContainer: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 12
  },
  statLabel: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#111827', 
    paddingHorizontal: 20, 
    marginBottom: 10,
    marginTop: 10
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 10, 
    justifyContent: 'space-between'
  },
  gridItem: { 
    width: '48%', 
    borderRadius: 20, 
    paddingVertical: 25, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  iconWrapper: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 12
  },
  itemTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#111827', 
    textAlign: 'center',
    paddingHorizontal: 10
  },
  footer: { alignItems: 'center', marginTop: 10, padding: 20 },
  footerText: { color: '#9ca3af', fontSize: 12, marginTop: 4 }
});
