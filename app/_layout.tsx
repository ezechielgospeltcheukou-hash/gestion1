import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { api } from '../src/api/api';

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [initialNavigationDone, setInitialNavigationDone] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const initApp = async () => {
      try {
        await api.waitUntilReady();
        setAppReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setAppReady(true);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!appReady || initialNavigationDone) return;

    const checkAuth = async () => {
      const isAuthenticated = await api.isAuthenticated();
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';

      console.log('Navigation state:', { inAuthGroup, inTabsGroup, isAuthenticated, segments });

      if (isAuthenticated && !inTabsGroup) {
        console.log('Redirecting to dashboard');
        router.replace('/(tabs)');
      } else if (!isAuthenticated && !inAuthGroup) {
        console.log('Redirecting to login');
        router.replace('/(auth)/login');
      }

      setInitialNavigationDone(true);
    };

    checkAuth();
  }, [appReady, initialNavigationDone, segments]);

  if (!appReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
