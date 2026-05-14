import EventMap from '@/components/EventMap';
import { useLocation, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenHeight = Dimensions.get('window').height;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function AllEventsMapScreen() {
  const { isDark, colors } = useTheme();
  const { userLocation } = useLocation(); // ← од Context, без GPS чекање
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (userLocation) fetchEvents();
  }, [userLocation]);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) { Alert.alert('Error', error.message); setLoading(false); return; }

      const filtered = (data || []).filter((event: any) => {
        if (!event.latitude || !event.longitude) return false;
        return getDistanceKm(userLocation!.latitude, userLocation!.longitude, event.latitude, event.longitude) <= 20;
      });

      setEvents(filtered);
    } catch (e) {
      setMapError(true);
    }
    setLoading(false);
  }

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
      <ActivityIndicator size="large" color="#1D9E75" />
    </View>
  );

  if (mapError) return (
    <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
      <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center', padding: 24 }}>
        Unable to load map. Please try again.
      </Text>
      <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.accent }]}>All events on map</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{events.length} events within 20km</Text>
      </View>

      {userLocation && !mapError && (
        <View style={[styles.mapContainer, { borderColor: colors.cardBorder }]}>
          <EventMap
            events={events}
            userLatitude={userLocation.latitude}
            userLongitude={userLocation.longitude}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  mapContainer: { height: screenHeight - 200, margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5 },
});