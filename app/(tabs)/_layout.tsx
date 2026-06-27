import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, Truck, HelpCircle } from 'lucide-react-native';
import { useThemeColors } from '../../src/theme/ThemeContext';

export default function TabLayout() {
  const colors = useThemeColors();
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: colors.primary,
      tabBarStyle: { height: 65, paddingBottom: 12, paddingTop: 8, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
      tabBarLabelStyle: { color: colors.textSecondary },
      headerShown: false
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Fournisseurs',
          tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Aide',
          tabBarIcon: ({ color }) => <HelpCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="sales" options={{ href: null }} />
      <Tabs.Screen name="expenses" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="cash" options={{ href: null }} />
      <Tabs.Screen name="credits" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
