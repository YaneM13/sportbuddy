import { useLanguage } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const allSports = [
  { id: 'Football', category: 'team' },
  { id: 'Basketball', category: 'team' },
  { id: 'Basketball 3x3', category: 'team' },
  { id: 'Volleyball', category: 'team' },
  { id: 'Beach Volleyball', category: 'team' },
  { id: 'Rugby', category: 'team' },
  { id: 'Cricket', category: 'team' },
  { id: 'Handball', category: 'team' },
  { id: 'Tennis', category: 'individual' },
  { id: 'Ping Pong', category: 'individual' },
  { id: 'Roller Skating', category: 'individual' },
  { id: 'Cycling', category: 'individual' },
  { id: 'Padel', category: 'individual' },
  { id: 'Swimming', category: 'individual' },
  { id: 'Kayaking', category: 'water' },
  { id: 'Paddleboarding', category: 'water' },
  { id: 'Rafting', category: 'water' },
  { id: 'Fishing', category: 'water' },
];

const categoryColors: any = {
  team: { bg: '#E1F5EE', text: '#0F6E56' },
  individual: { bg: '#E6F1FB', text: '#185FA5' },
  water: { bg: '#EEEDFE', text: '#534AB7' },
};

function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed };
}

export default function LoginScreen() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { checks, passed } = getPasswordStrength(password);

  async function handleStep1() {
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Please enter email and password'); return; }
    if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number) { setErrorMsg('Password does not meet all requirements'); return; }
    setStep(2);
  }

  async function handleRegister() {
    setErrorMsg('');
    if (!firstName || !lastName || !nickname) { setErrorMsg('Please fill in all fields'); return; }
    if (!favoriteSport) { setErrorMsg('Please select your favorite sport'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setErrorMsg(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, first_name: firstName, last_name: lastName, nickname, favorite_sport: favoriteSport });
      setStep(3);
    }
    setLoading(false);
  }

  async function handleLogin() {
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Please enter email and password'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErrorMsg(error.message); } else { router.replace('/'); }
    setLoading(false);
  }

  if (!isLogin && step === 3) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>SportBuddy 🏆</Text>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmEmoji}>📧</Text>
            <Text style={styles.confirmTitle}>Check your email!</Text>
            <Text style={styles.confirmText}>
              We sent a confirmation link to{'\n'}
              <Text style={styles.confirmEmail}>{email}</Text>
              {'\n\n'}Please check your inbox and confirm your email to start using SportBuddy!
            </Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => router.replace('/')}>
              <Text style={styles.confirmBtnText}>Continue to app →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (!isLogin && step === 2) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>SportBuddy 🏆</Text>
          <Text style={styles.subtitle}>{t('tellUsAboutYourself')}</Text>
          <Text style={styles.stepText}>{t('step2of2')}</Text>
          {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
          <Text style={styles.label}>{t('firstName')}</Text>
          <TextInput style={styles.input} placeholder={t('firstName')} placeholderTextColor="#aaa" value={firstName} onChangeText={setFirstName} />
          <Text style={styles.label}>{t('lastName')}</Text>
          <TextInput style={styles.input} placeholder={t('lastName')} placeholderTextColor="#aaa" value={lastName} onChangeText={setLastName} />
          <Text style={styles.label}>{t('nickname')}</Text>
          <TextInput style={styles.input} placeholder={t('nickname')} placeholderTextColor="#aaa" value={nickname} onChangeText={setNickname} autoCapitalize="none" />
          <Text style={styles.label}>{t('favoriteSport')}</Text>
          <Text style={styles.sublabel}>{t('selectOneSport')}</Text>
          <View style={styles.sportsGrid}>
            {allSports.map((sport) => {
              const color = categoryColors[sport.category];
              const isSelected = favoriteSport === sport.id;
              return (
                <TouchableOpacity key={sport.id} style={[styles.sportBtn, { backgroundColor: isSelected ? '#1D9E75' : color.bg }, isSelected && styles.sportBtnSelected]} onPress={() => setFavoriteSport(sport.id)}>
                  <Text style={[styles.sportBtnText, { color: isSelected ? '#fff' : color.text }]}>{sport.id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.buttonGreen} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonTextGreen}>{loading ? t('creatingAccount') : t('register')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backStepBtn}>
            <Text style={styles.backStepText}>{t('back')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>SportBuddy 🏆</Text>
        <Text style={styles.subtitle}>{isLogin ? t('signInAccount') : t('createAccount')}</Text>
        {!isLogin && <Text style={styles.stepText}>{t('step1of2')}</Text>}
        {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}

        <Text style={styles.label}>{t('email')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('email')}
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>{t('password')}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('password')}
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {!isLogin && password.length > 0 && (
          <View style={styles.passwordHints}>
            <Text style={styles.passwordHintsTitle}>Password must contain:</Text>
            <Text style={[styles.passwordHint, checks.length && styles.passwordHintPassed]}>{checks.length ? '✅' : '❌'} At least 8 characters</Text>
            <Text style={[styles.passwordHint, checks.uppercase && styles.passwordHintPassed]}>{checks.uppercase ? '✅' : '❌'} At least one uppercase letter (A-Z)</Text>
            <Text style={[styles.passwordHint, checks.lowercase && styles.passwordHintPassed]}>{checks.lowercase ? '✅' : '❌'} At least one lowercase letter (a-z)</Text>
            <Text style={[styles.passwordHint, checks.number && styles.passwordHintPassed]}>{checks.number ? '✅' : '❌'} At least one number (0-9)</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.buttonGreen, !isLogin && passed < 4 && password.length > 0 && styles.buttonDisabled]} onPress={isLogin ? handleLogin : handleStep1} disabled={loading}>
          <Text style={styles.buttonTextGreen}>{loading ? t('loading') : isLogin ? t('signIn') : t('next')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setStep(1); setErrorMsg(''); }}>
          <Text style={styles.switchText}>{isLogin ? t('noAccount') : t('haveAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1D9E75', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 8, textAlign: 'center' },
  stepText: { fontSize: 13, color: '#1D9E75', fontWeight: '500', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6 },
  sublabel: { fontSize: 12, color: '#888', marginBottom: 10 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8, fontSize: 16, color: '#1a1a1a', backgroundColor: '#fff' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#1a1a1a' },
  eyeBtn: { padding: 16 },
  eyeIcon: { fontSize: 18 },
  errorBox: { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E24B4A' },
  errorText: { color: '#E24B4A', fontSize: 13, fontWeight: '500' },
  passwordHints: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  passwordHintsTitle: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  passwordHint: { fontSize: 13, color: '#E24B4A', marginBottom: 4 },
  passwordHintPassed: { color: '#1D9E75' },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  sportBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  sportBtnSelected: { backgroundColor: '#1D9E75' },
  sportBtnText: { fontSize: 13, fontWeight: '500' },
  buttonGreen: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonTextGreen: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  switchText: { fontSize: 14, color: '#1D9E75', textAlign: 'center' },
  backStepBtn: { alignItems: 'center', marginTop: 8 },
  backStepText: { fontSize: 14, color: '#888' },
  confirmBox: { backgroundColor: '#F0FBF7', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#9FE1CB', marginTop: 32 },
  confirmEmoji: { fontSize: 48, marginBottom: 16 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', color: '#1D9E75', marginBottom: 12 },
  confirmText: { fontSize: 15, color: '#444', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  confirmEmail: { fontWeight: 'bold', color: '#1D9E75' },
  confirmBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});