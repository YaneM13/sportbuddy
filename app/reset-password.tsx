import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function handleDeepLink() {
      try {
        const accessToken = params.access_token as string;
        const refreshToken = params.refresh_token as string;
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) { setErrorMsg('Invalid or expired reset link'); return; }
          setSessionReady(true);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) setSessionReady(true);
          else setErrorMsg('Invalid or expired reset link');
        }
      } catch (e) {
        setErrorMsg('Something went wrong. Please try again.');
      }
    }
    handleDeepLink();
  }, [params]);

  async function handleReset() {
    setErrorMsg('');
    if (!newPassword || !confirmPassword) { setErrorMsg('Please fill in all fields'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match'); return; }
    if (newPassword.length < 8) { setErrorMsg('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setErrorMsg(error.message); }
    else {
      setSuccessMsg('Password changed successfully!');
      setTimeout(() => router.replace('/'), 2000);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>SportBuddy 🏆</Text>
        <Text style={styles.subtitle}>Set new password</Text>

        {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
        {successMsg ? <View style={styles.successBox}><Text style={styles.successText}>✅ {successMsg}</Text></View> : null}

        {!sessionReady && !errorMsg && (
          <Text style={{ textAlign: 'center', color: '#888', marginBottom: 16 }}>Verifying reset link...</Text>
        )}

        {sessionReady && (
          <>
            <Text style={styles.label}>New password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter new password"
                placeholderTextColor="#aaa"
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setErrorMsg(''); }}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                <Text style={styles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#aaa"
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrorMsg(''); }}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.buttonGreen} onPress={handleReset} disabled={loading}>
              <Text style={styles.buttonTextGreen}>{loading ? 'Saving...' : 'Save new password'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1D9E75', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 16, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#1a1a1a' },
  eyeBtn: { padding: 16 },
  eyeIcon: { fontSize: 18 },
  errorBox: { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E24B4A' },
  errorText: { color: '#E24B4A', fontSize: 13, fontWeight: '500' },
  successBox: { backgroundColor: '#F0FBF7', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#9FE1CB' },
  successText: { color: '#0F6E56', fontSize: 13, fontWeight: '500' },
  buttonGreen: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8 },
  buttonTextGreen: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});