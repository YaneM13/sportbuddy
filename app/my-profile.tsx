import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MyProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [stats, setStats] = useState({
    eventsCreated: 0,
    eventsJoined: 0,
    averageRating: 0,
    totalRatings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.back();
      return;
    }
    setUser(session.user);

    const { count: eventsCreated } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', session.user.id);

    const { count: eventsJoined } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('status', 'approved');

    const { data: ratingsData } = await supabase
      .from('ratings')
      .select('rating')
      .eq('rated_user', session.user.id);

    const totalRatings = ratingsData?.length || 0;
    const averageRating = totalRatings > 0
      ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', session.user.id)
      .single();

    if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url + '?t=' + Date.now());

    setStats({
      eventsCreated: eventsCreated || 0,
      eventsJoined: eventsJoined || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
    });

    setLoading(false);
  }

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user ? getInitials(user.email) : ''}</Text>
          </View>
        )}
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.starsRow}>
          {renderStars(stats.averageRating)}
          <Text style={styles.ratingText}>
            {stats.averageRating > 0 ? `${stats.averageRating} (${stats.totalRatings} ratings)` : 'No ratings yet'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.eventsCreated}</Text>
          <Text style={styles.statLabel}>Events created</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.eventsJoined}</Text>
          <Text style={styles.statLabel}>Events joined</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-events' as any)}>
        <Text style={styles.menuItemText}>My events</Text>
        <Text style={styles.menuArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications' as any)}>
        <Text style={styles.menuItemText}>Notifications</Text>
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
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
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
  email: {
    fontSize: 16,
    color: '#1a1a1a',
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