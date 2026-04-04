import { useLanguage, useTheme } from '@/lib/AppContext';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const categoryColors: any = {
  team: { light: { bg: '#E1F5EE', text: '#0F6E56' }, dark: { bg: 'rgba(15,61,46,0.8)', text: '#9FE1CB' } },
  individual: { light: { bg: '#E6F1FB', text: '#185FA5' }, dark: { bg: 'rgba(12,30,53,0.8)', text: '#B5D4F4' } },
  water: { light: { bg: '#EEEDFE', text: '#534AB7' }, dark: { bg: 'rgba(38,33,92,0.8)', text: '#CECBF6' } },
  watch: { light: { bg: '#FAECE7', text: '#993C1D' }, dark: { bg: 'rgba(74,27,12,0.8)', text: '#F5C4B3' } },
};

export default function EventsBySportScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const { sport, category } = useLocalSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [participantStatuses, setParticipantStatuses] = useState<{ [key: string]: string }>({});

  const catColors = categoryColors[category as string] || { light: { bg: '#F1EFE8', text: '#444441' }, dark: { bg: 'rgba(30,45,61,0.8)', text: '#888' } };
  const color = isDark ? catColors.dark : catColors.light;

  useFocusEffect(useCallback(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    fetchLocationAndEvents();
  }, []));

  async function fetchLocationAndEvents() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLoading(false); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc.coords);
    await fetchEvents(loc.coords);
  }

  async function fetchEvents(coords?: any) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('sport', sport)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      setEvents([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const currentCoords = coords || userLocation;
    let filtered = data || [];
    if (currentCoords) {
      filtered = filtered.filter((event: any) => {
        if (!event.latitude || !event.longitude) return true;
        return getDistanceKm(currentCoords.latitude, currentCoords.longitude, event.latitude, event.longitude) <= 20;
      });
    }

    setEvents(filtered);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: participants } = await supabase.from('event_participants').select('event_id, status').eq('user_id', session.user.id);
      const statusMap: { [key: string]: string } = {};
      (participants || []).forEach((p: any) => { statusMap[p.event_id] = p.status; });
      setParticipantStatuses(statusMap);
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function handleJoin(eventId: string, createdBy: string) {
    if (!user) { Alert.alert('Sign in required', 'You must be signed in to join an event'); return; }

    const { data: userProfile } = await supabase.from('profiles').select('first_name, last_name, nickname').eq('id', user.id).single();
    const displayName = userProfile?.nickname
      ? `@${userProfile.nickname}`
      : userProfile?.first_name
      ? `${userProfile.first_name} ${userProfile.last_name}`
      : user.email;

    const { data: participant, error } = await supabase.from('event_participants').insert({ event_id: eventId, user_id: user.id, status: 'pending' }).select().single();
    if (error) { Alert.alert(t('error'), error.message); return; }
    await supabase.from('notifications').insert({ user_id: createdBy, event_id: eventId, participant_id: participant.id, message: `${displayName} wants to join your event!` });
    const { data: creatorProfile } = await supabase.from('profiles').select('push_token').eq('id', createdBy).single();
    if (creatorProfile?.push_token) await sendPushNotification(creatorProfile.push_token, 'New join request!', `${displayName} wants to join your event!`);
    setParticipantStatuses({ ...participantStatuses, [eventId]: 'pending' });
    Alert.alert('Request sent', 'The organiser will review your request!');
  }

  const renderJoinButton = (event: any) => {
    const isOwner = user && user.id === event.created_by;
    const status = participantStatuses[event.id];
    const isFull = event.max_players && event.approved_count >= event.max_players;
    if (isOwner) return <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/edit-event', params: { id: event.id } } as any); }}><Text style={styles.editBtnText}>{t('editEvent')}</Text></TouchableOpacity>;
    if (status === 'approved') return <View style={styles.approvedBtn}><Text style={styles.approvedBtnText}>{t('alreadyJoined')}</Text></View>;
    if (status === 'pending') return <View style={styles.pendingBtn}><Text style={styles.pendingBtnText}>{t('waitingApproval')}</Text></View>;
    if (isFull) return <View style={styles.fullBtn}><Text style={styles.fullBtnText}>{t('eventIsFull')}</Text></View>;
    return <TouchableOpacity style={styles.joinBtn} onPress={(e) => { e.stopPropagation(); handleJoin(event.id, event.created_by); }}><Text style={styles.joinBtnText}>{t('joinEvent')}</Text></TouchableOpacity>;
  };

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>

      <View style={[styles.sportBadge, { backgroundColor: color.bg }]}>
        <Text style={[styles.sportBadgeText, { color: color.text }]}>{sport}</Text>
      </View>

      <Text style={[styles.title, { color: colors.accent }]}>{sport} events</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('pullToRefresh')}</Text>

      {events.length === 0 && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text }]}>{t('noEventsNearby')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('beFirstToCreate')}</Text>
        </View>
      )}

      {events.map((event) => {
        const distance = userLocation && event.latitude && event.longitude
          ? getDistanceKm(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude).toFixed(1) : null;
        return (
          <TouchableOpacity
            key={event.id}
            style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}
            onPress={() => router.push({ pathname: '/event-details', params: { id: event.id } } as any)}
          >
            <View style={styles.cardHeader}>
              {event.skill_level && <View style={[styles.skillBadge, { backgroundColor: isDark ? 'rgba(65,57,12,0.8)' : '#F1EFE8' }]}><Text style={[styles.skillText, { color: isDark ? '#FAC775' : '#444441' }]}>{event.skill_level}</Text></View>}
              {distance && <View style={[styles.distanceBadge, { backgroundColor: isDark ? 'rgba(12,30,53,0.8)' : '#E6F1FB' }]}><Text style={[styles.distanceText, { color: isDark ? '#B5D4F4' : '#185FA5' }]}>{distance} km</Text></View>}
              {user && user.id === event.created_by && <View style={[styles.ownerBadge, { backgroundColor: isDark ? 'rgba(38,33,92,0.8)' : '#EEEDFE' }]}><Text style={[styles.ownerText, { color: isDark ? '#CECBF6' : '#534AB7' }]}>My event</Text></View>}
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{event.title}</Text>
            {event.description && <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{event.description}</Text>}
            <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>📍 {event.location}</Text>
            <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>📅 {event.date} at {event.time} — {event.end_time}</Text>
            {event.max_players ? (
              <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>👥 {event.approved_count || 0} / {event.max_players} players</Text>
            ) : (
              <Text style={[styles.cardDetail, { color: colors.textSecondary }]}>👥 {t('unlimited')}</Text>
            )}
            <View style={styles.cardActions}>{renderJoinButton(event)}</View>
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
  sportBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, marginBottom: 8 },
  sportBadgeText: { fontSize: 13, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  skillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  skillText: { fontSize: 12, fontWeight: '500' },
  distanceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  distanceText: { fontSize: 12, fontWeight: '500' },
  ownerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  ownerText: { fontSize: 12, fontWeight: '500' },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  cardDescription: { fontSize: 13, marginBottom: 8, fontStyle: 'italic' },
  cardDetail: { fontSize: 14, marginBottom: 4 },
  cardActions: { marginTop: 12 },
  joinBtn: { backgroundColor: '#1D9E75', padding: 12, borderRadius: 12, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  pendingBtn: { backgroundColor: '#FAEEDA', padding: 12, borderRadius: 12, alignItems: 'center' },
  pendingBtnText: { color: '#BA7517', fontWeight: 'bold', fontSize: 14 },
  approvedBtn: { backgroundColor: '#E1F5EE', padding: 12, borderRadius: 12, alignItems: 'center' },
  approvedBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 14 },
  fullBtn: { backgroundColor: '#FCEBEB', padding: 12, borderRadius: 12, alignItems: 'center' },
  fullBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 14 },
  editBtn: { backgroundColor: '#EEEDFE', padding: 12, borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#534AB7', fontWeight: 'bold', fontSize: 14 },
});