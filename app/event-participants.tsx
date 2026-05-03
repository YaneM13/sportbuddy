import BackButton from '@/components/BackButton';
import { useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EventParticipantsScreen() {
  const { isDark, colors } = useTheme();
  const { event_id } = useLocalSearchParams();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    const { data, error } = await supabase
      .from('event_participants')
      .select('*, profiles(id, first_name, last_name, nickname, avatar_url)')
      .eq('event_id', event_id)
      .eq('status', 'approved');

    setParticipants(data || []);
    setLoading(false);
  }

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
      <ActivityIndicator size="large" color="#1D9E75" />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={[styles.title, { color: colors.text }]}>👥 Participants ({participants.length})</Text>

      {participants.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No approved participants yet</Text>
      ) : (
        participants.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.row, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}
            onPress={() => router.push({ pathname: '/user-profile', params: { userId: p.profiles?.id } } as any)}
          >
            {p.profiles?.avatar_url ? (
              <Image source={{ uri: p.profiles.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {p.profiles?.first_name ? p.profiles.first_name.substring(0, 2).toUpperCase() : '??'}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              {p.profiles?.nickname && (
                <Text style={[styles.nickname, { color: colors.accent }]}>@{p.profiles.nickname}</Text>
              )}
              {p.profiles?.first_name && (
                <Text style={[styles.name, { color: colors.text }]}>{p.profiles.first_name} {p.profiles.last_name}</Text>
              )}
            </View>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 0.5, marginBottom: 8, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1 },
  nickname: { fontSize: 14, fontWeight: '500' },
  name: { fontSize: 13 },
  arrow: { fontSize: 16 },
});