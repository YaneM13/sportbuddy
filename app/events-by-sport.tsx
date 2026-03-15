import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const categoryColors: any = {
  team: { bg: '#E1F5EE', text: '#0F6E56' },
  individual: { bg: '#E6F1FB', text: '#185FA5' },
  water: { bg: '#EEEDFE', text: '#534AB7' },
  watch: { bg: '#FAECE7', text: '#993C1D' },
};

export default function EventsBySportScreen() {
  const { sport, category } = useLocalSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);

  const color = categoryColors[category as string] || { bg: '#F1EFE8', text: '#444441' };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    fetchLocationAndEvents();
  }, []);

  async function fetchLocationAndEvents() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is needed to find nearby events');
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc.coords);
    await fetchEvents(loc.coords);
  }

  async function fetchEvents(coords?: any) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('sport', sport)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const currentCoords = coords || userLocation;
    let filtered = data || [];

    if (currentCoords) {
      filtered = filtered.filter((event: any) => {
        if (!event.latitude || !event.longitude) return true;
        const dist = getDistanceKm(
          currentCoords.latitude,
          currentCoords.longitude,
          event.latitude,
          event.longitude
        );
        return dist <= 20;
      });
    }

    setEvents(filtered);
    setLoading(false);
    setRefreshing(false);
  }

  async function handleJoin(eventId: string, createdBy: string) {
    if (!user) {
      Alert.alert('Sign in required', 'You must be signed in to join an event');
      return;
    }

    const { data: participant, error } = await supabase
      .from('event_participants')
      .insert({ event_id: eventId, user_id: user.id, status: 'pending' })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await supabase.from('notifications').insert({
      user_id: createdBy,
      event_id: eventId,
      participant_id: participant.id,
      message: `${user.email} wants to join your event!`,
    });

    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', createdBy)
      .single();

    if (creatorProfile?.push_token) {
      await sendPushNotification(
        creatorProfile.push_token,
        'New join request!',
        `${user.email} wants to join your event!`
      );
    }

    Alert.alert('Request sent', 'The organiser will review your request!');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={[styles.sportBadge, { backgroundColor: color.bg }]}>
        <Text style={[styles.sportBadgeText, { color: color.text }]}>{sport}</Text>
      </View>

      <Text style={styles.title}>{sport} events</Text>
      <Text style={styles.subtitle}>Events within 20km · Pull down to refresh</Text>

      {events.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No {sport} events nearby</Text>
          <Text style={styles.emptySubtext}>Be the first to create one!</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-event' as any)}>
            <Text style={styles.createBtnText}>Create an event</Text>
          </TouchableOpacity>
        </View>
      )}

      {events.map((event) => {
        const isOwner = user && user.id === event.created_by;
        const distance = userLocation && event.latitude && event.longitude
          ? getDistanceKm(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude).toFixed(1)
          : null;

        return (
          <View key={event.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {event.skill_level && (
                <View style={styles.skillBadge}>
                  <Text style={styles.skillText}>{event.skill_level}</Text>
                </View>
              )}
              {distance && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{distance} km</Text>
                </View>
              )}
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerText}>My event</Text>
                </View>
              )}
            </View>

            <Text style={styles.cardTitle}>{event.title}</Text>
            <Text style={styles.cardDetail}>📍 {event.location}</Text>
            <Text style={styles.cardDetail}>📅 {event.date} at {event.time} — {event.end_time}</Text>
            {event.max_players ? (
              <Text style={styles.cardDetail}>👥 {event.max_players} players needed</Text>
            ) : (
              <Text style={styles.cardDetail}>👥 Unlimited participants</Text>
            )}

            <View style={styles.cardActions}>
              {isOwner ? (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: '/edit-event', params: { id: event.id } } as any)}
                >
                  <Text style={styles.editBtnText}>Edit event</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(event.id, event.created_by)}>
                  <Text style={styles.joinBtnText}>Join event</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
  },
  sportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 8,
  },
  sportBadgeText: {
    fontSize: 13,
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
    marginBottom: 24,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#F1EFE8',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444441',
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#E6F1FB',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#185FA5',
  },
  ownerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#EEEDFE',
  },
  ownerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#534AB7',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  cardActions: {
    marginTop: 12,
  },
  joinBtn: {
    backgroundColor: '#1D9E75',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  editBtn: {
    backgroundColor: '#EEEDFE',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#534AB7',
    fontWeight: 'bold',
    fontSize: 14,
  },
});