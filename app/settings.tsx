import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { Language, languageNames } from '@/lib/translations';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [uploading, setUploading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, currentLanguage, setLanguage } = useLanguage();
  const { isDark, colors, setTheme } = useTheme();

  async function handleChangePhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uri = result.assets[0].uri;
    const fileName = `${session.user.id}.jpg`;
    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type: 'image/jpeg' } as any);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, formData, { upsert: true, contentType: 'image/jpeg' });
    if (uploadError) {
      Alert.alert('Error', uploadError.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id);
    if (updateError) Alert.alert('Error', updateError.message);
    else Alert.alert('Success', 'Profile photo updated!');
    setUploading(false);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      t('deleteAccount'),
      'Are you sure? This action cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_user');
            if (error) Alert.alert('Error', error.message);
            else {
              await supabase.auth.signOut();
              router.replace('/');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#f5f5f5' }]}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>← {t('back').replace('← ', '')}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent }]}>{t('settings')}</Text>

      {/* Profile Picture */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('profilePicture')}</Text>
      <View style={[styles.section, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleChangePhoto} disabled={uploading}>
          <Text style={[styles.menuItemText, { color: colors.text }]}>{uploading ? t('saving') : t('changePhoto')}</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account')}</Text>
      <View style={[styles.section, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.cardBorder }]}
          onPress={() => router.push('/personal-details' as any)}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>{t('personalDetails')}</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => router.push('/change-password' as any)}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>{t('changePassword')}</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>🌙 Appearance</Text>
      <View style={[styles.section, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            {isDark ? '🌙 Dark mode' : '☀️ Light mode'}
          </Text>
          <View style={[styles.toggle, { backgroundColor: isDark ? colors.accent : '#e0e0e0' }]}>
            <View style={[styles.toggleDot, { marginLeft: isDark ? 18 : 2 }]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Language */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>🌍 Language</Text>
      <View style={[styles.section, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>{languageNames[currentLanguage]}</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('dangerZone')}</Text>
      <View style={[styles.section, { backgroundColor: isDark ? '#1E2D3D' : '#fff', borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeleteAccount}>
          <Text style={styles.menuItemDanger}>{t('deleteAccount')}</Text>
          <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Language Modal */}
      {languageModalVisible && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setLanguageModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🌍 Select Language</Text>
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageItem,
                  { backgroundColor: isDark ? '#1E2D3D' : '#F9F9F9' },
                  currentLanguage === lang && styles.languageItemActive,
                ]}
                onPress={() => {
                  setLanguage(lang);
                  setLanguageModalVisible(false);
                }}
              >
                <Text style={[
                  styles.languageText,
                  { color: colors.text },
                  currentLanguage === lang && styles.languageTextActive,
                ]}>
                  {languageNames[lang]}
                </Text>
                {currentLanguage === lang && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { borderRadius: 16, marginBottom: 24, overflow: 'hidden', borderWidth: 0.5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#2A3D50' },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemText: { fontSize: 15 },
  menuItemDanger: { fontSize: 15, color: '#E24B4A' },
  menuArrow: { fontSize: 16 },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', padding: 2 },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  modalDismiss: { flex: 1 },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  languageItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 8 },
  languageItemActive: { backgroundColor: '#E1F5EE' },
  languageText: { fontSize: 16 },
  languageTextActive: { color: '#1D9E75', fontWeight: '500' },
  checkmark: { fontSize: 16, color: '#1D9E75', fontWeight: 'bold' },
});