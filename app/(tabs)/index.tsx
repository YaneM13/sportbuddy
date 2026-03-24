import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/useLanguage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAvatarBanner, setShowAvatarBanner] = useState(false);
  const [displayName, setDisplayName] = useState('');

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
        setDisplayName('');
      }
    });
  }, []);

  async function fetchAvatar(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, first_name, last_name, nickname')
      .eq('id', userId)
      .single();
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url + '?t=' + Date.now());
      setShowAvatarBanner(false);
    } else {
      setShowAvatarBanner(true);
    }
    if (data?.nickname) {
      setDisplayName('@' + data.nickname);
    } else if (data?.first_name) {
      setDisplayName(data.first_name + ' ' + (data.last_name || ''));
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

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAvatarUrl('');
    setUnreadCount(0);
    setShowAvatarBanner(false);
    setDisplayName('');
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/sports-bg.png')}
        style={styles.background}
        blurRadius={3}
      >
        <View style={styles.overlay} />

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🏆</Text>
            </View>
            <Text style={styles.logoText}>SportBuddy</Text>
          </View>

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
              <Text style={styles.signInText}>{t('signIn')}</Text>
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

        <View style={styles.centerContent}>
          <Text style={styles.greeting}>Good evening 👋</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </View>

        <View style={styles.bottomContent}>
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.findBtn}
              onPress={() => router.push('/find-event' as any)}
            >
              <Text style={styles.findBtnIcon}>🔍</Text>
              <Text style={styles.findBtnText}>{t('findEvent')}</Text>
              <Text style={styles.findBtnSub}>{t('findEventSub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/create-event' as any)}
            >
              <Text style={styles.createBtnIcon}>➕</Text>
              <Text style={styles.createBtnText}>{t('createEvent')}</Text>
              <Text style={styles.createBtnSub}>{t('createEventSub')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.adBanner}>
            <Text style={styles.adText}>Advertisement</Text>
          </View>
        </View>
      </ImageBackground>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay2} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.menuAvatarImage} />
              ) : (
                <View style={styles.menuAvatar}>
                  <Text style={styles.menuAvatarText}>{user ? getInitials(user.email) : ''}</Text>
                </View>
              )}
              <Text style={styles.menuDisplayName}>{displayName || user?.email}</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/my-profile' as any); }}>
              <Text style={styles.menuItemText}>{t('myProfile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/my-events' as any); }}>
              <Text style={styles.menuItemText}>{t('myCreatedEvents')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/my-joined-events' as any); }}>
              <Text style={styles.menuItemText}>{t('eventsJoined')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/notifications' as any); fetchUnreadCount(user?.id); }}>
              <View style={styles.menuItemRow}>
                <Text style={styles.menuItemText}>{t('notifications')}</Text>
                {unreadCount > 0 && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); router.push('/settings' as any); }}>
              <Text style={styles.menuItemText}>{t('settings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleLogout}>
              <Text style={styles.menuItemLogout}>{t('signOut')}</Text>
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
    backgroundColor: '#0F1923',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 26, 18, 0.78)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 34,
    height: 34,
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 18,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(29,158,117,0.5)',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    borderColor: '#0F1923',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  signInBtn: {
    backgroundColor: 'rgba(29,158,117,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#1D9E75',
  },
  signInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D9E75',
  },
  avatarBanner: {
    backgroundColor: 'rgba(24,95,165,0.3)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(24,95,165,0.5)',
  },
  avatarBannerText: {
    fontSize: 13,
    color: '#B5D4F4',
    flex: 1,
    marginRight: 8,
  },
  avatarBannerClose: {
    fontSize: 14,
    color: '#B5D4F4',
    fontWeight: 'bold',
    padding: 4,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#9FE1CB',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 36,
  },
  bottomContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  findBtn: {
    flex: 1,
    backgroundColor: 'rgba(29,158,117,0.15)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.4)',
  },
  findBtnIcon: {
    fontSize: 24,
  },
  findBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  findBtnSub: {
    fontSize: 11,
    color: '#6B8FA8',
    textAlign: 'center',
  },
  createBtn: {
    flex: 1,
    backgroundColor: '#1D9E75',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  createBtnIcon: {
    fontSize: 24,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  createBtnSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  adBanner: {
    backgroundColor: 'rgba(30,45,61,0.6)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29,158,117,0.2)',
    borderStyle: 'dashed',
  },
  adText: {
    fontSize: 12,
    color: '#6B8FA8',
  },
  overlay2: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 110,
    paddingRight: 24,
  },
  menu: {
    backgroundColor: '#0F1923',
    borderRadius: 16,
    width: 230,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#1E2D3D',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1E2D3D',
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
  menuDisplayName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1E2D3D',
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
    color: '#fff',
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