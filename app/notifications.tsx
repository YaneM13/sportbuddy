import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'messages'>('requests');

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*, events(title, id), event_participants(user_id)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) Alert.alert(t('error'), error.message);
    else {
      const requests = (data || []).filter((n: any) => n.participant_id);
      const msgs = (data || []).filter((n: any) => !n.participant_id);
      setJoinRequests(requests);
      setMessages(msgs);
    }
    setLoading(false);
    setRefreshing(false);
  }

  async function handleApprove(notification: any) {
    const { error } = await supabase
      .from('event_participants')
      .update({ status: 'approved' })
      .eq('id', notification.participant_id);
    if (error) { Alert.alert(t('error'), error.message); return; }
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    Alert.alert(t('success'), 'Player has been approved!');
    fetchNotifications();
  }

  async function handleReject(notification: any) {
    const { error } = await supabase
      .from('event_participants')
      .update({ status: 'rejected' })
      .eq('id', notification.participant_id);
    if (error) { Alert.alert(t('error'), error.message); return; }
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    Alert.alert(t('success'), 'Player has been rejected!');
    fetchNotifications();
  }

  const content = (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent }]}>{t('notifications')}</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1D9E75" />
        </View>
      ) : (
        <>
          <View style={[styles.tabs, { borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.tab, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff' }, activeTab === 'requests' && styles.tabActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'requests' && styles.tabTextActive]}>
                {t('joinRequests')} {joinRequests.filter(n => !n.is_read).length > 0 && `(${joinRequests.filter(n => !n.is_read).length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff' }, activeTab === 'messages' && styles.tabActive]}
              onPress={() => setActiveTab('messages')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'messages' && styles.tabTextActive]}>
                {t('messages')} {messages.filter(n => !n.is_read).length > 0 && `(${messages.filter(n => !n.is_read).length})`}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'requests' && (
            <>
              {joinRequests.length === 0 && (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No join requests yet</Text>
                </View>
              )}
              {joinRequests.map((notif) => (
                <View key={notif.id} style={[styles.card, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff', borderColor: colors.cardBorder }, notif.is_read && { opacity: 0.6 }]}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { userId: notif.event_participants?.user_id } } as any)}>
                    <Text style={[styles.cardMessage, { color: colors.text }]}>{notif.message}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.cardEvent, { color: colors.textSecondary }]}>Event: {notif.events?.title}</Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(notif.created_at).toLocaleDateString()}</Text>
                  {!notif.is_read && (
                    <View style={styles.actions}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(notif)}>
                        <Text style={styles.approveBtnText}>{t('approve')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(notif)}>
                        <Text style={styles.rejectBtnText}>{t('reject')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {notif.is_read && (
                    <View style={[styles.statusContainer, { backgroundColor: isDark ? 'rgba(30,45,61,0.5)' : '#F1EFE8' }]}>
                      <Text style={[styles.statusText, { color: colors.textSecondary }]}>{t('reviewed')}</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {activeTab === 'messages' && (
            <>
              {messages.length === 0 && (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet</Text>
                </View>
              )}
              {messages.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.card, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff', borderColor: colors.cardBorder }, notif.is_read && { opacity: 0.6 }]}
                  onPress={() => router.push({ pathname: '/event-chat', params: { event_id: notif.event_id, event_title: notif.events?.title } } as any)}
                >
                  <Text style={[styles.cardMessage, { color: colors.text }]}>{notif.message}</Text>
                  <Text style={[styles.cardEvent, { color: colors.textSecondary }]}>Event: {notif.events?.title}</Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(notif.created_at).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );

  if (isDark) {
    return (
      <ImageBackground
        source={require('../assets/images/sports-bg.png')}
        style={styles.bg}
        blurRadius={3}
      >
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#1D9E75' },
  tabText: { fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  cardMessage: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  cardEvent: { fontSize: 13, marginBottom: 4 },
  cardTime: { fontSize: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#E1F5EE', padding: 12, borderRadius: 12, alignItems: 'center' },
  approveBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#FCEBEB', padding: 12, borderRadius: 12, alignItems: 'center' },
  rejectBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 14 },
  statusContainer: { padding: 8, borderRadius: 8, alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '500' },
});