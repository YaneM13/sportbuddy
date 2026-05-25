import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'messages' | 'admin'>('requests');
  const [userId, setUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      await fetchNotifications(session.user.id);
    }
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channelName = `notifications-${userId}`;

    const subscription = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotif = payload.new as any;
        if (newNotif.participant_id) {
          setJoinRequests(prev => [newNotif, ...prev]);
        } else {
          setMessages(prev => [newNotif, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => { fetchNotifications(userId); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_messages',
        filter: `to_user_id=eq.${userId}`
      }, (payload) => {
        setAdminMessages(prev => [payload.new as any, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [userId]);

  useFocusEffect(useCallback(() => {
    if (userId && !joinRequests.length && !messages.length) {
      fetchNotifications(userId);
    }
  }, [userId]));

  async function fetchNotifications(uid?: string) {
    const id = uid || userId;
    if (!id) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*, events(title, id)')
      .eq('user_id', id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) Alert.alert(t('error'), error.message);
    else {
      setJoinRequests((data || []).filter((n: any) => n.participant_id));
      setMessages((data || []).filter((n: any) => !n.participant_id));
    }

    const { data: adminData } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('to_user_id', id)
      .order('created_at', { ascending: false });

    setAdminMessages(adminData || []);
    setLoading(false);
    setRefreshing(false);
  }

  async function handleApprove(notification: any) {
    if (processingId) return;
    setProcessingId(notification.id + '_approve');
    const { data: eventData } = await supabase.from('events').select('max_players, approved_count').eq('id', notification.event_id).single();
    if (eventData?.max_players && eventData?.approved_count >= eventData?.max_players) {
      Alert.alert('Event Full', 'This event is already full!');
      setProcessingId(null);
      return;
    }
    const { error } = await supabase.from('event_participants').update({ status: 'approved' }).eq('id', notification.participant_id);
    if (error) { Alert.alert(t('error'), error.message); setProcessingId(null); return; }
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    Alert.alert(t('success'), 'Player has been approved!');
    fetchNotifications();
    setProcessingId(null);
  }

  async function handleReject(notification: any) {
    if (processingId) return;
    setProcessingId(notification.id + '_reject');
    const { error } = await supabase.from('event_participants').update({ status: 'rejected' }).eq('id', notification.participant_id);
    if (error) { Alert.alert(t('error'), error.message); setProcessingId(null); return; }
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    Alert.alert(t('success'), 'Player has been rejected!');
    fetchNotifications();
    setProcessingId(null);
  }

  async function handleMessagePress(notif: any) {
    if (processingId) return;
    setProcessingId(notif.id);
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    router.push({ pathname: '/event-chat', params: { event_id: notif.event_id, event_title: notif.events?.title } } as any);
    setProcessingId(null);
  }

  async function dismissAdminMessage(id: string) {
    if (processingId) return;
    setProcessingId(id);
    await supabase.from('admin_messages').delete().eq('id', id);
    setAdminMessages(prev => prev.filter(m => m.id !== id));
    setProcessingId(null);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent }]}>{t('notifications')}</Text>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1D9E75" /></View>
      ) : (
        <>
          <View style={[styles.tabs, { borderColor: colors.cardBorder }]}>
            <TouchableOpacity
              style={[styles.tab, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }, activeTab === 'requests' && styles.tabActive]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'requests' && styles.tabTextActive]}>
                {t('joinRequests')} {joinRequests.length > 0 && `(${joinRequests.length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }, activeTab === 'messages' && styles.tabActive]}
              onPress={() => setActiveTab('messages')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'messages' && styles.tabTextActive]}>
                {t('messages')} {messages.length > 0 && `(${messages.length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }, activeTab === 'admin' && styles.tabActive]}
              onPress={() => setActiveTab('admin')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'admin' && styles.tabTextActive]}>
                ⚠️ Warnings {adminMessages.length > 0 && `(${adminMessages.length})`}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'requests' && (
            <>
              {joinRequests.length === 0 && <View style={styles.empty}><Text style={[styles.emptyText, { color: colors.textSecondary }]}>No join requests</Text></View>}
              {joinRequests.map((notif) => (
                <View key={notif.id} style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }, processingId && { opacity: 0.6 }]}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { userId: notif.sender_id } } as any)}>
                    <Text style={[styles.cardMessage, { color: colors.text }]}>{notif.message}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.cardEvent, { color: colors.textSecondary }]}>Event: {notif.events?.title}</Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(notif.created_at).toLocaleDateString()}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.approveBtn, processingId && { opacity: 0.5 }]}
                      onPress={() => handleApprove(notif)}
                      disabled={!!processingId}
                    >
                      <Text style={styles.approveBtnText}>{t('approve')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectBtn, processingId && { opacity: 0.5 }]}
                      onPress={() => handleReject(notif)}
                      disabled={!!processingId}
                    >
                      <Text style={styles.rejectBtnText}>{t('reject')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeTab === 'messages' && (
            <>
              {messages.length === 0 && <View style={styles.empty}><Text style={[styles.emptyText, { color: colors.textSecondary }]}>No new messages</Text></View>}
              {messages.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.card, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }, processingId && { opacity: 0.6 }]}
                  onPress={() => handleMessagePress(notif)}
                  disabled={!!processingId}
                >
                  <Text style={[styles.cardMessage, { color: colors.text }]}>{notif.message}</Text>
                  <Text style={[styles.cardEvent, { color: colors.textSecondary }]}>Event: {notif.events?.title}</Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(notif.created_at).toLocaleDateString()}</Text>
                  <View style={styles.goToChat}>
                    <Text style={styles.goToChatText}>💬 Go to chat →</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === 'admin' && (
            <>
              {adminMessages.length === 0 && (
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No warnings</Text>
                </View>
              )}
              {adminMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.adminCard, { backgroundColor: isDark ? 'rgba(74,27,12,0.3)' : '#FAECE7', borderColor: '#E24B4A' }, processingId && { opacity: 0.6 }]}
                >
                  <Text style={[styles.adminCardTitle, { color: isDark ? '#F5C4B3' : '#993C1D' }]}>⚠️ Warning from SportBuddy</Text>
                  <Text style={[styles.adminCardMessage, { color: colors.text }]}>{msg.message}</Text>
                  <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(msg.created_at).toLocaleDateString()}</Text>
                  <TouchableOpacity
                    style={[styles.dismissBtn, processingId && { opacity: 0.5 }]}
                    onPress={() => dismissAdminMessage(msg.id)}
                    disabled={!!processingId}
                  >
                    <Text style={styles.dismissBtnText}>✓ Dismiss</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  tabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#1D9E75' },
  tabText: { fontSize: 11, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16 },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 16, marginBottom: 16 },
  adminCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  adminCardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  adminCardMessage: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  cardMessage: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  cardEvent: { fontSize: 13, marginBottom: 4 },
  cardTime: { fontSize: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#E1F5EE', padding: 12, borderRadius: 12, alignItems: 'center' },
  approveBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#FCEBEB', padding: 12, borderRadius: 12, alignItems: 'center' },
  rejectBtnText: { color: '#E24B4A', fontWeight: 'bold', fontSize: 14 },
  goToChat: { backgroundColor: '#E6F1FB', padding: 10, borderRadius: 10, alignItems: 'center' },
  goToChatText: { color: '#185FA5', fontWeight: '500', fontSize: 13 },
  dismissBtn: { backgroundColor: '#E1F5EE', padding: 10, borderRadius: 10, alignItems: 'center' },
  dismissBtnText: { color: '#0F6E56', fontWeight: 'bold', fontSize: 13 },
});