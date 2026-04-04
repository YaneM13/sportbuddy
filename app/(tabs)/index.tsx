import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAvatarBanner, setShowAvatarBanner] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) { fetchAvatar(session.user.id); fetchUnreadCount(session.user.id); }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) { fetchAvatar(session.user.id); fetchUnreadCount(session.user.id); }
      else { setUnreadCount(0); setAvatarUrl(''); setShowAvatarBanner(false); setDisplayName(''); }
    });
  }, []);

  useFocusEffect(useCallback(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { fetchAvatar(session.user.id); fetchUnreadCount(session.user.id); }
    });
  }, []));

  async function fetchAvatar(userId: string) {
    const { data } = await supabase.from('profiles').select('avatar_url, first_name, last_name, nickname').eq('id', userId).single();
    if (data?.avatar_url) { setAvatarUrl(data.avatar_url + '?t=' + Date.now()); setShowAvatarBanner(false); }
    else setShowAvatarBanner(true);
    if (data?.nickname) setDisplayName('@' + data.nickname);
    else if (data?.first_name) setDisplayName(data.first_name + ' ' + (data.last_name || ''));
  }

  async function fetchUnreadCount(userId: string) {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    setUnreadCount(count || 0);
  }

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAvatarUrl(''); setUnreadCount(0); setShowAvatarBanner(false); setDisplayName(''); setMenuVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logoImage} />
          <Text style={[styles.logoText, { color: colors.text }]}>SportBuddy</Text>
        </View>

        {user ? (
          <TouchableOpacity style={styles.avatarContainer} onPress={() => setMenuVisible(true)}>
            <View style={styles.avatar}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{getInitials(user.email)}</Text>}
            </View>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.signInBtn, { borderColor: colors.accent }]} onPress={() => router.push('/login' as any)}>
            <Text style={[styles.signInText, { color: colors.accent }]}>{t('signIn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showAvatarBanner && (
        <TouchableOpacity style={styles.avatarBanner} onPress={() => { setShowAvatarBanner(false); router.push('/settings' as any); }}>
          <Text style={styles.avatarBannerText}>📸 Add a profile photo so others can recognise you</Text>
          <Text style={styles.avatarBannerClose} onPress={() => setShowAvatarBanner(false)}>✕</Text>
        </TouchableOpacity>
      )}

      <View style={styles.centerContent}>
        <Image source={require('../../assets/images/icon.png')} style={styles.centerLogo} />
        <View style={styles.sloganBox}>
          <Text style={styles.sloganWhite}>Stop waiting,</Text>
          <Text style={styles.sloganWhite}>Start playing!</Text>
        </View>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>{t('tagline')}</Text>
      </View>

      <View style={styles.bottomContent}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.findBtn, { borderColor: colors.accent, backgroundColor: isDark ? 'rgba(29,158,117,0.15)' : '#E1F5EE' }]} onPress={() => router.push('/find-event' as any)}>
            <Text style={styles.findBtnIcon}>🔍</Text>
            <Text style={[styles.findBtnText, { color: colors.text }]}>{t('findEvent')}</Text>
            <Text style={[styles.findBtnSub, { color: colors.textSecondary }]}>{t('findEventSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-event' as any)}>
            <Text style={styles.createBtnIcon}>➕</Text>
            <Text style={styles.createBtnText}>{t('createEvent')}</Text>
            <Text style={styles.createBtnSub}>{t('createEventSub')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.adBanner, { borderColor: isDark ? 'rgba(29,158,117,0.2)' : '#e0e0e0', backgroundColor: isDark ? 'rgba(30,45,61,0.6)' : '#f9f9f9' }]}>
          <Text style={[styles.adText, { color: colors.textSecondary }]}>Advertisement</Text>
        </View>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay2} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { backgroundColor: colors.menuBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.menuHeader, { borderBottomColor: colors.cardBorder }]}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.menuAvatarImage} /> : (
                <View style={styles.menuAvatar}>
                  <Text style={styles.menuAvatarText}>{user ? getInitials(user.email) : ''}</Text>
                </View>
              )}
              <Text style={[styles.menuDisplayName, { color: colors.text }]}>{displayName || user?.email}</Text>
            </View>

            {[
              { label: t('myProfile'), path: '/my-profile' },
              { label: t('myCreatedEvents'), path: '/my-events' },
              { label: t('eventsJoined'), path: '/my-joined-events' },
              { label: t('settings'), path: '/settings' },
            ].map((item) => (
              <TouchableOpacity key={item.path} style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]} onPress={() => { setMenuVisible(false); router.push(item.path as any); }}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]} onPress={() => { setMenuVisible(false); router.push('/notifications' as any); fetchUnreadCount(user?.id); }}>
              <View style={styles.menuItemRow}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>{t('notifications')}</Text>
                {unreadCount > 0 && <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
              </View>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 34, height: 34, borderRadius: 10 },
  logoText: { fontSize: 18, fontWeight: '600' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(29,158,117,0.5)' },
  avatarImage: { width: 38, height: 38, borderRadius: 19 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#E24B4A', borderRadius: 99, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#0F1923' },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  signInBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, backgroundColor: 'transparent' },
  signInText: { fontSize: 14, fontWeight: '500' },
  avatarBanner: { backgroundColor: 'rgba(24,95,165,0.3)', borderRadius: 12, padding: 12, marginHorizontal: 24, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(24,95,165,0.5)' },
  avatarBannerText: { fontSize: 13, color: '#B5D4F4', flex: 1, marginRight: 8 },
  avatarBannerClose: { fontSize: 14, color: '#B5D4F4', fontWeight: 'bold', padding: 4 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  centerLogo: { width: 100, height: 100, borderRadius: 24, marginBottom: 24 },
  sloganBox: { backgroundColor: '#1D9E75', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 20, marginBottom: 16, alignItems: 'center' },
  sloganWhite: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', lineHeight: 42 },
  tagline: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  bottomContent: { paddingHorizontal: 24, paddingBottom: 32 },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  findBtn: { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, borderWidth: 1 },
  findBtnIcon: { fontSize: 24 },
  findBtnText: { fontSize: 15, fontWeight: '600' },
  findBtnSub: { fontSize: 11, textAlign: 'center' },
  createBtn: { flex: 1, backgroundColor: '#1D9E75', borderRadius: 20, padding: 20, alignItems: 'center', gap: 6 },
  createBtnIcon: { fontSize: 24 },
  createBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  createBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  adBanner: { borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  adText: { fontSize: 12 },
  overlay2: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 110, paddingRight: 24 },
  menu: { borderRadius: 16, width: 230, overflow: 'hidden', borderWidth: 0.5 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, gap: 10 },
  menuAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  menuAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  menuAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  menuDisplayName: { fontSize: 13, fontWeight: '500', flex: 1 },
  menuItem: { padding: 16, borderBottomWidth: 0.5 },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuItemText: { fontSize: 15 },
  menuItemLogout: { fontSize: 15, color: '#E24B4A' },
  menuBadge: { backgroundColor: '#E24B4A', borderRadius: 99, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  menuBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
});