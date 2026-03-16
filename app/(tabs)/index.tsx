import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAvatarBanner, setShowAvatarBanner] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        fetchUnreadCount(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        fetchUnreadCount(session.user.id);
      } else {
        setUnreadCount(0);
        setAvatarUrl('');
        setShowAvatarBanner(false);
      }
    });
  }, []);

  async function fetchAvatar(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url + '?t=' + Date.now());
      setShowAvatarBanner(false);
    } else {
      setShowAvatarBanner(true);
    }
  }

  async function fetchUnreadCount(userId: string) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAvatarUrl('');
    setUnreadCount(0);
    setShowAvatarBanner(false);
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>SportBuddy 🏆</Text>
        {user ? (
          <TouchableOpacity style={styles.avatarContainer} onPress={() => setMenuVisible(true)}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user.email)}</Text>
              )}
            </View>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/login' as any)}>
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAvatarBanner && (
        <TouchableOpacity
          style={styles.avatarBanner}
          onPress={() => { setShowAvatarBanner(false); router.push('/settings' as any); }}
        >
          <Text style={styles.avatarBannerText}>📸 Add a profile photo so others can recognise you</Text>
          <Text style={styles.avatarBannerClose} onPress={() => setShowAvatarBanner(false)}>✕</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.subtitle}>Find sports events near you</Text>

      <TouchableOpacity style={[styles.button, styles.buttonGreen]} onPress={() => router.push('/find-event' as any)}>
        <Text style={styles.buttonTextGreen}>Find an event</Text>
        <Text style={styles.buttonSub}>Browse nearby events</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonBlue]} onPress={() => router.push('/create-event' as any)}>
        <Text style={styles.buttonTextBlue}>Create an event</Text>
        <Text style={styles.buttonSub}>Organise your game</Text>
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.menuAvatarImage} />
              ) : (
                <View style={styles.menuAvatar}>
                  <Text style={styles.menuAvatarText}>{user ? getInitials(user.email) : ''}</Text>
                </View>
              )}
              <Text style={styles.menuEmail}>{user?.email}</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/my-profile' as any); }}>
              <Text style={styles.menuItemText}>My profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/my-events' as any); }}>
              <Text style={styles.menuItemText}>My created events</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/my-joined-events' as any); }}>
              <Text style={styles.menuItemText}>Events I joined</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/notifications' as any); fetchUnreadCount(user?.id); }}>
              <View style={styles.menuItemRow}>
                <Text style={styles.menuItemText}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/settings' as any); }}>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
              <Text style={styles.menuItemLogout}>Log out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D9E75',
  },
  signInBtn: {
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F6E56',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E24B4A',
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarBanner: {
    backgroundColor: '#E6F1FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarBannerText: {
    fontSize: 13,
    color: '#185FA5',
    flex: 1,
    marginRight: 8,
  },
  avatarBannerClose: {
    fontSize: 14,
    color: '#185FA5',
    fontWeight: 'bold',
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
    marginTop: 16,
  },
  button: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonGreen: {
    backgroundColor: '#E1F5EE',
  },
  buttonBlue: {
    backgroundColor: '#E6F1FB',
  },
  buttonTextGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F6E56',
    marginBottom: 4,
  },
  buttonTextBlue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#185FA5',
    marginBottom: 4,
  },
  buttonSub: {
    fontSize: 13,
    color: '#888',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 24,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 220,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  menuAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  menuAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuEmail: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  menuItemLogout: {
    fontSize: 15,
    color: '#E24B4A',
  },
  menuBadge: {
    backgroundColor: '#E24B4A',
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});