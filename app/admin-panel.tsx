import BackButton from '@/components/BackButton';
import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminPanelScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'search'>('reports');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_admin) {
      Alert.alert('Access Denied', 'You do not have permission to view this page.');
      router.replace('/');
      return;
    }

    setIsAdmin(true);
    await fetchReports();
  }

  async function fetchReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      const reportsWithProfiles = await Promise.all((data || []).map(async (report) => {
        const { data: reportedProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, nickname')
          .eq('id', report.reported_user)
          .single();
        const { data: reporterProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, nickname')
          .eq('id', report.reported_by)
          .single();
        return { ...report, reported: reportedProfile, reporter: reporterProfile };
      }));
      setReports(reportsWithProfiles);
    }
    setLoading(false);
  }

  async function searchUsers(query: string) {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);

    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, nickname, avatar_url')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,nickname.ilike.%${query}%,id.eq.${query}`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  }

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
      <ActivityIndicator size="large" color="#1D9E75" />
    </View>
  );

  if (!isAdmin) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={[styles.title, { color: colors.text }]}>🛡️ Admin Panel</Text>

      <View style={[styles.tabs, { borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'reports' && styles.tabTextActive]}>
            🚩 Reports {reports.length > 0 && `(${reports.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'search' && styles.tabTextActive]}>
            🔍 Search Users
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'reports' && (
        <>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{reports.length} reports total</Text>
          {reports.length === 0 && (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reports yet</Text>
            </View>
          )}
          {reports.map((report) => {
            const reportedName = report.reported?.nickname
              ? `@${report.reported.nickname}`
              : report.reported?.first_name
              ? `${report.reported.first_name} ${report.reported.last_name}`
              : report.reported_user;

            const reporterName = report.reporter?.nickname
              ? `@${report.reporter.nickname}`
              : report.reporter?.first_name
              ? `${report.reporter.first_name} ${report.reporter.last_name}`
              : report.reported_by;

            return (
              <TouchableOpacity
                key={report.id}
                style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9', borderColor: colors.cardBorder }]}
                onPress={() => router.push({ pathname: '/admin-user-detail', params: { userId: report.reported_user, reportId: report.id } } as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.reasonBadge, { backgroundColor: isDark ? 'rgba(74,27,12,0.8)' : '#FAECE7' }]}>
                    <Text style={[styles.reasonText, { color: isDark ? '#F5C4B3' : '#993C1D' }]}>🚩 {report.reason}</Text>
                  </View>
                  <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.reportedUser, { color: colors.text }]}>
                  Reported: <Text style={{ color: '#E24B4A', fontWeight: 'bold' }}>{reportedName}</Text>
                </Text>
                <Text style={[styles.reporterUser, { color: colors.textSecondary }]}>By: {reporterName}</Text>
                <View style={styles.viewBtn}>
                  <Text style={styles.viewBtnText}>View Profile & Take Action →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {activeTab === 'search' && (
        <>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9', borderColor: colors.cardBorder }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name, nickname or ID..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={searchUsers}
              autoCapitalize="none"
            />
          </View>

          {searching && <ActivityIndicator size="small" color="#1D9E75" style={{ marginTop: 16 }} />}

          {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found</Text>
            </View>
          )}

          {searchResults.map((user) => {
            const displayName = user.nickname
              ? `@${user.nickname}`
              : user.first_name
              ? `${user.first_name} ${user.last_name}`
              : 'Unknown';

            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.userCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9', borderColor: colors.cardBorder }]}
                onPress={() => router.push({ pathname: '/admin-user-detail', params: { userId: user.id } } as any)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user.first_name ? user.first_name.substring(0, 2).toUpperCase() : '??'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
                  {user.nickname && user.first_name && (
                    <Text style={[styles.userFullName, { color: colors.textSecondary }]}>{user.first_name} {user.last_name}</Text>
                  )}
                  <Text style={[styles.userId, { color: colors.textSecondary }]}>{user.id}</Text>
                </View>
                <Text style={[styles.arrow, { color: colors.textSecondary }]}>→</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#1D9E75' },
  tabText: { fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reasonBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  reasonText: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12 },
  reportedUser: { fontSize: 15, marginBottom: 4 },
  reporterUser: { fontSize: 13, marginBottom: 12 },
  viewBtn: { backgroundColor: '#1D9E75', padding: 10, borderRadius: 10, alignItems: 'center' },
  viewBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 0.5, padding: 12, marginBottom: 16, gap: 8 },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: 15 },
  userCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 10, gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '500' },
  userFullName: { fontSize: 13 },
  userId: { fontSize: 10, marginTop: 2 },
  arrow: { fontSize: 16 },
});