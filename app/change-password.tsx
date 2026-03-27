import { useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChangePasswordScreen() {
  const { isDark, colors } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Success', 'Password changed successfully!'); router.back(); }
    setLoading(false);
  }

  const content = (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.accent }]}>Change password</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>New password</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Enter new password" placeholderTextColor={colors.textSecondary} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm password</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Confirm new password" placeholderTextColor={colors.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save new password'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (isDark) {
    return (
      <ImageBackground source={require('../assets/images/sports-bg.png')} style={styles.bg} blurRadius={3}>
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
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, fontSize: 15 },
  saveBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});