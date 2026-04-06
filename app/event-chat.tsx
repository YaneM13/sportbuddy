import { useTheme } from '@/lib/AppContext';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EventChatScreen() {
  const { event_id, event_title } = useLocalSearchParams();
  const { isDark, colors } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<{ [key: string]: any }>({});
  const flatListRef = useRef<any>(null);
  const profilesRef = useRef<{ [key: string]: any }>({});
  const userRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
    });
    fetchMessages();

    const subscription = supabase.channel(`event-chat-${event_id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${event_id}`
      }, async (payload) => {
        const newMsg = payload.new;
        await fetchProfileIfNeeded(newMsg.user_id);
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }).subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: true });
    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }
    setMessages(data || []);
    const userIds = [...new Set((data || []).map((m: any) => m.user_id))];
    for (const userId of userIds) await fetchProfileIfNeeded(userId);
    setLoading(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }

  async function fetchProfileIfNeeded(userId: string) {
    if (profilesRef.current[userId]) return;
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, nickname, avatar_url, push_token')
      .eq('id', userId)
      .single();
    if (data) {
      profilesRef.current[userId] = data;
      setProfiles(prev => ({ ...prev, [userId]: data }));
    }
  }

  async function sendNotificationsToParticipants(msg: string) {
    const currentUser = userRef.current;
    if (!currentUser) return;

    // Земи го профилот на испраќачот
    const senderProfile = profilesRef.current[currentUser.id];
    const senderName = senderProfile?.nickname
      ? `@${senderProfile.nickname}`
      : senderProfile?.first_name
      ? `${senderProfile.first_name}`
      : 'Someone';

    // Земи ги сите учесници на настанот
    const { data: participants } = await supabase
      .from('event_participants')
      .select('user_id')
      .eq('event_id', event_id)
      .eq('status', 'approved')
      .neq('user_id', currentUser.id);

    if (!participants) return;

    for (const participant of participants) {
      // Додај нотификација во базата
      await supabase.from('notifications').insert({
        user_id: participant.user_id,
        event_id: event_id,
        message: `${senderName} sent a message in ${event_title}: "${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}"`,
      });

      // Земи push token и прати push нотификација
      await fetchProfileIfNeeded(participant.user_id);
      const profile = profilesRef.current[participant.user_id];
      if (profile?.push_token) {
        await sendPushNotification(
          profile.push_token,
          `💬 ${event_title}`,
          `${senderName}: ${msg.substring(0, 100)}`
        );
      }
    }
  }

  async function handleSend() {
    if (!newMessage.trim()) return;
    if (!user) { Alert.alert('Sign in required', 'You must be signed in'); return; }
    const msg = newMessage.trim();
    setNewMessage('');

    // Прати ја пораката
    const { error } = await supabase
      .from('messages')
      .insert({ event_id, user_id: user.id, message: msg });

    if (error) {
      Alert.alert('Error', error.message);
      setNewMessage(msg);
      return;
    }

    // Прати нотификации до останатите учесници
    sendNotificationsToParticipants(msg);
  }

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const getInitials = (profile: any) => profile?.first_name ? profile.first_name.substring(0, 2).toUpperCase() : '??';

  if (loading) return <View style={[styles.centered, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}><ActivityIndicator size="large" color="#1D9E75" /></View>;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
      behavior='padding'
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
    >
      <View style={[styles.header, { borderBottomColor: colors.cardBorder, backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{event_title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Group chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Be the first to send a message!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = user && item.user_id === user.id;
          const profile = profiles[item.user_id];
          return (
            <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
              {!isMe && (
                <View style={styles.avatarSmall}>
                  {profile?.avatar_url
                    ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarSmallImage} />
                    : <Text style={styles.avatarSmallText}>{getInitials(profile)}</Text>}
                </View>
              )}
              <View style={[styles.messageBubble, isMe
                ? styles.messageBubbleMe
                : [styles.messageBubbleOther, { backgroundColor: isDark ? '#1E2D3D' : '#F1EFE8' }]]}>
                {!isMe && profile?.nickname && (
                  <Text style={[styles.messageNickname, { color: colors.accent }]}>@{profile.nickname}</Text>
                )}
                <Text style={[styles.messageText, {
                  color: isDark && !isMe ? colors.text : isMe ? '#fff' : '#1a1a1a'
                }]}>{item.message}</Text>
                <Text style={[styles.messageTime, isMe && styles.messageTimeMe, !isMe && { color: colors.textSecondary }]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[styles.inputContainer, { borderTopColor: colors.cardBorder, backgroundColor: isDark ? '#0D1620' : '#fff' }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 24, paddingTop: 60, borderBottomWidth: 0.5 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 13 },
  messagesList: { padding: 16, paddingBottom: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  emptySubtext: { fontSize: 14 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  messageRowMe: { justifyContent: 'flex-end' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 },
  avatarSmallImage: { width: 28, height: 28, borderRadius: 14 },
  avatarSmallText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  messageBubble: { maxWidth: '75%', padding: 10, borderRadius: 16 },
  messageBubbleMe: { backgroundColor: '#1D9E75', borderBottomRightRadius: 4 },
  messageBubbleOther: { borderBottomLeftRadius: 4 },
  messageNickname: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  messageText: { fontSize: 15 },
  messageTime: { fontSize: 10, color: '#888', marginTop: 4, alignSelf: 'flex-end' },
  messageTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputContainer: { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'android' ? 32 : 12, borderTopWidth: 0.5, alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});