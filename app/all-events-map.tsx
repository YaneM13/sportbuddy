import EventMap from '@/components/EventMap';
import { useLocation, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenHeight = Dimensions.get('window').height;

const CATEGORIES = [
  { id: 'team', label: '👥 Team' },
  { id: 'individual', label: '🏃 Individual' },
  { id: 'water', label: '🌊 Water' },
  { id: 'watch', label: '🏟️ Watch' },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function AllEventsMapScreen() {
  const { isDark, colors } = useTheme();
  const { userLocation } = useLocation();
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('team');
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (userLocation) fetchEvents();
  }, [userLocation]);

  // Филтрирај кога се менува категоријата
  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredEvents(allEvents);
    } else {
      setFilteredEvents(allEvents.filter(e => e.category === selectedCategory));
    }
  }, [selectedCategory, allEvents]);

  async function fetchEvents() {
  try {
    const { data, error } = await supabase
      .rpc('get_events_within_radius', {
        user_lat: userLocation!.latitude,
        user_lon: userLocation!.longitude,
        radius_km: 20,
        sport_filter: null,
        category_filter: null,
      });

    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }

    setAllEvents(data || []);
    setFilteredEvents(data || []);
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
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {filteredEvents.length} events within 20km
        </Text>

        {/* Филтер копчиња */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={String(cat.id)}
              style={[
                styles.filterBtn,
                { borderColor: colors.cardBorder, backgroundColor: isDark ? '#1E2D3D' : '#fff' },
                selectedCategory === cat.id && styles.filterBtnActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[
                styles.filterBtnText,
                { color: colors.textSecondary },
                selectedCategory === cat.id && styles.filterBtnTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {userLocation && !mapError && (
        <View style={[styles.mapContainer, { borderColor: colors.cardBorder }]}>
          <EventMap
            events={filteredEvents}
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
  subtitle: { fontSize: 14, marginBottom: 12 },
  filterScroll: { marginTop: 8 },
  filterContainer: { gap: 8, paddingBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  filterBtnActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  filterBtnText: { fontSize: 13, fontWeight: '500' },
  filterBtnTextActive: { color: '#fff' },
  mapContainer: { height: screenHeight - 240, margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5 },
});