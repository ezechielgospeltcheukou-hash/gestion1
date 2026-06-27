import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/api/api';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        await api.waitUntilReady();
        const isAuth = await api.isAuthenticated();
        if (isAuth) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)');
        }
      } catch {
        router.replace('/(auth)');
      }
    };
    redirect();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
      <ActivityIndicator size="large" color="#059669" />
    </View>
  );
}
