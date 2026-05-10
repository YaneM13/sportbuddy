import { useLanguage } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import appleAuth from '@invertase/react-native-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    GoogleSignin.configure({
      webClientId: '657761128514-l1ftdeql01ptbcr1r5dgktchur2gimva.apps.googleusercontent.com',
      iosClientId: '657761128514-mgb5fbea2sv790f3gir1qrljb6a10j11.apps.googleusercontent.com',
    });
  }, []);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) { setErrorMsg('Google sign in failed'); setGoogleLoading(false); return; }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) { setErrorMsg(error.message); setGoogleLoading(false); return; }
      router.replace('/');
    } catch (error: any) {
      if (error.code !== '-5') {
        setErrorMsg('Google sign in failed. Please try again.');
      }
    }
    setGoogleLoading(false);
  }

  async function handleAppleSignIn() {
    setAppleLoading(true);
    setErrorMsg('');
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      const { identityToken } = appleAuthRequestResponse;
      if (!identityToken) { setErrorMsg('Apple sign in failed'); setAppleLoading(false); return; }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) { setErrorMsg(error.message); setAppleLoading(false); return; }
      router.replace('/');
    } catch (error: any) {
      if (error.code !== '1001') {
        setErrorMsg('Apple sign in failed. Please try again.');
      }
    }
    setAppleLoading(false);
  }

  async function handleForgotPassword() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) { setErrorMsg('Please enter your email address'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'sportbuddy://reset-password',
    });
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
      email,
      password,
      options: {
        emailRedirectTo: 'sportbuddy://email-confirmed',
        data: {
          first_name: firstName,
          last_name: lastName,
          nickname: nickname,
          favorite_sport: favoriteSport,
        }
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
          <Text style={styles.title}>SportBuddy 🏆</Text>
          <Text style={styles.subtitle}>Reset your password</Text>
          {errorMsg ? <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {errorMsg}</Text></View> : null}
          {successMsg ? <View style={styles.successBox}><Text style={styles.successText}>✅ {successMsg}</Text></View> : null}
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('email')}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrorMsg(''); setSuccessMsg(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('favoriteSport')}</Text>
            <TouchableOpacity onPress={() => Alert.alert('⭐ Favorite Sport', 'Select your favorite sport!', [{ text: 'Got it!' }])}>
              <Text style={styles.infoBtn}>ℹ️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sublabel}>{t('selectOneSport')}</Text>
          <View style={styles.sportsGrid}>
            {allSports.map((sport) => {
              const color = categoryColors[sport.category];
              const isSelected = favoriteSport === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportBtn, { backgroundColor: isSelected ? '#1D9E75' : color.bg }, isSelected && styles.sportBtnSelected]}
                  onPress={() => setFavoriteSport(sport.id)}
                >
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

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign In */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>{googleLoading ? 'Signing in...' : 'Continue with Google'}</Text>
        </TouchableOpacity>

        {/* Apple Sign In — само на iOS */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appleBtn}
            onPress={handleAppleSignIn}
            disabled={appleLoading}
          >
            <Text style={styles.appleIcon}>🍎</Text>
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
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285F4' },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#444' },
  appleBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#000', alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 10 },
  appleIcon: { fontSize: 18 },
  appleBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoBtn: { fontSize: 18 },
});