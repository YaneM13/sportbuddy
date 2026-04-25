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
  const [alreadyRated, setAlreadyRated] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [eventFinished, setEventFinished] = useState(false);

  useEffect(() => { fetchParticipants(); }, []);

  async function fetchParticipants() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);

    const { data: eventData } = await supabase.from('events').select('status').eq('id', event_id).single();
    if (eventData?.status !== 'finished') {
      setEventFinished(false);
      setLoading(false);
      return;
    }
    setEventFinished(true);

    // Земи веќе оценети играчи на БИЛО КОЈ евент
    const { data: existingRatings } = await supabase
      .from('ratings')
      .select('rated_user')
      .eq('rated_by', session.user.id);
    setAlreadyRated((existingRatings || []).map((r: any) => r.rated_user));

    const { data, error } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', event_id)
      .eq('status', 'approved')
      .neq('user_id', session.user.id);
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
    setRatings(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), [criterion]: value } }));
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
      if (alreadyRated.includes(userId)) continue;
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
    const isRated = alreadyRated.includes(userId);
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => !isRated && setRating(userId, criterion, star)} disabled={isRated}>
            <Text style={[styles.star, value >= star && styles.starActive, isRated && styles.starDisabled]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  if (!eventFinished) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
        <View style={[styles.emptyModal, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
          <Text style={styles.emptyModalEmoji}>⏳</Text>
          <Text style={[styles.emptyModalTitle, { color: colors.text }]}>Event not finished yet</Text>
          <Text style={[styles.emptyModalText, { color: colors.textSecondary }]}>You can rate players only after the event has finished.</Text>
          <TouchableOpacity style={styles.emptyModalBtn} onPress={() => router.back()}>
            <Text style={styles.emptyModalBtnText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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

      {participants.map((participant) => {
        const isRated = alreadyRated.includes(participant.user_id);
        const fullName = `${participant.profile?.first_name || ''} ${participant.profile?.last_name || ''}`.trim();
        const displayName = participant.profile?.nickname
          ? `@${participant.profile.nickname} — ${fullName}`
          : fullName || 'Unknown';

        return (
          <View key={participant.id} style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }, isRated && { opacity: 0.6 }]}>
            <View style={styles.playerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {participant.profile?.first_name?.substring(0, 2).toUpperCase() || '??'}
                </Text>
              </View>
              <View>
                <Text style={[styles.playerName, { color: colors.text }]}>{displayName}</Text>
                {isRated && <Text style={[styles.alreadyRatedText, { color: colors.textSecondary }]}>Already rated ✓</Text>}
              </View>
            </View>

            {!isRated && CRITERIA.map((criterion) => (
              <View key={criterion.key} style={styles.criterionRow}>
                <Text style={[styles.criterionLabel, { color: colors.textSecondary }]}>{criterion.label}</Text>
                <StarRating userId={participant.user_id} criterion={criterion.key} />
              </View>
            ))}
          </View>
        );
      })}

      {participants.some(p => !alreadyRated.includes(p.user_id)) && (
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
  playerName: { fontSize: 14, fontWeight: '500' },
  alreadyRatedText: { fontSize: 12, marginTop: 2 },
  criterionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  criterionLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  stars: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 24, color: '#e0e0e0' },
  starActive: { color: '#FFB800' },
  starDisabled: { color: '#ccc' },
  submitBtn: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8, marginBottom: 40 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  emptyModal: { borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 0.5, margin: 24 },
  emptyModalEmoji: { fontSize: 48, marginBottom: 16 },
  emptyModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  emptyModalText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyModalBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyModalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});