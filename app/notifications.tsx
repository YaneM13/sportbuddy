import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
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

    if (error) Alert.alert('Error', error.message);
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

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);

    Alert.alert('Approved', 'Player has been approved!');
    fetchNotifications();
  }

  async function handleReject(notification: any) {
    const { error } = await supabase
      .from('event_participants')
      .update({ status: 'rejected' })
      .eq('id', notification.participant_id);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);

    Alert.alert('Rejected', 'Player has been rejected!');
    fetchNotifications();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Notifications</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Join requests {joinRequests.filter(n => !n.is_read).length > 0 && `(${joinRequests.filter(n => !n.is_read).length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages {messages.filter(n => !n.is_read).length > 0 && `(${messages.filter(n => !n.is_read).length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' && (
        <>
          {joinRequests.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No join requests yet</Text>
            </View>
          )}
          {joinRequests.map((notif) => (
            <View key={notif.id} style={[styles.card, notif.is_read && styles.cardRead]}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/user-profile', params: { userId: notif.event_participants?.user_id } } as any)}>
                <Text style={styles.cardMessage}>{notif.message}</Text>
              </TouchableOpacity>
              <Text style={styles.cardEvent}>Event: {notif.events?.title}</Text>
              <Text style={styles.cardTime}>{new Date(notif.created_at).toLocaleDateString()}</Text>

              {!notif.is_read && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(notif)}>
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(notif)}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {notif.is_read && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Reviewed</Text>
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
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          )}
          {messages.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.card, notif.is_read && styles.cardRead]}
              onPress={() => router.push({ pathname: '/event-chat', params: { event_id: notif.event_id, event_title: notif.events?.title } } as any)}
            >
              <Text style={styles.cardMessage}>{notif.message}</Text>
              <Text style={styles.cardEvent}>Event: {notif.events?.title}</Text>
              <Text style={styles.cardTime}>{new Date(notif.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
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
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
    color: '#1D9E75',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#1D9E75',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    padding: 16,
    marginBottom: 16,
  },
  cardRead: {
    backgroundColor: '#F9F9F9',
    opacity: 0.7,
  },
  cardMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardEvent: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#E1F5EE',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#0F6E56',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FCEBEB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#E24B4A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusContainer: {
    backgroundColor: '#F1EFE8',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
});