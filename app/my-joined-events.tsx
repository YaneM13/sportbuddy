import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyJoinedEventsScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [finishedEvents, setFinishedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchJoinedEvents(); }, []);

  async function fetchJoinedEvents() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.back(); return; }
    const { data, error } = await supabase
      .from('event_participants')
      .select('status, joined_at, events(*)')
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: false });
    if (error) { Alert.alert(t('error'), error.message); setLoading(false); setRefreshing(false); return; }
    const active: any[] = [], finished: any[] = [];
    (data || []).forEach((item: any) => {
      const event = item.events;
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
    const light: any = { team: { bg: '#E1F5EE', text: '#0F6E56' }, individual: { bg: '#E6F1FB', text: '#185FA5' }, water: { bg: '#EEEDFE', text: '#534AB7' }, watch: { bg: '#FAECE7', text: '#993C1D' } };
    const dark: any = { team: { bg: 'rgba(15,61,46,0.8)', text: '#9FE1CB' }, individual: { bg: 'rgba(12,30,53,0.8)', text: '#B5D4F4' }, water: { bg: 'rgba(38,33,92,0.8)', text: '#CECBF6' }, watch: { bg: 'rgba(74,27,12,0.8)', text: '#F5C4B3' } };
    return isDark ? (dark[category] || { bg: '#1E2D3D', text: '#888' }) : (light[category] || { bg: '#F1EFE8', text: '#444441' });
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved') return { bg: isDark ? 'rgba(15,61,46,0.8)' : '#E1F5EE', text: isDark ? '#9FE1CB' : '#0F6E56', label: '✅ ' + t('approve') + 'd' };
    if (status === 'pending') return { bg: isDark ? 'rgba(65,57,12,0.8)' : '#FAEEDA', text: isDark ? '#FAC775' : '#BA7517', label: '⏳ ' + t('waitingApproval') };
    return { bg: isDark ? 'rgba(80,20,20,0.8)' : '#FCEBEB', text: isDark ? '#F09595' : '#E24B4A', label: '❌ ' + t('reject') + 'ed' };
  };

  const renderEventCard = (item: any, isFinished: boolean = false) => {
    const event = item.events;
    if (!event) return null;
    const color = getCategoryColor(event.category);
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity
        key={item.joined_at + event.id}
        style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }, isFinished && { opacity: 0.75 }]}
        onPress={() => router.push({ pathname: '/event-details', params: { id: event.id } } as any)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: color.bg }]}><Text style={[styles.badgeText, { color: color.text }]}>{event.sport}</Text></View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}><Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text></View>
          {isFinished && <View style={[styles.badge, { backgroundColor: isDark ? '#1E2D3D' : '#F1EFE8' }]}><Text style={[styles.badgeText, { color: colors.textSecondary }]}>Finished</Text></View>}
        </View>
        <Text style={[styles.cardTitle, { color: isFinished ? colors.textSecondary : colors.text }]}>{event.title}</Text>
        <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>📍 {event.location}</Text>
        <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>📅 {event.date} at {event.time} — {event.end_time}</Text>
        {event.max_players ? <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>👥 {event.approved_count || 0} / {event.max_players} players</Text> : <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>👥 {t('unlimited')}</Text>}
        {isFinished && (
          <TouchableOpacity style={styles.rateBtn} onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/rate-players', params: { event_id: event.id } } as any); }}>
            <Text style={styles.rateBtnText}>⭐ {t('ratePlayersTitle')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJoinedEvents(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.accent }]}>{t('eventsJoined')}</Text>

      {activeEvents.length === 0 && finishedEvents.length === 0 && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('noEventsNearby')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('findAnEvent')}</Text>
          <TouchableOpacity style={styles.findBtn} onPress={() => router.push('/find-event' as any)}>
            <Text style={styles.findBtnText}>{t('findEvent')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeEvents.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, borderBottomColor: colors.cardBorder }]}>Upcoming events ({activeEvents.length})</Text>
          {activeEvents.map((item) => renderEventCard(item, false))}
        </>
      )}

      {finishedEvents.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, borderBottomColor: colors.cardBorder }]}>Finished events ({finishedEvents.length})</Text>
          {finishedEvents.map((item) => renderEventCard(item, true))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 0.5 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, marginBottom: 24 },
  findBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 },
  findBtnText: { color: '#fff', fontWeight: '500', fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  cardDetail: { fontSize: 14, marginBottom: 4 },
  rateBtn: { marginTop: 12, backgroundColor: '#FAEEDA', padding: 12, borderRadius: 12, alignItems: 'center' },
  rateBtnText: { color: '#BA7517', fontWeight: 'bold', fontSize: 14 },
});