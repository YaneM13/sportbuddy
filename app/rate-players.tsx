import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RatePlayersScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const { event_id } = useLocalSearchParams();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchParticipants(); }, []);

  async function fetchParticipants() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
    const { data, error } = await supabase.from('event_participants').select('*, users:user_id(email)').eq('event_id', event_id).eq('status', 'approved').neq('user_id', session.user.id);
    if (error) Alert.alert(t('error'), error.message);
    else setParticipants(data || []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (Object.keys(ratings).length === 0) { Alert.alert(t('error'), 'Please rate at least one player'); return; }
    setSubmitting(true);
    for (const [userId, rating] of Object.entries(ratings)) {
      await supabase.from('ratings').insert({ event_id, rated_by: user.id, rated_user: userId, rating });
    }
    setSubmitting(false);
    Alert.alert(t('success'), 'Ratings submitted!');
    router.back();
  }

  const StarRating = ({ userId }: { userId: string }) => (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRatings({ ...ratings, [userId]: star })}>
          <Text style={[styles.star, ratings[userId] >= star && styles.starActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? 'transparent' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  if (!loading && participants.length === 0) {
    const emptyContent = (
      <View style={[styles.centered, { backgroundColor: isDark ? 'transparent' : '#fff' }]}>
        <View style={[styles.emptyModal, { backgroundColor: isDark ? 'rgba(30,45,61,0.9)' : '#fff', borderColor: colors.cardBorder }]}>
          <Text style={styles.emptyModalEmoji}>👥</Text>
          <Text style={[styles.emptyModalTitle, { color: colors.text }]}>{t('noPlayersToRate')}</Text>
          <Text style={[styles.emptyModalText, { color: colors.textSecondary }]}>{t('noParticipantsToRate')}</Text>
          <TouchableOpacity style={styles.emptyModalBtn} onPress={() => router.back()}>
            <Text style={styles.emptyModalBtnText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
    if (isDark) return <ImageBackground source={require('../assets/images/sports-bg.png')} style={styles.bg} blurRadius={3}><View style={styles.overlay} />{emptyContent}</ImageBackground>;
    return emptyContent;
  }

  const content = (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.accent }]}>{t('ratePlayersTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Rate the players from this event</Text>

      {participants.map((participant) => (
        <View key={participant.id} style={[styles.card, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff', borderColor: colors.cardBorder }]}>
          <View style={styles.playerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{participant.users?.email?.substring(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={[styles.playerEmail, { color: colors.text }]}>{participant.users?.email}</Text>
          </View>
          <StarRating userId={participant.user_id} />
        </View>
      ))}

      {participants.length > 0 && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? t('saving') : t('submitRatings')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  if (isDark) {
    return (
      <ImageBackground source={require('../assets/images/sports-bg.png')} style={styles.bg} blurRadius={3}>
        <View style={styles.overlay} />
        {content}
      </ImageBackground>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,26,18,0.82)' },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  playerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  playerEmail: { fontSize: 14, flex: 1 },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32, color: '#e0e0e0' },
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