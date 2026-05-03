import BackButton from '@/components/BackButton';
import { useTheme } from '@/lib/AppContext';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
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
      // Зачувај порака во admin_messages
      await supabase.from('admin_messages').insert({
        to_user_id: userId,
        message: message.trim(),
      });

      // Испрати push notification ако корисникот има токен
      if (profile?.push_token) {
        await sendPushNotification(
          profile.push_token,
          '⚠️ Warning from SportBuddy',
          message.trim()
        );
      }

      Alert.alert('✅ Warning Sent', 'The user has been notified.');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send warning.');
    }

    setSending(false);
  }

  function openBanInstructions() {
    Alert.alert(
      'Ban User',
      'To ban this user, go to Supabase → Authentication → Users, find this user and click "Ban user".\n\nUser email: ' + (profile?.email || 'Unknown'),
      [{ text: 'OK' }]
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
        {profile?.bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>}
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
          <Text style={styles.warnBtnText}>{sending ? 'Sending...' : '⚠️ Send Warning'}</Text>
        </TouchableOpacity>
      </View>

      {/* Бан */}
      <TouchableOpacity style={styles.banBtn} onPress={openBanInstructions}>
        <Text style={styles.banBtnText}>🚫 Ban This User</Text>
      </TouchableOpacity>

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
  email: { fontSize: 14, marginBottom: 8 },
  bio: { fontSize: 13, textAlign: 'center', fontStyle: 'italic' },
  reportCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  reportTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  reportReason: { fontSize: 14, marginBottom: 4 },
  reportDate: { fontSize: 12 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  input: { borderRadius: 12, borderWidth: 0.5, padding: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  warnBtn: { backgroundColor: '#BA7517', padding: 14, borderRadius: 12, alignItems: 'center' },
  warnBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  banBtn: { backgroundColor: '#FCEBEB', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  banBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 15 },
});