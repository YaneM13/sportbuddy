import { AppProvider } from '@/lib/AppContext';
import { registerForPushNotifications, savePushToken, sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function RootLayout() {
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  useEffect(() => {
    async function setup() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');
      const token = await registerForPushNotifications();
      if (token) await savePushToken(token);

      if (status === 'granted') {
        checkNearbyAlertEvents();
      }
    }
    setup();

    async function handleDeepLink(url: string) {
      if (!url) return;

      const hashPart = url.split('#')[1] || '';
      const queryPart = url.split('?')[1] || '';
      const paramString = hashPart || queryPart;
      const params = new URLSearchParams(paramString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (url.includes('type=recovery') || url.includes('reset-password')) {
        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            router.replace({ pathname: '/reset-password', params: { access_token: accessToken, refresh_token: refreshToken } } as any);
          } catch (e) { console.error('Session error:', e); }
        }
        return;
      }

      if (type === 'signup' || type === 'email_change' || url.includes('type=signup')) {
        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          } catch (e) { console.error('Session error:', e); }
        }
        router.replace('/email-confirmed' as any);
        return;
      }
    }

    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    const subscription = Linking.addEventListener('url', ({ url }) => { handleDeepLink(url); });
    return () => { subscription.remove(); };
  }, []);

  async function checkNearbyAlertEvents() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('favorite_sport, push_token')
        .eq('id', session.user.id)
        .single();

      if (!profile?.favorite_sport || !profile?.push_token) return;

      const loc = await Location.getCurrentPositionAsync({});

      const { data: alertEvents } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .eq('is_alert', true)
        .eq('sport', profile.favorite_sport);

      for (const event of alertEvents || []) {
        if (!event.latitude || !event.longitude) continue;
        const distance = getDistanceKm(
          loc.coords.latitude,
          loc.coords.longitude,
          event.latitude,
          event.longitude
        );
        if (distance <= 20) {
          await sendPushNotification(
            profile.push_token,
            '🔔 Alert Event Nearby!',
            `${event.sport} event: ${event.title} is happening near you!`
          );
        }
      }
    } catch (e) {
      console.error('Alert events error:', e);
    }
  }

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
          <Text style={styles.locationBtnText}>📍 Enable location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locationBtn, { backgroundColor: '#1E2D3D', marginTop: 12 }]}
          onPress={async () => { await Linking.openSettings(); }}
        >
          <Text style={styles.locationBtnText}>⚙️ Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locationGranted === null) {
    return null;
  }

  return (
    <AppProvider>
      <ThemeProvider value={DarkTheme}>
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
          <Stack.Screen name="personal-details" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="email-confirmed" />
          <Stack.Screen name="event-chat" />
          <Stack.Screen name="pick-location" />
          <Stack.Screen name="modal" />
          <Stack.Screen name="terms" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  locationRequired: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0F1923' },
  locationIcon: { fontSize: 48, marginBottom: 16 },
  locationTitle: { fontSize: 24, fontWeight: 'bold', color: '#1D9E75', marginBottom: 12, textAlign: 'center' },
  locationText: { fontSize: 15, color: '#6B8FA8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  locationBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  locationBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});