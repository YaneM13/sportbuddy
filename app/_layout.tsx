import { useColorScheme } from '@/hooks/use-color-scheme';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  useEffect(() => {
    async function setup() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');

      const token = await registerForPushNotifications();
      if (token) await savePushToken(token);
    }
    setup();
  }, []);

  if (locationGranted === false) {
    return (
      <View style={styles.locationRequired}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationTitle}>Location required</Text>
        <Text style={styles.locationText}>
          SportBuddy needs your location to show you nearby events within 20km. Please enable location access to continue.
        </Text>
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationGranted(status === 'granted');
          }}
        >
          <Text style={styles.locationBtnText}>Enable location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locationGranted === null) {
    return null;
  }

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
        <Stack.Screen name="my-joined-events" />
        <Stack.Screen name="my-profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="rate-players" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="event-details" />
        <Stack.Screen name="event-chat" />
        <Stack.Screen name="personal-details" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="pick-location" />
        <Stack.Screen name="modal" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  locationRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  locationIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 12,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  locationBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  locationBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});