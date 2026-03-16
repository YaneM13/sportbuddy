import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function setupNotifications() {
      const token = await registerForPushNotifications();
      if (token) await savePushToken(token);
    }
    setupNotifications();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="create-event" />
        <Stack.Screen name="find-event" />
        <Stack.Screen name="events-by-sport" />
        <Stack.Screen name="all-events-map" />
        <Stack.Screen name="edit-event" />
        <Stack.Screen name="my-events" />
        <Stack.Screen name="my-profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="rate-players" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="event-details" />
        <Stack.Screen name="my-joined-events" />
        <Stack.Screen name="personal-details" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="modal" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}