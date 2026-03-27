import BackButton from '@/components/BackButton';
import { useLanguage, useTheme } from '@/lib/AppContext';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventDetailsScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    fetchEventDetails();
  }, []);

  async function fetchEventDetails() {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: eventData, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) { Alert.alert(t('error'), error.message); setLoading(false); return; }
    setEvent(eventData);
    const { data: participantsData } = await supabase.from('event_participants').select('*, profiles(first_name, last_name, nickname, avatar_url)').eq('event_id', id).eq('status', 'approved');
    setParticipants(participantsData || []);
    if (session) {
      const { data: myParticipation } = await supabase.from('event_participants').select('status').eq('event_id', id).eq('user_id', session.user.id).single();
      setJoinStatus(myParticipation?.status || null);
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!user) { Alert.alert('Sign in required', 'You must be signed in to join an event'); return; }
    const { data: participant, error } = await supabase.from('event_participants').insert({ event_id: id, user_id: user.id, status: 'pending' }).select().single();
    if (error) { Alert.alert(t('error'), error.message); return; }
    await supabase.from('notifications').insert({ user_id: event.created_by, event_id: id, participant_id: participant.id, message: `${user.email} wants to join your event!` });
    const { data: creatorProfile } = await supabase.from('profiles').select('push_token').eq('id', event.created_by).single();
    if (creatorProfile?.push_token) await sendPushNotification(creatorProfile.push_token, 'New join request!', `${user.email} wants to join your event!`);
    setJoinStatus('pending');
    Alert.alert('Request sent', 'The organiser will review your request!');
  }

  function handleDirections() {
    if (!event?.latitude || !event?.longitude) { Alert.alert(t('error'), 'Location not available'); return; }
    const url = Platform.OS === 'ios' ? `maps://?q=${encodeURIComponent(event.location)}&ll=${event.latitude},${event.longitude}` : `google.navigation:q=${event.latitude},${event.longitude}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`));
  }

  const renderJoinButton = () => {
    const isOwner = user && user.id === event?.created_by;
    const isFull = event?.max_players && event?.approved_count >= event?.max_players;
    if (isOwner) return <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/edit-event', params: { id: event.id } } as any)}><Text style={styles.editBtnText}>{t('editEvent')}</Text></TouchableOpacity>;
    if (joinStatus === 'approved') return <View style={styles.approvedBtn}><Text style={styles.approvedBtnText}>{t('alreadyJoined')}</Text></View>;
    if (joinStatus === 'pending') return <View style={styles.pendingBtn}><Text style={styles.pendingBtnText}>{t('waitingApproval')}</Text></View>;
    if (isFull) return <View style={styles.fullBtn}><Text style={styles.fullBtnText}>{t('eventIsFull')}</Text></View>;
    return <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}><Text style={styles.joinBtnText}>{t('joinEvent')}</Text></TouchableOpacity>;
  };

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  const isParticipant = joinStatus === 'approved' || (user && user.id === event?.created_by);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
      contentContainerStyle={styles.content}
    >
      <BackButton />

      <Text style={[styles.title, { color: colors.text }]}>{event?.title}</Text>
      {event?.description && <Text style={[styles.description, { color: colors.textSecondary }]}>{event.description}</Text>}

      <View style={[styles.detailsCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
        <Text style={[styles.detail, { color: colors.text }]}>🏆 {event?.sport}</Text>
        <Text style={[styles.detail, { color: colors.text }]}>📍 {event?.location}</Text>
        <Text style={[styles.detail, { color: colors.text }]}>📅 {event?.date} at {event?.time} — {event?.end_time}</Text>
        {event?.skill_level && <Text style={[styles.detail, { color: colors.text }]}>⭐ {event?.skill_level}</Text>}
        {event?.max_players ? (
          <Text style={[styles.detail, { color: colors.text }]}>👥 {event?.approved_count || 0} / {event?.max_players} players</Text>
        ) : (
          <Text style={[styles.detail, { color: colors.text }]}>👥 {t('unlimited')}</Text>
        )}
      </View>

      <View style={styles.joinContainer}>
        {renderJoinButton()}
        {isParticipant && (
          <TouchableOpacity style={styles.directionsBtn} onPress={handleDirections}>
            <Text style={styles.directionsBtnText}>{t('getDirections')}</Text>
          </TouchableOpacity>
        )}
        {isParticipant && (
          <TouchableOpacity style={styles.chatBtn} onPress={() => router.push({ pathname: '/event-chat', params: { event_id: event?.id, event_title: event?.title } } as any)}>
            <Text style={styles.chatBtnText}>{t('groupChat')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isParticipant && (
        <View style={styles.participantsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('participants')} ({participants.length})</Text>
          {participants.length === 0 ? (
            <Text style={[styles.noParticipants, { color: colors.textSecondary }]}>{t('noParticipants')}</Text>
          ) : (
            participants.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.participantRow, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}
                onPress={() => router.push({ pathname: '/user-profile', params: { userId: p.user_id } } as any)}
              >
                {p.profiles?.avatar_url ? (
                  <Image source={{ uri: p.profiles.avatar_url }} style={styles.participantAvatar} />
                ) : (
                  <View style={styles.participantAvatarPlaceholder}>
                    <Text style={styles.participantAvatarText}>{p.profiles?.first_name ? p.profiles.first_name.substring(0, 2).toUpperCase() : '??'}</Text>
                  </View>
                )}
                <View style={styles.participantInfo}>
                  {p.profiles?.nickname && <Text style={[styles.participantNickname, { color: colors.accent }]}>@{p.profiles.nickname}</Text>}
                  {p.profiles?.first_name && <Text style={[styles.participantName, { color: colors.textSecondary }]}>{p.profiles.first_name} {p.profiles.last_name}</Text>}
                </View>
                <Text style={[styles.participantArrow, { color: colors.textSecondary }]}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  description: { fontSize: 14, fontStyle: 'italic', marginBottom: 16 },
  detailsCard: { borderRadius: 16, padding: 16, marginBottom: 16, gap: 8 },
  detail: { fontSize: 14 },
  joinContainer: { marginBottom: 24, gap: 10 },
  joinBtn: { backgroundColor: '#1D9E75', padding: 16, borderRadius: 12, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  pendingBtn: { backgroundColor: '#FAEEDA', padding: 16, borderRadius: 12, alignItems: 'center' },
  pendingBtnText: { color: '#BA7517', fontWeight: 'bold', fontSize: 15 },
  approvedBtn: { backgroundColor: '#E1F5EE', padding: 16, borderRadius: 12, alignItems: 'center' },
  approvedBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 15 },
  fullBtn: { backgroundColor: '#FCEBEB', padding: 16, borderRadius: 12, alignItems: 'center' },
  fullBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 15 },
  editBtn: { backgroundColor: '#EEEDFE', padding: 16, borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#534AB7', fontWeight: 'bold', fontSize: 15 },
  directionsBtn: { backgroundColor: '#E1F5EE', padding: 16, borderRadius: 12, alignItems: 'center' },
  directionsBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 15 },
  chatBtn: { backgroundColor: '#E6F1FB', padding: 16, borderRadius: 12, alignItems: 'center' },
  chatBtnText: { color: '#185FA5', fontWeight: 'bold', fontSize: 15 },
  participantsSection: { marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '500', marginBottom: 12 },
  noParticipants: { fontSize: 14 },
  participantRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 0.5, marginBottom: 8, gap: 12 },
  participantAvatar: { width: 44, height: 44, borderRadius: 22 },
  participantAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  participantAvatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  participantInfo: { flex: 1 },
  participantNickname: { fontSize: 14, fontWeight: '500' },
  participantName: { fontSize: 13 },
  participantArrow: { fontSize: 16 },
});