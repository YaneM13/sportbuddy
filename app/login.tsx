import { useLanguage } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

let GoogleSignin: any = null;

try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {}

function GoogleIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <Path fill="none" d="M0 0h48v48H0z"/>
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 814 1000">
      <Path fill="#fff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-119.2c-40.6-65.8-81.4-162.7-81.4-255.1 0-194.3 127.4-297.5 253.4-297.5 66.3 0 121.2 43.4 162.6 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
    </Svg>
  );
}

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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { checks, passed } = getPasswordStrength(password);

  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: '657761128514-l1ftdeql01ptbcr1r5dgktchur2gimva.apps.googleusercontent.com',
        iosClientId: '657761128514-mgb5fbea2sv790f3gir1qrljb6a10j11.apps.googleusercontent.com',
      });
    }
  }, []);

  async function handleGoogleSignIn() {
    if (!GoogleSignin) { Alert.alert('Error', 'Google Sign In not available'); return; }
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) { setErrorMsg('Google sign in failed'); setGoogleLoading(false); return; }
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error) { setErrorMsg(error.message); setGoogleLoading(false); return; }
      router.replace('/');
    } catch (error: any) {
      if (error.code !== '-5') setErrorMsg('Google sign in failed. Please try again.');
    }
    setGoogleLoading(false);
  }

  async function handleAppleSignIn() {
    setAppleLoading(true);
    setErrorMsg('');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { identityToken } = credential;
      if (!identityToken) { setErrorMsg('Apple sign in failed'); setAppleLoading(false); return; }
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken });
      if (error) { setErrorMsg(error.message); setAppleLoading(false); return; }
      router.replace('/');
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        setErrorMsg('Apple sign in failed. Please try again.');
      }
    }
    setAppleLoading(false);
  }

  async function handleForgotPassword() {
    setErrorMsg(''); setSuccessMsg('');
    if (!email) { setErrorMsg('Please enter your email address'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'sportbuddy://reset-password' });
    if (error) { setErrorMsg(error.message); }
    else { setSuccessMsg('Password reset link sent! Check your email inbox.'); }
    setLoading(false);
  }

  async function handleStep1() {
    setErrorMsg('');
    if (!email || !password) { setErrorMsg('Please enter email and password'); return; }
    if (!checks.length || !checks.uppercase || !checks.lowercase || !checks.number) {
      setErrorMsg('Password does not meet all requirements'); return;
    }
    setStep(2);
  }

  async function handleRegister() {
    setErrorMsg('');
    if (!firstName || !lastName || !nickname) { setErrorMsg('Please fill in all fields'); return; }
    if (!favoriteSport) { setErrorMsg('Please select your favorite sport'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: 'sportbuddy://email-confirmed',
        data: { first_name: firstName, last_name: lastName, nickname, favorite_sport: favoriteSport }
      }
    });
    if (error) { setErrorMsg(error.message); setLoading(false); return; }
    if (data.user) { router.push('/terms' as any); }
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

  if (isForgotPassword) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {router.canGoBack() && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>SportBuddy 🏆</Text>
          <Text style={styles.subtitle}>Reset your password</Text>
          {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
          {successMsg ? <View style={styles.successBox}><Text style={styles.successText}>✅ {successMsg}</Text></View> : null}
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput style={styles.input} placeholder={t('email')} placeholderTextColor="#aaa" value={email} onChangeText={(v) => { setEmail(v); setErrorMsg(''); setSuccessMsg(''); }} autoCapitalize="none" keyboardType="email-address" />
          <TouchableOpacity style={styles.buttonGreen} onPress={handleForgotPassword} disabled={loading}>
            <Text style={styles.buttonTextGreen}>{loading ? 'Sending...' : 'Send reset link'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setIsForgotPassword(false); setErrorMsg(''); setSuccessMsg(''); }} style={styles.backStepBtn}>
            <Text style={styles.backStepText}>← Back to login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (!isLogin && step === 2) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {router.canGoBack() && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('favoriteSport')}</Text>
            <TouchableOpacity onPress={() => Alert.alert('⭐ Favorite Sport', 'Select your favorite sport to personalize your SportBuddy account!', [{ text: 'Got it!' }])}>
              <Text style={styles.infoBtn}>ℹ️</Text>
            </TouchableOpacity>
          </View>
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
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>SportBuddy 🏆</Text>
        <Text style={styles.subtitle}>{isLogin ? t('signInAccount') : t('createAccount')}</Text>
        {!isLogin && <Text style={styles.stepText}>{t('step1of2')}</Text>}
        {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}

        <Text style={styles.label}>{t('email')}</Text>
        <TextInput style={styles.input} placeholder={t('email')} placeholderTextColor="#aaa" value={email} onChangeText={(v) => { setEmail(v); setErrorMsg(''); }} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>{t('password')}</Text>
        <View style={styles.passwordRow}>
          <TextInput style={styles.passwordInput} placeholder={t('password')} placeholderTextColor="#aaa" value={password} onChangeText={(v) => { setPassword(v); setErrorMsg(''); }} secureTextEntry={!showPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {isLogin && (
          <TouchableOpacity onPress={() => { setIsForgotPassword(true); setErrorMsg(''); }} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {!isLogin && password.length > 0 && (
          <View style={styles.passwordHints}>
            <Text style={styles.passwordHintsTitle}>Password must contain:</Text>
            <Text style={[styles.passwordHint, checks.length && styles.passwordHintPassed]}>{checks.length ? '✅' : '❌'} At least 8 characters</Text>
            <Text style={[styles.passwordHint, checks.uppercase && styles.passwordHintPassed]}>{checks.uppercase ? '✅' : '❌'} At least one uppercase letter (A-Z)</Text>
            <Text style={[styles.passwordHint, checks.lowercase && styles.passwordHintPassed]}>{checks.lowercase ? '✅' : '❌'} At least one lowercase letter (a-z)</Text>
            <Text style={[styles.passwordHint, checks.number && styles.passwordHintPassed]}>{checks.number ? '✅' : '❌'} At least one number (0-9)</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.buttonGreen, !isLogin && passed < 4 && password.length > 0 && styles.buttonDisabled]}
          onPress={isLogin ? handleLogin : handleStep1}
          disabled={loading}
        >
          <Text style={styles.buttonTextGreen}>{loading ? t('loading') : isLogin ? t('signIn') : t('next')}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={googleLoading}>
          <GoogleIcon />
          <Text style={styles.googleBtnText}>{googleLoading ? 'Signing in...' : 'Continue with Google'}</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.appleBtn} onPress={handleAppleSignIn} disabled={appleLoading}>
            <AppleIcon />
            <Text style={styles.appleBtnText}>{appleLoading ? 'Signing in...' : 'Continue with Apple'}</Text>
          </TouchableOpacity>
        )}

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
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 16, color: '#1D9E75', fontWeight: '500' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1D9E75', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 8, textAlign: 'center' },
  stepText: { fontSize: 13, color: '#1D9E75', fontWeight: '500', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6 },
  sublabel: { fontSize: 12, color: '#888', marginBottom: 10 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 8, fontSize: 16, color: '#1a1a1a', backgroundColor: '#fff' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginBottom: 4, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#1a1a1a' },
  eyeBtn: { padding: 16 },
  eyeIcon: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 12, marginTop: 4 },
  forgotText: { fontSize: 13, color: '#1D9E75', fontWeight: '500' },
  errorBox: { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E24B4A' },
  errorText: { color: '#E24B4A', fontSize: 13, fontWeight: '500' },
  successBox: { backgroundColor: '#F0FBF7', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#9FE1CB' },
  successText: { color: '#0F6E56', fontSize: 13, fontWeight: '500' },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { marginHorizontal: 12, color: '#aaa', fontSize: 14 },
  googleBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#444' },
  appleBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  appleBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  switchText: { fontSize: 14, color: '#1D9E75', textAlign: 'center' },
  backStepBtn: { alignItems: 'center', marginTop: 8 },
  backStepText: { fontSize: 14, color: '#888' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoBtn: { fontSize: 18 },
});