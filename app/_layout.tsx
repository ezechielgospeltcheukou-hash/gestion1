import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { api } from '../src/api/api';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 1500);
    api.waitUntilReady().then(() => setAppReady(true)).catch(() => setAppReady(true));
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!appReady) return;

    const checkAuth = async () => {
      const isAuthenticated = await api.isAuthenticated();
      const path = segments[0];
      const inAuth = path === '(auth)';
      const inTabs = path === '(tabs)';
      const standalone = ['employees', 'invoices', 'appointments', 'chat', 'chat-list', 'activity', 'forgot-password', 'email-setup', 'tutorial'].includes(path);

      if (!isAuthenticated && !inAuth) {
        router.replace('/(auth)');
      } else if (isAuthenticated && !inTabs && !standalone && !inAuth) {
        router.replace('/(tabs)');
      }
    };

    checkAuth();
  }, [appReady, segments, router]);

  if (!appReady) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="tutorial" />
          <Stack.Screen name="employees" />
          <Stack.Screen name="invoices" />
          <Stack.Screen name="appointments" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="chat-list" />
          <Stack.Screen name="activity" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="email-setup" />
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
