import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  async function fetchMyEvents() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Sign in required', 'You must be signed in to view your events');
      router.back();
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error', error.message);
    else setEvents(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  const getCategoryColor = (category: string) => {
    const colors: any = {
      team: { bg: '#E1F5EE', text: '#0F6E56' },
      individual: { bg: '#E6F1FB', text: '#185FA5' },
      water: { bg: '#EEEDFE', text: '#534AB7' },
      watch: { bg: '#FAECE7', text: '#993C1D' },
    };
    return colors[category] || { bg: '#F1EFE8', text: '#444441' };
  };

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyEvents(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My events</Text>
      <Text style={styles.subtitle}>{events.length} event{events.length !== 1 ? 's' : ''} created</Text>

      {events.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No events yet</Text>
          <Text style={styles.emptySubtext}>Create your first event!</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-event' as any)}>
            <Text style={styles.createBtnText}>Create an event</Text>
          </TouchableOpacity>
        </View>
      )}

      {events.map((event) => {
        const color = getCategoryColor(event.category);
        return (
          <View key={event.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: color.bg }]}>
                <Text style={[styles.categoryText, { color: color.text }]}>{event.sport}</Text>
              </View>
              {event.skill_level && (
                <View style={styles.skillBadge}>
                  <Text style={styles.skillText}>{event.skill_level}</Text>
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
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push({ pathname: '/edit-event', params: { id: event.id } } as any)}
              >
                <Text style={styles.editBtnText}>Edit event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rateBtn}
                onPress={() => router.push({ pathname: '/rate-players', params: { event_id: event.id } } as any)}
              >
                <Text style={styles.rateBtnText}>Rate players</Text>
              </TouchableOpacity>
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
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
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
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editBtn: {
    flex: 1,
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
  rateBtn: {
    flex: 1,
    backgroundColor: '#FAECE7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateBtnText: {
    color: '#993C1D',
    fontWeight: 'bold',
    fontSize: 14,
  },
});