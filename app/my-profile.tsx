import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/useTheme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyProfileScreen() {
  const { isDark, colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [stats, setStats] = useState({ eventsCreated: 0, eventsJoined: 0, averageRating: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.back(); return; }
    setUser(session.user);
    const { count: eventsCreated } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('created_by', session.user.id);
    const { count: eventsJoined } = await supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('status', 'approved');
    const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('rated_user', session.user.id);
    const totalRatings = ratingsData?.length || 0;
    const averageRating = totalRatings > 0 ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;
    const { data: profileData } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
    if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url + '?t=' + Date.now());
    setStats({ eventsCreated: eventsCreated || 0, eventsJoined: eventsJoined || 0, averageRating: Math.round(averageRating * 10) / 10, totalRatings });
    setLoading(false);
  }

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();
  const renderStars = (rating: number) => [1,2,3,4,5].map((star) => (
    <Text key={star} style={[styles.star, rating >= star && styles.starActive]}>★</Text>
  ));

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? 'transparent' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  const content = (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user ? getInitials(user.email) : ''}</Text>
          </View>
        )}
        <Text style={[styles.email, { color: colors.text }]}>{user?.email}</Text>
        <View style={styles.starsRow}>
          {renderStars(stats.averageRating)}
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
            {stats.averageRating > 0 ? `${stats.averageRating} (${stats.totalRatings} ratings)` : 'No ratings yet'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#F9F9F9' }]}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.eventsCreated}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events created</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#F9F9F9' }]}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.eventsJoined}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events joined</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.menuItem, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff', borderColor: colors.cardBorder }]} onPress={() => router.push('/my-events' as any)}>
        <Text style={[styles.menuItemText, { color: colors.text }]}>My events</Text>
        <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.menuItem, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff', borderColor: colors.cardBorder }]} onPress={() => router.push('/notifications' as any)}>
        <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
        <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
      </TouchableOpacity>
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
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 17, fontWeight: '500' },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 16, marginBottom: 8 },
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