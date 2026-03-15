import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*, events(title)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error', error.message);
    else setNotifications(data || []);
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
      <Text style={styles.subtitle}>Pull down to refresh</Text>

      {notifications.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      )}

      {notifications.map((notif) => (
        <View key={notif.id} style={[styles.card, notif.is_read && styles.cardRead]}>
          <Text style={styles.cardMessage}>{notif.message}</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
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