import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { api } from '../src/api/api';

export default function RootLayout() {
  const [initialNavigationDone, setInitialNavigationDone] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initialNavigationDone) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isAuthenticated = api.isAuthenticated();

    console.log('Navigation state:', { inAuthGroup, inTabsGroup, isAuthenticated, segments });

    if (isAuthenticated && !inTabsGroup) {
      console.log('Redirecting to dashboard');
      router.replace('/(tabs)');
    } else if (!isAuthenticated && !inAuthGroup) {
      console.log('Redirecting to login');
      router.replace('/(auth)/login');
    }

    setInitialNavigationDone(true);
  }, [initialNavigationDone, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
