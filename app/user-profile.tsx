import { useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REPORT_REASONS = [
  'Inappropriate behavior',
  'Harassment or bullying',
  'Fake profile',
  'Spam',
  'Hate speech',
  'Other',
];

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { isDark, colors } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ eventsCreated: 0, eventsJoined: 0, averageRating: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(profileData);
    const { count: eventsCreated } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('created_by', userId);
    const { count: eventsJoined } = await supabase.from('event_participants').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved');
    const { data: ratingsData } = await supabase.from('ratings').select('rating').eq('rated_user', userId);
    const totalRatings = ratingsData?.length || 0;
    const averageRating = totalRatings > 0 ? ratingsData!.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;
    setStats({ eventsCreated: eventsCreated || 0, eventsJoined: eventsJoined || 0, averageRating: Math.round(averageRating * 10) / 10, totalRatings });

    // Провери дали е блокиран
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: blockData } = await supabase.from('blocks').select('id').eq('blocked_by', session.user.id).eq('blocked_user', userId).single();
      setIsBlocked(!!blockData);
    }
    setLoading(false);
  }

  async function handleReport(reason: string) {
    if (!currentUser) return;
    setReporting(true);
    await supabase.from('reports').insert({
      reported_by: currentUser.id,
      reported_user: userId,
      reason,
    });
    setReporting(false);
    setShowReportModal(false);
    Alert.alert('✅ Reported', 'Thank you for your report. We will review it within 24 hours.');
  }

  async function handleBlock() {
    if (!currentUser) return;
    Alert.alert(
      isBlocked ? 'Unblock user?' : 'Block user?',
      isBlocked
        ? 'This user will be able to contact you again.'
        : 'This user will not be able to contact you and their content will be hidden.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: 'destructive',
          onPress: async () => {
            setBlocking(true);
            if (isBlocked) {
              await supabase.from('blocks').delete().eq('blocked_by', currentUser.id).eq('blocked_user', userId);
              setIsBlocked(false);
            } else {
              await supabase.from('blocks').insert({ blocked_by: currentUser.id, blocked_user: userId });
              setIsBlocked(true);
            }
            setBlocking(false);
          }
        }
      ]
    );
  }

  const renderStars = (rating: number) => [1,2,3,4,5].map((star) => (
    <Text key={star} style={[styles.star, rating >= star && styles.starActive]}>★</Text>
  ));

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.first_name ? profile.first_name.substring(0, 2).toUpperCase() : '??'}</Text>
          </View>
        )}
        {profile?.nickname && <Text style={[styles.nickname, { color: colors.accent }]}>@{profile.nickname}</Text>}
        {profile?.first_name && <Text style={[styles.name, { color: colors.text }]}>{profile.first_name} {profile.last_name}</Text>}
        {profile?.city && <Text style={[styles.city, { color: colors.textSecondary }]}>📍 {profile.city}</Text>}
        {profile?.favorite_sport && (
          <View style={[styles.favoriteSportBadge, { backgroundColor: isDark ? '#1E2D3D' : '#E1F5EE' }]}>
            <Text style={[styles.favoriteSportText, { color: colors.accent }]}>⭐ {profile.favorite_sport}</Text>
          </View>
        )}
        <View style={styles.starsRow}>
          {renderStars(stats.averageRating)}
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
            {stats.averageRating > 0 ? `${stats.averageRating} (${stats.totalRatings} ratings)` : 'No ratings yet'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.eventsCreated}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events created</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{stats.eventsJoined}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events joined</Text>
        </View>
      </View>

      {/* Report и Block копчиња */}
      {currentUser && currentUser.id !== userId && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.reportBtn, { borderColor: '#E24B4A' }]}
            onPress={() => setShowReportModal(true)}
          >
            <Text style={styles.reportBtnText}>🚩 Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.blockBtn, { borderColor: isBlocked ? '#1D9E75' : '#E24B4A' }]}
            onPress={handleBlock}
            disabled={blocking}
          >
            <Text style={[styles.blockBtnText, { color: isBlocked ? '#1D9E75' : '#E24B4A' }]}>
              {isBlocked ? '✅ Unblock' : '🚫 Block'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowReportModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🚩 Report User</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Select a reason for reporting:</Text>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonBtn, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}
                onPress={() => handleReport(reason)}
                disabled={reporting}
              >
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReportModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 17, fontWeight: '500' },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  nickname: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  city: { fontSize: 14, marginBottom: 8 },
  favoriteSportBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 99, marginBottom: 8 },
  favoriteSportText: { fontSize: 14, fontWeight: '600' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 20, color: '#e0e0e0' },
  starActive: { color: '#FFB800' },
  ratingText: { fontSize: 13, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  reportBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  reportBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 14 },
  blockBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  blockBtnText: { fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
  reasonBtn: { padding: 16, borderRadius: 12, marginBottom: 8 },
  reasonText: { fontSize: 15 },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#888', fontSize: 15 },
});