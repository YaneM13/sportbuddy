import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
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

export default function PersonalDetailsScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [favoriteSport, setFavoriteSport] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setNickname(data.nickname || '');
      setAge(data.age?.toString() || '');
      setCity(data.city || '');
      setFavoriteSport(data.favorite_sport || '');
    }
  }

  async function handleSave() {
    if (!firstName || !lastName || !nickname) { Alert.alert(t('error'), 'Please enter your first name, last name and nickname'); return; }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      first_name: firstName,
      last_name: lastName,
      nickname,
      age: age ? parseInt(age) : null,
      city,
      favorite_sport: favoriteSport || null,
    });
    if (error) Alert.alert(t('error'), error.message);
    else { Alert.alert(t('success'), 'Details saved!'); router.back(); }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.accent }]}>{t('personalDetails')}</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('firstName')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={t('firstName')} placeholderTextColor={colors.textSecondary} value={firstName} onChangeText={setFirstName} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('lastName')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={t('lastName')} placeholderTextColor={colors.textSecondary} value={lastName} onChangeText={setLastName} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('nickname')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={t('nickname')} placeholderTextColor={colors.textSecondary} value={nickname} onChangeText={setNickname} autoCapitalize="none" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Age</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Enter age" placeholderTextColor={colors.textSecondary} value={age} onChangeText={setAge} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Enter city" placeholderTextColor={colors.textSecondary} value={city} onChangeText={setCity} />

        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>⭐ Favorite Sport</Text>
          <TouchableOpacity onPress={() => Alert.alert(
            '⭐ Favorite Sport',
            'When someone creates an Alert Event for your favorite sport, you will receive a push notification so you never miss a game nearby!',
            [{ text: 'Got it!' }]
          )}>
            <Text style={styles.infoBtn}>ℹ️</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Select your favorite sport</Text>

        <View style={styles.sportsGrid}>
          {allSports.map((sport) => {
            const color = categoryColors[sport.category];
            const isSelected = favoriteSport === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[
                  styles.sportBtn,
                  { backgroundColor: isSelected ? '#1D9E75' : isDark ? '#1E2D3D' : color.bg },
                  isSelected && styles.sportBtnSelected
                ]}
                onPress={() => setFavoriteSport(favoriteSport === sport.id ? '' : sport.id)}
              >
                <Text style={[styles.sportBtnText, { color: isSelected ? '#fff' : isDark ? color.bg : color.text }]}>
                  {sport.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? t('saving') : t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  sublabel: { fontSize: 12, marginBottom: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0 },
  infoBtn: { fontSize: 18 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, fontSize: 15 },
  sportsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  sportBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  sportBtnSelected: { backgroundColor: '#1D9E75' },
  sportBtnText: { fontSize: 13, fontWeight: '500' },
  saveBtn: { width: '100%', padding: 16, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});