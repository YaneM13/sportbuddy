import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileTab() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ eventsCreated: 0, eventsJoined: 0, averageRating: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setLoading(false); setProfile(null); }
    });
  }, []);

  async function fetchProfile(userId: string) {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(profileData);
    const { count: eventsCreated } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('created_by', userId);
    const { count: eventsJoined } = await supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved');
    const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('rated_user', userId);
    const totalRatings = ratingsData?.length || 0;
    const averageRating = totalRatings > 0 ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;
    setStats({ eventsCreated: eventsCreated || 0, eventsJoined: eventsJoined || 0, averageRating: Math.round(averageRating * 10) / 10, totalRatings });
    setLoading(false);
  }

  const getInitials = (email: string) => email?.substring(0, 2).toUpperCase();
  const renderStars = (rating: number) => [1,2,3,4,5].map((star) => (
    <Text key={star} style={[styles.star, rating >= star && styles.starActive]}>★</Text>
  ));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.accent }]}>{t('myProfile')}</Text>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1D9E75" /></View>
      ) : !user ? (
        <View style={styles.centered}>
          <Text style={[styles.signInTitle, { color: colors.textSecondary }]}>Sign in to view your profile</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/login' as any)}>
            <Text style={styles.signInBtnText}>{t('signIn')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.profileHeader}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url + '?t=' + Date.now() }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user.email)}</Text></View>
            )}
            {profile?.nickname && <Text style={[styles.nickname, { color: colors.accent }]}>@{profile.nickname}</Text>}
            {profile?.first_name && <Text style={[styles.name, { color: colors.text }]}>{profile.first_name} {profile.last_name}</Text>}
            {profile?.city && <Text style={[styles.city, { color: colors.textSecondary }]}>📍 {profile.city}</Text>}
            <View style={styles.starsRow}>
              {renderStars(stats.averageRating)}
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {stats.averageRating > 0 ? `${stats.averageRating} (${stats.totalRatings} ratings)` : t('noRatingsYet')}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.eventsCreated}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('eventsCreated')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.eventsJoined}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('eventsJoinedStat')}</Text>
            </View>
          </View>

          {[
            { label: t('myEvents'), path: '/my-events' },
            { label: t('notifications'), path: '/notifications' },
            { label: t('settings'), path: '/settings' },
          ].map((item) => (
            <TouchableOpacity key={item.path} style={[styles.menuItem, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]} onPress={() => router.push(item.path as any)}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 60 },
  signInTitle: { fontSize: 18, fontWeight: '500', marginBottom: 24, textAlign: 'center' },
  signInBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  signInBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  nickname: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  name: { fontSize: 16, marginBottom: 4 },
  city: { fontSize: 14, marginBottom: 8 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 20, color: '#e0e0e0' },
  starActive: { color: '#FFB800' },
  ratingText: { fontSize: 13, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 13 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, borderWidth: 0.5, marginBottom: 12 },
  menuItemText: { fontSize: 15 },
  menuArrow: { fontSize: 16 },
});