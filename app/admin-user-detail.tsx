import BackButton from '@/components/BackButton';
import { useTheme } from '@/lib/AppContext';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminUserDetailScreen() {
  const { isDark, colors } = useTheme();
  const { userId, reportId } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(profileData);

    if (reportId) {
      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
      setReport(reportData);
    }
    setLoading(false);
  }

  async function sendWarning() {
    if (!message.trim()) { Alert.alert('Error', 'Please enter a message'); return; }
    setSending(true);
    try {
      await supabase.from('admin_messages').insert({
        to_user_id: userId,
        message: message.trim(),
      });

      if (profile?.push_token) {
        await sendPushNotification(
          profile.push_token,
          '⚠️ Warning from SportBuddy',
          message.trim()
        );
      }

      if (reportId) {
        await supabase.from('reports').delete().eq('id', reportId);
      }

      Alert.alert('✅ Warning Sent', 'The user has been notified and the report has been removed.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send warning.');
    }
    setSending(false);
  }

  async function banUser() {
    Alert.alert(
      '🚫 Ban User',
      'To ban this user, go to Supabase → Authentication → Users and click "Ban user".\n\nEmail: ' + (profile?.email || 'Unknown'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Report',
          onPress: async () => {
            if (reportId) {
              await supabase.from('reports').delete().eq('id', reportId);
              Alert.alert('✅ Done', 'Report deleted.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            }
          }
        }
      ]
    );
  }

  async function deleteUser() {
    Alert.alert(
      '🗑️ Delete User',
      'This will permanently delete the user and ALL their data. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_user_completely', {
              target_user_id: userId
            });
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('✅ Done', 'User and all data permanently deleted.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            }
          }
        }
      ]
    );
  }

  async function ignoreReport() {
    Alert.alert(
      '✅ Ignore Report',
      'Are you sure this report is not valid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore & Delete',
          onPress: async () => {
            if (reportId) {
              await supabase.from('reports').delete().eq('id', reportId);
              Alert.alert('✅ Report Ignored', 'The report has been removed.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            }
          }
        }
      ]
    );
  }

  if (loading) return (
    <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
      <ActivityIndicator size="large" color="#1D9E75" />
    </View>
  );

  const displayName = profile?.nickname
    ? `@${profile.nickname}`
    : profile?.first_name
    ? `${profile.first_name} ${profile.last_name}`
    : 'Unknown User';

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content}>
      <BackButton />
      <Text style={[styles.title, { color: colors.text }]}>🛡️ User Review</Text>

      {/* Профил */}
      <View style={[styles.profileCard, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile?.first_name ? profile.first_name.substring(0, 2).toUpperCase() : '??'}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        {profile?.email && <Text style={[styles.email, { color: colors.textSecondary }]}>{profile.email}</Text>}
        {profile?.city && <Text style={[styles.bio, { color: colors.textSecondary }]}>📍 {profile.city}</Text>}
        {profile?.favorite_sport && <Text style={[styles.bio, { color: colors.textSecondary }]}>⭐ {profile.favorite_sport}</Text>}
      </View>

      {/* Репорт детали */}
      {report && (
        <View style={[styles.reportCard, { backgroundColor: isDark ? 'rgba(74,27,12,0.3)' : '#FAECE7' }]}>
          <Text style={[styles.reportTitle, { color: isDark ? '#F5C4B3' : '#993C1D' }]}>🚩 Report Details</Text>
          <Text style={[styles.reportReason, { color: colors.text }]}>Reason: <Text style={{ fontWeight: 'bold' }}>{report.reason}</Text></Text>
          <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
            Date: {new Date(report.created_at).toLocaleString()}
          </Text>
        </View>
      )}

      {/* Испрати предупредување */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Send Warning</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#0F1923' : '#fff', color: colors.text, borderColor: colors.cardBorder }]}
          placeholder="Type warning message..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
        <TouchableOpacity
          style={[styles.warnBtn, sending && { opacity: 0.6 }]}
          onPress={sendWarning}
          disabled={sending}
        >
          <Text style={styles.warnBtnText}>{sending ? 'Sending...' : '⚠️ Send Warning & Close Report'}</Text>
        </TouchableOpacity>
      </View>

      {/* Бан */}
      <TouchableOpacity style={styles.banBtn} onPress={banUser}>
        <Text style={styles.banBtnText}>🚫 Ban This User</Text>
      </TouchableOpacity>

      {/* Избриши */}
      <TouchableOpacity style={styles.deleteBtn} onPress={deleteUser}>
        <Text style={styles.deleteBtnText}>🗑️ Delete User Permanently</Text>
      </TouchableOpacity>

      {/* Игнорирај — само ако има репорт */}
      {reportId && (
        <TouchableOpacity style={styles.ignoreBtn} onPress={ignoreReport}>
          <Text style={styles.ignoreBtnText}>✅ Ignore Report</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  profileCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 4 },
  bio: { fontSize: 13, textAlign: 'center' },
  reportCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  reportTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  reportReason: { fontSize: 14, marginBottom: 4 },
  reportDate: { fontSize: 12 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  input: { borderRadius: 12, borderWidth: 0.5, padding: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  warnBtn: { backgroundColor: '#BA7517', padding: 14, borderRadius: 12, alignItems: 'center' },
  warnBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  banBtn: { backgroundColor: '#FCEBEB', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  banBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 15 },
  deleteBtn: { backgroundColor: '#E24B4A', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  ignoreBtn: { backgroundColor: '#E1F5EE', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  ignoreBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 15 },
});