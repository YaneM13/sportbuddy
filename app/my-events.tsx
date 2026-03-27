import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyEventsScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchMyEvents(); }, []);

  async function fetchMyEvents() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.back(); return; }
    const { data, error } = await supabase.from('events').select('*').eq('created_by', session.user.id).order('created_at', { ascending: false });
    if (error) Alert.alert(t('error'), error.message);
    else setEvents(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  const getCategoryColor = (category: string) => {
    const light: any = { team: { bg: '#E1F5EE', text: '#0F6E56' }, individual: { bg: '#E6F1FB', text: '#185FA5' }, water: { bg: '#EEEDFE', text: '#534AB7' }, watch: { bg: '#FAECE7', text: '#993C1D' } };
    const dark: any = { team: { bg: 'rgba(15,61,46,0.8)', text: '#9FE1CB' }, individual: { bg: 'rgba(12,30,53,0.8)', text: '#B5D4F4' }, water: { bg: 'rgba(38,33,92,0.8)', text: '#CECBF6' }, watch: { bg: 'rgba(74,27,12,0.8)', text: '#F5C4B3' } };
    return isDark ? (dark[category] || { bg: '#1E2D3D', text: '#888' }) : (light[category] || { bg: '#F1EFE8', text: '#444441' });
  };

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyEvents(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent }]}>{t('myEvents')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{events.length} {events.length !== 1 ? 'events' : 'event'} {t('eventsCreated').toLowerCase()}</Text>

      {events.length === 0 && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('noEventsNearby')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('beFirstToCreate')}</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-event' as any)}>
            <Text style={styles.createBtnText}>{t('createEvent')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {events.map((event) => {
        const color = getCategoryColor(event.category);
        return (
          <TouchableOpacity
            key={event.id}
            style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}
            onPress={() => router.push({ pathname: '/event-details', params: { id: event.id } } as any)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: color.bg }]}>
                <Text style={[styles.categoryText, { color: color.text }]}>{event.sport}</Text>
              </View>
              {event.skill_level && <View style={[styles.skillBadge, { backgroundColor: isDark ? 'rgba(65,57,12,0.8)' : '#F1EFE8' }]}><Text style={[styles.skillText, { color: isDark ? '#FAC775' : '#444441' }]}>{event.skill_level}</Text></View>}
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{event.title}</Text>
            <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>📍 {event.location}</Text>
            <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>📅 {event.date} at {event.time} — {event.end_time}</Text>
            {event.max_players ? <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>👥 {event.approved_count || 0} / {event.max_players} players</Text> : <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>👥 {t('unlimited')}</Text>}
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/edit-event', params: { id: event.id } } as any); }}>
                <Text style={styles.editBtnText}>{t('editEvent')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rateBtn} onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/rate-players', params: { event_id: event.id } } as any); }}>
                <Text style={styles.rateBtnText}>{t('ratePlayersTitle')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, marginBottom: 24 },
  createBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 },
  createBtnText: { color: '#fff', fontWeight: '500', fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  categoryText: { fontSize: 12, fontWeight: '500' },
  skillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  skillText: { fontSize: 12, fontWeight: '500' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  cardDetail: { fontSize: 14, marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: '#EEEDFE', padding: 12, borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#534AB7', fontWeight: 'bold', fontSize: 14 },
  rateBtn: { flex: 1, backgroundColor: '#FAECE7', padding: 12, borderRadius: 12, alignItems: 'center' },
  rateBtnText: { color: '#993C1D', fontWeight: 'bold', fontSize: 14 },
});