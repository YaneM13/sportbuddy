import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CRITERIA = [
  { key: 'friendly', label: '😊 Friendly' },
  { key: 'communication', label: '💬 Communication' },
  { key: 'fairplay', label: '🤝 Fair Play' },
  { key: 'professionalism', label: '🏆 Professionalism' },
];

export default function RatePlayersScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const { event_id } = useLocalSearchParams();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<{ [key: string]: { [criterion: string]: number } }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchParticipants(); }, []);

  async function fetchParticipants() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
    const { data, error } = await supabase.from('event_participants').select('*').eq('event_id', event_id).eq('status', 'approved').neq('user_id', session.user.id);
    if (error) { Alert.alert(t('error'), error.message); setLoading(false); return; }
    const participantsWithProfiles = await Promise.all(
      (data || []).map(async (participant: any) => {
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name, nickname, avatar_url').eq('id', participant.user_id).single();
        return { ...participant, profile };
      })
    );
    setParticipants(participantsWithProfiles);
    setLoading(false);
  }

  function setRating(userId: string, criterion: string, value: number) {
    setRatings(prev => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [criterion]: value }
    }));
  }

  function getAverageRating(userId: string): number {
    const userRatings = ratings[userId];
    if (!userRatings) return 0;
    const values = Object.values(userRatings);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  async function handleSubmit() {
    if (Object.keys(ratings).length === 0) { Alert.alert(t('error'), 'Please rate at least one player'); return; }
    setSubmitting(true);
    for (const [userId] of Object.entries(ratings)) {
      const avg = getAverageRating(userId);
      if (avg > 0) {
        await supabase.from('ratings').insert({ event_id, rated_by: user.id, rated_user: userId, rating: Math.round(avg * 10) / 10 });
      }
    }
    setSubmitting(false);
    Alert.alert(t('success'), 'Ratings submitted!');
    router.back();
  }

  const StarRating = ({ userId, criterion }: { userId: string, criterion: string }) => {
    const value = ratings[userId]?.[criterion] || 0;
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(userId, criterion, star)}>
            <Text style={[styles.star, value >= star && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  if (!loading && participants.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
        <View style={[styles.emptyModal, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
          <Text style={styles.emptyModalEmoji}>👥</Text>
          <Text style={[styles.emptyModalTitle, { color: colors.text }]}>{t('noPlayersToRate')}</Text>
          <Text style={[styles.emptyModalText, { color: colors.textSecondary }]}>{t('noParticipantsToRate')}</Text>
          <TouchableOpacity style={styles.emptyModalBtn} onPress={() => router.back()}>
            <Text style={styles.emptyModalBtnText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.accent }]}>{t('ratePlayersTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Rate the players from this event</Text>

      {participants.map((participant) => (
        <View key={participant.id} style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
          <View style={styles.playerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {participant.profile?.nickname?.substring(0, 2).toUpperCase() ||
                 participant.profile?.first_name?.substring(0, 2).toUpperCase() || '??'}
              </Text>
            </View>
            <Text style={[styles.playerName, { color: colors.text }]}>
              {participant.profile?.nickname
                ? `@${participant.profile.nickname}`
                : `${participant.profile?.first_name || ''} ${participant.profile?.last_name || ''}`.trim() || 'Unknown'}
            </Text>
          </View>

          {CRITERIA.map((criterion) => (
            <View key={criterion.key} style={styles.criterionRow}>
              <Text style={[styles.criterionLabel, { color: colors.textSecondary }]}>{criterion.label}</Text>
              <StarRating userId={participant.user_id} criterion={criterion.key} />
            </View>
          ))}
        </View>
      ))}

      {participants.length > 0 && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? t('saving') : t('submitRatings')}</Text>
        </TouchableOpacity>
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
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  playerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  playerName: { fontSize: 14, flex: 1, fontWeight: '500' },
  criterionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  criterionLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  stars: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 24, color: '#e0e0e0' },
  starActive: { color: '#FFB800' },
  submitBtn: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8, marginBottom: 40 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  emptyModal: { borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 0.5, margin: 24 },
  emptyModalEmoji: { fontSize: 48, marginBottom: 16 },
  emptyModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  emptyModalText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyModalBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyModalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});