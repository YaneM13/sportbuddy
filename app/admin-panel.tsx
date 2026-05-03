import BackButton from '@/components/BackButton';
import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminPanelScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      .select(`
        *,
        reporter:profiles!reports_reported_by_fkey(first_name, last_name, nickname, email),
        reported:profiles!reports_reported_user_fkey(id, first_name, last_name, nickname, email, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback ако нема foreign key релации
      const { data: simpleData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      setReports(simpleData || []);
    } else {
      setReports(data || []);
    }
    setLoading(false);
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
            <Text style={[styles.reporterUser, { color: colors.textSecondary }]}>
              By: {reporterName}
            </Text>

            <View style={[styles.viewBtn]}>
              <Text style={styles.viewBtnText}>View Profile & Take Action →</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
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
});