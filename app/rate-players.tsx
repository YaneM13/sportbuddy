import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RatePlayersScreen() {
  const { event_id } = useLocalSearchParams();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);

    const { data, error } = await supabase
      .from('event_participants')
      .select('*, users:user_id(email)')
      .eq('event_id', event_id)
      .eq('status', 'approved')
      .neq('user_id', session.user.id);

    if (error) Alert.alert('Error', error.message);
    else setParticipants(data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (Object.keys(ratings).length === 0) {
      Alert.alert('Error', 'Please rate at least one player');
      return;
    }

    setSubmitting(true);
    for (const [userId, rating] of Object.entries(ratings)) {
      await supabase.from('ratings').insert({
        event_id,
        rated_by: user.id,
        rated_user: userId,
        rating,
      });
    }
    setSubmitting(false);
    Alert.alert('Success', 'Ratings submitted!');
    router.back();
  }

  const StarRating = ({ userId }: { userId: string }) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRatings({ ...ratings, [userId]: star })}>
            <Text style={[styles.star, ratings[userId] >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }
  if (!loading && participants.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyModal}>
          <Text style={styles.emptyModalEmoji}>👥</Text>
          <Text style={styles.emptyModalTitle}>No players to rate</Text>
          <Text style={styles.emptyModalText}>There are no approved participants for this event.</Text>
          <TouchableOpacity style={styles.emptyModalBtn} onPress={() => router.back()}>
            <Text style={styles.emptyModalBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Rate players</Text>
      <Text style={styles.subtitle}>Rate the players from this event</Text>

      {participants.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No players to rate</Text>
        </View>
      )}

      {participants.map((participant) => (
        <View key={participant.id} style={styles.card}>
          <View style={styles.playerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {participant.users?.email?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.playerEmail}>{participant.users?.email}</Text>
          </View>
          <StarRating userId={participant.user_id} />
        </View>
      ))}

      {participants.length > 0 && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit ratings'}</Text>
        </TouchableOpacity>
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
    fontSize: 16,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    padding: 16,
    marginBottom: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerEmail: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: 32,
    color: '#e0e0e0',
  },
  starActive: {
    color: '#FFB800',
  },
  submitBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    margin: 24,
  },
  emptyModalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyModalText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyModalBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyModalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});