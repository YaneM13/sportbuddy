import { useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChangePasswordScreen() {
  const { isDark, colors } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.accent }]}>Change password</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>New password</Text>
      <View style={[styles.passwordRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder="Enter new password"
          placeholderTextColor={colors.textSecondary}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPassword(!showNewPassword)}>
          <Text style={styles.eyeIcon}>{showNewPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm password</Text>
      <View style={[styles.passwordRow, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg }]}>
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save new password'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  passwordInput: { flex: 1, padding: 16, fontSize: 15 },
  eyeBtn: { padding: 16 },
  eyeIcon: { fontSize: 18 },
  saveBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});