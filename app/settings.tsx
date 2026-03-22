import { supabase } from '@/lib/supabase';
import { languageNames } from '@/lib/translations';
import { Language, setLanguage, useLanguage } from '@/lib/useLanguage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [uploading, setUploading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, currentLanguage } = useLanguage();

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
      'Are you sure you want to delete your account? This action cannot be undone.',
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

  async function handleSelectLanguage(lang: Language) {
    await setLanguage(lang);
    setLanguageModalVisible(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← {t('back').replace('← ', '')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('settings')}</Text>

      <Text style={styles.sectionTitle}>{t('profilePicture')}</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={handleChangePhoto} disabled={uploading}>
          <Text style={styles.menuItemText}>{uploading ? t('saving') : t('changePhoto')}</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('account')}</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/personal-details' as any)}>
          <Text style={styles.menuItemText}>{t('personalDetails')}</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => router.push('/change-password' as any)}>
          <Text style={styles.menuItemText}>{t('changePassword')}</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>🌍 Language</Text>
      <View style={styles.section}>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => setLanguageModalVisible(true)}>
          <Text style={styles.menuItemText}>{languageNames[currentLanguage]}</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('dangerZone')}</Text>
      <View style={styles.section}>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeleteAccount}>
          <Text style={styles.menuItemDanger}>{t('deleteAccount')}</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={languageModalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🌍 Select Language</Text>
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.languageItem, currentLanguage === lang && styles.languageItemActive]}
                onPress={() => handleSelectLanguage(lang)}
              >
                <Text style={[styles.languageText, currentLanguage === lang && styles.languageTextActive]}>
                  {languageNames[lang]}
                </Text>
                {currentLanguage === lang && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 24,
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  menuItemDanger: {
    fontSize: 15,
    color: '#E24B4A',
  },
  menuArrow: {
    fontSize: 16,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
  },
  languageItemActive: {
    backgroundColor: '#E1F5EE',
  },
  languageText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  languageTextActive: {
    color: '#1D9E75',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#1D9E75',
    fontWeight: 'bold',
  },
});