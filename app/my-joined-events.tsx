import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/useLanguage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyJoinedEventsScreen() {
  const { t } = useLanguage();
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [finishedEvents, setFinishedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJoinedEvents();
  }, []);

  async function fetchJoinedEvents() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Sign in required', 'You must be signed in');
      router.back();
      return;
    }

    const { data, error } = await supabase
      .from('event_participants')
      .select('status, joined_at, events_with_counts(*)')
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: false });

    if (error) {
      Alert.alert(t('error'), error.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const active: any[] = [];
    const finished: any[] = [];

    (data || []).forEach((item: any) => {
      const event = item.events_with_counts;
      if (!event) return;
      if (event.status === 'finished') finished.push(item);
      else active.push(item);
    });

    setActiveEvents(active);
    setFinishedEvents(finished);
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

  const getStatusStyle = (status: string) => {
    if (status === 'approved') return { bg: '#E1F5EE', text: '#0F6E56', label: '✅ ' + t('approve') + 'd' };
    if (status === 'pending') return { bg: '#FAEEDA', text: '#BA7517', label: '⏳ ' + t('waitingApproval') };
    return { bg: '#FCEBEB', text: '#E24B4A', label: '❌ ' + t('reject') + 'ed' };
  };

  const renderEventCard = (item: any, isFinished: boolean = false) => {
    const event = item.events_with_counts;
    if (!event) return null;
    const color = getCategoryColor(event.category);
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        key={item.joined_at + event.id}
        style={[styles.card, isFinished && styles.cardFinished]}
        onPress={() => router.push({ pathname: '/event-details', params: { id: event.id } } as any)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: color.bg }]}>
            <Text style={[styles.categoryText, { color: color.text }]}>{event.sport}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
          {isFinished && (
            <View style={styles.finishedBadge}>
              <Text style={styles.finishedBadgeText}>Finished</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, isFinished && styles.cardTitleFinished]}>{event.title}</Text>
        <Text style={styles.cardDetail}>📍 {event.location}</Text>
        <Text style={styles.cardDetail}>📅 {event.date} at {event.time} — {event.end_time}</Text>
        {event.max_players ? (
          <Text style={styles.cardDetail}>👥 {event.approved_count || 0} / {event.max_players} players</Text>
        ) : (
          <Text style={styles.cardDetail}>👥 {t('unlimited')}</Text>
        )}

        {isFinished && (
          <TouchableOpacity
            style={styles.rateBtn}
            onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/rate-players', params: { event_id: event.id } } as any); }}
          >
            <Text style={styles.rateBtnText}>⭐ {t('ratePlayersTitle')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJoinedEvents(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('eventsJoined')}</Text>

      {activeEvents.length === 0 && finishedEvents.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('noEventsNearby')}</Text>
          <Text style={styles.emptySubtext}>{t('findAnEvent')}</Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => router.push('/find-event' as any)}>
            <Text style={styles.findBtnText}>{t('findEvent')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Upcoming events ({activeEvents.length})</Text>
          {activeEvents.map((item) => renderEventCard(item, false))}
        </>
      )}

      {finishedEvents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Finished events ({finishedEvents.length})</Text>
          {finishedEvents.map((item) => renderEventCard(item, true))}
        </>
      )}
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
    fontSize: 17,
    color: '#1D9E75',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
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
  findBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
  },
  findBtnText: {
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
  cardFinished: {
    backgroundColor: '#F9F9F9',
    opacity: 0.85,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  finishedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#F1EFE8',
  },
  finishedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  cardTitleFinished: {
    color: '#888',
  },
  cardDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  rateBtn: {
    marginTop: 12,
    backgroundColor: '#FAEEDA',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rateBtnText: {
    color: '#BA7517',
    fontWeight: 'bold',
    fontSize: 14,
  },
});