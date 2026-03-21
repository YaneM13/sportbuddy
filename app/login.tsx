import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  async function handleStep1() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setStep(2);
  }

  async function handleRegister() {
    if (!firstName || !lastName || !nickname) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!favoriteSport) {
      Alert.alert('Error', 'Please select your favorite sport');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        nickname,
        favorite_sport: favoriteSport,
      });

      Alert.alert(
        'Welcome to SportBuddy! 🏆',
        'Your account has been created! We recommend adding a profile photo so other players can recognise you.',
        [
          { text: 'Add photo later', onPress: () => router.replace('/') },
          { text: 'Add photo now', onPress: () => router.replace('/settings' as any) },
        ]
      );
    }
    setLoading(false);
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    else router.replace('/');
    setLoading(false);
  }

  if (!isLogin && step === 2) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>SportBuddy 🏆</Text>
          <Text style={styles.subtitle}>Tell us about yourself</Text>

          <Text style={styles.stepText}>Step 2 of 2</Text>

          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#aaa"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            placeholderTextColor="#aaa"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>Nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a nickname"
            placeholderTextColor="#aaa"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Favorite sport</Text>
          <Text style={styles.sublabel}>Select one sport you love most</Text>
          <View style={styles.sportsGrid}>
            {allSports.map((sport) => {
              const color = categoryColors[sport.category];
              const isSelected = favoriteSport === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportBtn,
                    { backgroundColor: isSelected ? '#1D9E75' : color.bg },
                    isSelected && styles.sportBtnSelected,
                  ]}
                  onPress={() => setFavoriteSport(sport.id)}
                >
                  <Text style={[styles.sportBtnText, { color: isSelected ? '#fff' : color.text }]}>
                    {sport.id}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.buttonGreen} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonTextGreen}>{loading ? 'Creating account...' : 'Create account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep(1)} style={styles.backStepBtn}>
            <Text style={styles.backStepText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>SportBuddy 🏆</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </Text>

        {!isLogin && <Text style={styles.stepText}>Step 1 of 2</Text>}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.buttonGreen}
          onPress={isLogin ? handleLogin : handleStep1}
          disabled={loading}
        >
          <Text style={styles.buttonTextGreen}>
            {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Next →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setStep(1); }}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepText: {
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sportBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },
  sportBtnSelected: {
    backgroundColor: '#1D9E75',
  },
  sportBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonGreen: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  buttonTextGreen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  switchText: {
    fontSize: 14,
    color: '#1D9E75',
    textAlign: 'center',
  },
  backStepBtn: {
    alignItems: 'center',
    marginTop: 8,
  },
  backStepText: {
    fontSize: 14,
    color: '#888',
  },
});