import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/useLanguage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

export default function PersonalDetailsScreen() {
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setNickname(data.nickname || '');
      setAge(data.age?.toString() || '');
      setCity(data.city || '');
    }
  }

  async function handleSave() {
    if (!firstName || !lastName || !nickname) {
      Alert.alert(t('error'), 'Please enter your first name, last name and nickname');
      return;
    }

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
    });

    if (error) Alert.alert(t('error'), error.message);
    else {
      Alert.alert(t('success'), 'Details saved!');
      router.back();
    }
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('personalDetails')}</Text>

      <Text style={styles.label}>{t('firstName')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('firstName')}
        value={firstName}
        onChangeText={setFirstName}
      />

      <Text style={styles.label}>{t('lastName')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('lastName')}
        value={lastName}
        onChangeText={setLastName}
      />

      <Text style={styles.label}>{t('nickname')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('nickname')}
        value={nickname}
        onChangeText={setNickname}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter city"
        value={city}
        onChangeText={setCity}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? t('saving') : t('save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 17,
    color: '#1D9E75',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    fontSize: 15,
  },
  saveBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});