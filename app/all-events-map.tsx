import EventMap from '@/components/EventMap';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export default function AllEventsMapScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);

  useEffect(() => {
    fetchLocationAndEvents();
  }, []);

  async function fetchLocationAndEvents() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is needed');
      setLoading(false);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc.coords);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    const filtered = (data || []).filter((event: any) => {
      if (!event.latitude || !event.longitude) return false;
      const R = 6371;
      const dLat = (event.latitude - loc.coords.latitude) * Math.PI / 180;
      const dLon = (event.longitude - loc.coords.longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc.coords.latitude * Math.PI / 180) * Math.cos(event.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= 20;
    });

    setEvents(filtered);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All events on map</Text>
        <Text style={styles.subtitle}>{events.length} events within 20km</Text>
      </View>

      {userLocation && (
        <View style={styles.mapContainer}>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  mapContainer: {
    height: screenHeight - 200,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
});