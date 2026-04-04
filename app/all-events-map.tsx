import EventMap from '@/components/EventMap';
import { useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export default function AllEventsMapScreen() {
  const { isDark, colors } = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => { fetchLocationAndEvents(); }, []);

  async function fetchLocationAndEvents() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied', 'Location permission is needed'); setLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      const { data, error } = await supabase.from('events').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (error) { Alert.alert('Error', error.message); setLoading(false); return; }
      const filtered = (data || []).filter((event: any) => {
        if (!event.latitude || !event.longitude) return false;
        const R = 6371;
        const dLat = (event.latitude - loc.coords.latitude) * Math.PI / 180;
        const dLon = (event.longitude - loc.coords.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(loc.coords.latitude*Math.PI/180)*Math.cos(event.latitude*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) <= 20;
      });
      setEvents(filtered);
    } catch (e) {
      setMapError(true);
    }
    setLoading(false);
  }

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

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