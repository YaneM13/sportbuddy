import BackButton from '@/components/BackButton';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [joinStatus, setJoinStatus] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    fetchEventDetails();
  }, []);

  async function fetchEventDetails() {
    const { data: { session } } = await supabase.auth.getSession();

    const { data: eventData, error } = await supabase
      .from('events_with_counts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    setEvent(eventData);

    const { data: participantsData } = await supabase
      .from('event_participants')
      .select('*, profiles(first_name, last_name, nickname, avatar_url)')
      .eq('event_id', id)
      .eq('status', 'approved');

    setParticipants(participantsData || []);

    if (session) {
      const { data: myParticipation } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', id)
        .eq('user_id', session.user.id)
        .single();

      setJoinStatus(myParticipation?.status || null);
    }

    setLoading(false);
  }

  async function handleJoin() {
    if (!user) {
      Alert.alert('Sign in required', 'You must be signed in to join an event');
      return;
    }

    const { data: participant, error } = await supabase
      .from('event_participants')
      .insert({ event_id: id, user_id: user.id, status: 'pending' })
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await supabase.from('notifications').insert({
      user_id: event.created_by,
      event_id: id,
      participant_id: participant.id,
      message: `${user.email} wants to join your event!`,
    });

    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', event.created_by)
      .single();

    if (creatorProfile?.push_token) {
      await sendPushNotification(
        creatorProfile.push_token,
        'New join request!',
        `${user.email} wants to join your event!`
      );
    }

    setJoinStatus('pending');
    Alert.alert('Request sent', 'The organiser will review your request!');
  }

  function handleDirections() {
    if (!event?.latitude || !event?.longitude) {
      Alert.alert('Error', 'Location not available for this event');
      return;
    }
    const lat = event.latitude;
    const lon = event.longitude;
    const label = encodeURIComponent(event.location);
    const url = Platform.OS === 'ios'
      ? `maps://?q=${label}&ll=${lat},${lon}`
      : `google.navigation:q=${lat},${lon}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
    });
  }

  const renderJoinButton = () => {
    const isOwner = user && user.id === event?.created_by;
    const isFull = event?.max_players && event?.approved_count >= event?.max_players;

    if (isOwner) {
      return (
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push({ pathname: '/edit-event', params: { id: event.id } } as any)}
        >
          <Text style={styles.editBtnText}>Edit event</Text>
        </TouchableOpacity>
      );
    }

    if (joinStatus === 'approved') {
      return (
        <View style={styles.approvedBtn}>
          <Text style={styles.approvedBtnText}>✅ Already joined</Text>
        </View>
      );
    }

    if (joinStatus === 'pending') {
      return (
        <View style={styles.pendingBtn}>
          <Text style={styles.pendingBtnText}>⏳ Waiting for approval</Text>
        </View>
      );
    }

    if (isFull) {
      return (
        <View style={styles.fullBtn}>
          <Text style={styles.fullBtnText}>🔴 Event is full</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
        <Text style={styles.joinBtnText}>Join event</Text>
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

  const isParticipant = joinStatus === 'approved' || (user && user.id === event?.created_by);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton />

      <Text style={styles.title}>{event?.title}</Text>

      {event?.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}

      <View style={styles.detailsCard}>
        <Text style={styles.detail}>🏆 {event?.sport}</Text>
        <Text style={styles.detail}>📍 {event?.location}</Text>
        <Text style={styles.detail}>📅 {event?.date} at {event?.time} — {event?.end_time}</Text>
        {event?.skill_level && <Text style={styles.detail}>⭐ {event?.skill_level}</Text>}
        {event?.max_players ? (
          <Text style={styles.detail}>👥 {event?.approved_count || 0} / {event?.max_players} players</Text>
        ) : (
          <Text style={styles.detail}>👥 Unlimited participants</Text>
        )}
      </View>

      <View style={styles.joinContainer}>
        {renderJoinButton()}

        {isParticipant && (
          <TouchableOpacity style={styles.directionsBtn} onPress={handleDirections}>
            <Text style={styles.directionsBtnText}>🗺️ Get directions</Text>
          </TouchableOpacity>
        )}

        {isParticipant && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push({ pathname: '/event-chat', params: { event_id: event?.id, event_title: event?.title } } as any)}
          >
            <Text style={styles.chatBtnText}>💬 Group chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {isParticipant && (
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
          {participants.length === 0 ? (
            <Text style={styles.noParticipants}>No approved participants yet</Text>
          ) : (
            participants.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.participantRow}
                onPress={() => router.push({ pathname: '/user-profile', params: { userId: p.user_id } } as any)}
              >
                {p.profiles?.avatar_url ? (
                  <Image source={{ uri: p.profiles.avatar_url }} style={styles.participantAvatar} />
                ) : (
                  <View style={styles.participantAvatarPlaceholder}>
                    <Text style={styles.participantAvatarText}>
                      {p.profiles?.first_name ? p.profiles.first_name.substring(0, 2).toUpperCase() : '??'}
                    </Text>
                  </View>
                )}
                <View style={styles.participantInfo}>
                  {p.profiles?.nickname && (
                    <Text style={styles.participantNickname}>@{p.profiles.nickname}</Text>
                  )}
                  {p.profiles?.first_name && (
                    <Text style={styles.participantName}>{p.profiles.first_name} {p.profiles.last_name}</Text>
                  )}
                </View>
                <Text style={styles.participantArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  detail: {
    fontSize: 14,
    color: '#444',
  },
  joinContainer: {
    marginBottom: 24,
    gap: 10,
  },
  joinBtn: {
    backgroundColor: '#1D9E75',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pendingBtn: {
    backgroundColor: '#FAEEDA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pendingBtnText: {
    color: '#BA7517',
    fontWeight: 'bold',
    fontSize: 15,
  },
  approvedBtn: {
    backgroundColor: '#E1F5EE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  approvedBtnText: {
    color: '#0F6E56',
    fontWeight: 'bold',
    fontSize: 15,
  },
  fullBtn: {
    backgroundColor: '#FCEBEB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullBtnText: {
    color: '#E24B4A',
    fontWeight: 'bold',
    fontSize: 15,
  },
  editBtn: {
    backgroundColor: '#EEEDFE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#534AB7',
    fontWeight: 'bold',
    fontSize: 15,
  },
  directionsBtn: {
    backgroundColor: '#E1F5EE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  directionsBtnText: {
    color: '#0F6E56',
    fontWeight: 'bold',
    fontSize: 15,
  },
  chatBtn: {
    backgroundColor: '#E6F1FB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#185FA5',
    fontWeight: 'bold',
    fontSize: 15,
  },
  participantsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  noParticipants: {
    fontSize: 14,
    color: '#888',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    gap: 12,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  participantAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantInfo: {
    flex: 1,
  },
  participantNickname: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D9E75',
  },
  participantName: {
    fontSize: 13,
    color: '#888',
  },
  participantArrow: {
    fontSize: 16,
    color: '#888',
  },
});