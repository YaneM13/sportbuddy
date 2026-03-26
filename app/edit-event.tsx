import BackButton from '@/components/BackButton';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/useLanguage';
import { useTheme } from '@/lib/useTheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ImageBackground, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = [
  { id: 'team', label: 'Team sports' },
  { id: 'individual', label: 'Individual sports' },
  { id: 'water', label: 'Water sports' },
  { id: 'watch', label: 'Watch sports' },
];

const sportsByCategory: any = {
  team: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  individual: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  water: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  watch: ['Stadium', 'Sports bar / Cafe', 'Open air'],
};

const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [players, setPlayers] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const isWatchSport = category === 'watch';

  useEffect(() => { fetchEvent(); }, []);

  async function fetchEvent() {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) { Alert.alert('Error', error.message); return; }
    setTitle(data.title); setCategory(data.category); setSport(data.sport); setLocation(data.location);
    setPlayers(data.max_players?.toString() || ''); setSkillLevel(data.skill_level || '');
    if (data.date) { const p = data.date.split('/'); setDate(new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]))); }
    if (data.time) { const p = data.time.split(':'); const d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1])); setStartTime(d); }
    if (data.end_time) { const p = data.end_time.split(':'); const d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1])); setEndTime(d); }
  }

  const formatDate = (d: Date) => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  const formatTime = (t: Date) => `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;

  function handleBack() {
    Alert.alert('Discard changes?', 'Any unsaved changes will be lost.',
      [{ text: 'Stay', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => router.back() }]
    );
  }

  async function handleSave() {
    if (!title || !category || !sport || !location) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await supabase.from('events').update({
      title, category, sport, location,
      date: formatDate(date), time: formatTime(startTime), end_time: formatTime(endTime),
      max_players: isWatchSport ? null : parseInt(players),
      skill_level: isWatchSport ? null : skillLevel,
    }).eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Success', 'Event updated!'); router.back(); }
    setLoading(false);
  }

  async function handleDelete() {
    Alert.alert('Delete event', 'Are you sure?',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else { Alert.alert('Deleted', 'Event deleted'); router.replace('/find-event' as any); }
      }}]
    );
  }

  const content = (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]} contentContainerStyle={styles.content}>
      <BackButton onPress={handleBack} />
      <Text style={[styles.title, { color: colors.accent }]}>Edit event</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={title} onChangeText={setTitle} placeholderTextColor={colors.textSecondary} />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <View style={styles.optionsRow}>
        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={[styles.optionBtn, { borderColor: colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' }, category === cat.id && styles.optionBtnActive]} onPress={() => { setCategory(cat.id); setSport(''); }}>
            <Text style={[styles.optionText, { color: colors.text }, category === cat.id && styles.optionTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {category !== '' && (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Sport</Text>
          <View style={styles.optionsRow}>
            {sportsByCategory[category].map((s: string) => (
              <TouchableOpacity key={s} style={[styles.optionBtn, { borderColor: colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' }, sport === s && styles.optionBtnActive]} onPress={() => setSport(s)}>
                <Text style={[styles.optionText, { color: colors.text }, sport === s && styles.optionTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={location} onChangeText={setLocation} placeholderTextColor={colors.textSecondary} />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
      <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowDatePicker(true)}>
        <Text style={[styles.pickerText, { color: colors.text }]}>{formatDate(date)}</Text>
      </TouchableOpacity>
      {showDatePicker && <DateTimePicker value={date} mode="date" minimumDate={new Date()} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }} />}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Start time</Text>
      <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowStartTimePicker(true)}>
        <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(startTime)}</Text>
      </TouchableOpacity>
      {showStartTimePicker && <DateTimePicker value={startTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour={true} onChange={(e, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }} />}

      <Text style={[styles.label, { color: colors.textSecondary }]}>End time</Text>
      <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowEndTimePicker(true)}>
        <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(endTime)}</Text>
      </TouchableOpacity>
      {showEndTimePicker && <DateTimePicker value={endTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour={true} onChange={(e, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />}

      {!isWatchSport && (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Number of players needed</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={players} onChangeText={setPlayers} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>Skill level</Text>
          <View style={styles.optionsRow}>
            {skillLevels.map((level) => (
              <TouchableOpacity key={level} style={[styles.optionBtn, { borderColor: colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' }, skillLevel === level && styles.optionBtnActive]} onPress={() => setSkillLevel(level)}>
                <Text style={[styles.optionText, { color: colors.text }, skillLevel === level && styles.optionTextActive]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save changes'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete event</Text>
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
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, fontSize: 15 },
  pickerBtn: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  pickerText: { fontSize: 15 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  optionBtnActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  optionText: { fontSize: 13 },
  optionTextActive: { color: '#fff', fontWeight: '500' },
  saveBtn: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  deleteBtn: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#FCEBEB', alignItems: 'center', marginBottom: 40 },
  deleteBtnText: { fontSize: 16, fontWeight: 'bold', color: '#E24B4A' },
});