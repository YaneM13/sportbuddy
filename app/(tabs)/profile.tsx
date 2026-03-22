import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/useLanguage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileTab() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    eventsCreated: 0,
    eventsJoined: 0,
    averageRating: 0,
    totalRatings: 0,
  });
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
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setProfile(profileData);

    const { count: eventsCreated } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId);

    const { count: eventsJoined } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved');

    const { data: ratingsData } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_user', userId);

    const totalRatings = ratingsData?.length || 0;
    const averageRating = totalRatings > 0
      ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    setStats({
      eventsCreated: eventsCreated || 0,
      eventsJoined: eventsJoined || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
    });

    setLoading(false);
  }

  const getInitials = (email: string) => email?.substring(0, 2).toUpperCase();

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Text key={star} style={[styles.star, rating >= star && styles.starActive]}>★</Text>
    ));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.signInTitle}>Sign in to view your profile</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/login' as any)}>
          <Text style={styles.signInBtnText}>{t('signIn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('myProfile')}</Text>

      <View style={styles.profileHeader}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url + '?t=' + Date.now() }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.email)}</Text>
          </View>
        )}

        {profile?.nickname && (
          <Text style={styles.nickname}>@{profile.nickname}</Text>
        )}

        {profile?.first_name && (
          <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
        )}

        {profile?.city && (
          <Text style={styles.city}>📍 {profile.city}</Text>
        )}

        <View style={styles.starsRow}>
          {renderStars(stats.averageRating)}
          <Text style={styles.ratingText}>
            {stats.averageRating > 0 ? `${stats.averageRating} (${stats.totalRatings} ratings)` : t('noRatingsYet')}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.eventsCreated}</Text>
          <Text style={styles.statLabel}>{t('eventsCreated')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.eventsJoined}</Text>
          <Text style={styles.statLabel}>{t('eventsJoinedStat')}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-events' as any)}>
        <Text style={styles.menuItemText}>{t('myEvents')}</Text>
        <Text style={styles.menuArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications' as any)}>
        <Text style={styles.menuItemText}>{t('notifications')}</Text>
        <Text style={styles.menuArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
        <Text style={styles.menuItemText}>{t('settings')}</Text>
        <Text style={styles.menuArrow}>→</Text>
      </TouchableOpacity>
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
    padding: 24,
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  signInBtn: {
    backgroundColor: '#1D9E75',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 20,
    color: '#e0e0e0',
  },
  starActive: {
    color: '#FFB800',
  },
  ratingText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  menuArrow: {
    fontSize: 16,
    color: '#888',
  },
});