import BackButton from '@/components/BackButton';
import { useLanguage, useTheme } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = [
  { id: 'team', label: 'Team sports' },
  { id: 'individual', label: 'Individual sports' },
  { id: 'water', label: 'Water sports' },
  { id: 'watch', label: 'Watch sports' },
];

const sportsByCategory: any = {
  team: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  individual: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Chess', 'Billiards'],
  water: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing', 'Swimming', 'Surfing'],
  watch: ['Stadium', 'Sports bar / Cafe', 'Open air'],
};

const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const genderOptions = [
  { id: 'male', label: '♂️ Male', color: '#185FA5' },
  { id: 'female', label: '♀️ Female', color: '#E24B4A' },
  { id: 'mixed', label: '⚥ Mixed', color: '#1D9E75' },
];

function TimePickerModal({ visible, value, onConfirm, onCancel, isDark, colors, title }: any) {
  const [selectedHour, setSelectedHour] = useState(value.getHours().toString().padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(
    MINUTES.reduce((prev, curr) =>
      Math.abs(parseInt(curr) - value.getMinutes()) < Math.abs(parseInt(prev) - value.getMinutes()) ? curr : prev
    )
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.timeModalOverlay}>
        <View style={[styles.timeModalContent, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }]}>
          <Text style={[styles.timeModalTitle, { color: colors.text }]}>{title}</Text>
          <View style={styles.timePickerRow}>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Hour</Text>
              <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <TouchableOpacity key={h} style={[styles.timeItem, selectedHour === h && { backgroundColor: colors.accent, borderRadius: 8 }]} onPress={() => setSelectedHour(h)}>
                    <Text style={[styles.timeItemText, { color: selectedHour === h ? '#fff' : colors.text }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Min</Text>
              <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <TouchableOpacity key={m} style={[styles.timeItem, selectedMinute === m && { backgroundColor: colors.accent, borderRadius: 8 }]} onPress={() => setSelectedMinute(m)}>
                    <Text style={[styles.timeItemText, { color: selectedMinute === m ? '#fff' : colors.text }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          <View style={styles.timeModalButtons}>
            <TouchableOpacity style={[styles.timeModalBtn, { borderColor: colors.cardBorder }]} onPress={onCancel}>
              <Text style={[styles.timeModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.timeModalBtn, { backgroundColor: colors.accent }]} onPress={() => {
              const d = new Date(); d.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0); onConfirm(d);
            }}>
              <Text style={[styles.timeModalBtnText, { color: '#fff' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [sport, setSport] = useState('');
  const [gender, setGender] = useState('mixed');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLon, setSelectedLon] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [players, setPlayers] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<any>(null);
  const isWatchSport = category === 'watch';

  useEffect(() => { fetchEvent(); }, []);

  useFocusEffect(useCallback(() => {
    async function checkPickedLocation() {
      try {
        const picked = await AsyncStorage.getItem('pickedLocation');
        if (picked) {
          const { lat, lon, address } = JSON.parse(picked);
          setSelectedLat(lat); setSelectedLon(lon); setLocation(address); setLocationSuggestions([]);
          await AsyncStorage.removeItem('pickedLocation');
        }
      } catch (e) {}
    }
    checkPickedLocation();
  }, []));

  async function fetchEvent() {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) { return; }
    setTitle(data.title); setCategory(data.category); setSport(data.sport); setLocation(data.location);
    setSelectedLat(data.latitude); setSelectedLon(data.longitude);
    setPlayers(data.max_players?.toString() || ''); setSkillLevel(data.skill_level || '');
    setGender(data.gender || 'mixed');
    if (data.date) { const p = data.date.split('/'); setDate(new Date(parseInt(p[2]), parseInt(p[1])-1, parseInt(p[0]))); }
    if (data.time) { const p = data.time.split(':'); const d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1])); setStartTime(d); }
    if (data.end_time) { const p = data.end_time.split(':'); const d = new Date(); d.setHours(parseInt(p[0]), parseInt(p[1])); setEndTime(d); }
  }

  async function searchLocation(query: string) {
    setLocation(query); setSelectedLat(null); setSelectedLon(null);
    if (query.length < 3) { setLocationSuggestions([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`);
        const json = await response.json();
        setLocationSuggestions((json.features || []).map((f: any) => ({
          place_id: f.properties.osm_id,
          display_name: [f.properties.name, f.properties.street, f.properties.city, f.properties.country].filter(Boolean).join(', '),
          lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
        })));
      } catch (e) { setLocationSuggestions([]); }
    }, 500);
  }

  function selectLocation(item: any) {
    setLocation(item.display_name); setSelectedLat(item.lat); setSelectedLon(item.lon); setLocationSuggestions([]);
  }

  const formatDate = (d: Date) => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  const formatTime = (d: Date) => `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

  function handleBack() {
    Alert.alert('Discard changes?', 'Any unsaved changes will be lost.',
      [{ text: 'Stay', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: () => router.back() }]
    );
  }

  async function handleSave() {
    if (loading) return;
    if (!title || !category || !sport || !location) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await supabase.from('events').update({
      title, category, sport, location, gender,
      latitude: selectedLat,
      longitude: selectedLon,
      date: formatDate(date), time: formatTime(startTime), end_time: formatTime(endTime),
      max_players: isWatchSport ? null : parseInt(players),
      skill_level: isWatchSport ? null : skillLevel,
    }).eq('id', id);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Success', 'Event updated!'); router.back(); }
    setLoading(false);
  }

  async function handleDelete() {
    if (loading) return;
    Alert.alert('Delete event', 'Are you sure?',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) { Alert.alert('Error', error.message); setLoading(false); }
        else { router.replace('/find-event' as any); }
      }}]
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
        <View style={styles.locationRow}>
          <TextInput
            style={[styles.input, styles.locationInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            value={location}
            onChangeText={searchLocation}
            placeholderTextColor={colors.textSecondary}
            placeholder="Search location..."
          />
          <TouchableOpacity style={[styles.mapPickBtn, { backgroundColor: colors.accentLight }]} onPress={() => router.push('/pick-location' as any)}>
            <Text style={[styles.mapPickBtnText, { color: colors.accentText }]}>📍 Map</Text>
          </TouchableOpacity>
        </View>

        {locationSuggestions.length > 0 && (
          <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {locationSuggestions.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.suggestionItem, { borderBottomColor: colors.cardBorder }]} onPress={() => selectLocation(item)}>
                <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedLat && <View style={[styles.locationConfirmed, { backgroundColor: colors.accentLight }]}><Text style={[styles.locationConfirmedText, { color: colors.accentText }]}>✅ Location selected</Text></View>}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.pickerText, { color: colors.text }]}>{formatDate(date)}</Text>
        </TouchableOpacity>
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.timeModalOverlay}>
            <View style={[styles.timeModalContent, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }]}>
              <Text style={[styles.timeModalTitle, { color: colors.text }]}>Date</Text>
              <View style={styles.timePickerRow}>
                <View style={styles.timeColumn}>
                  <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Day</Text>
                  <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((d) => (
                      <TouchableOpacity key={d} style={[styles.timeItem, date.getDate().toString().padStart(2,'0') === d && { backgroundColor: colors.accent, borderRadius: 8 }]} onPress={() => { const nd = new Date(date); nd.setDate(parseInt(d)); setDate(nd); }}>
                        <Text style={[styles.timeItemText, { color: date.getDate().toString().padStart(2,'0') === d ? '#fff' : colors.text }]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.timeColumn}>
                  <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Month</Text>
                  <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m) => (
                      <TouchableOpacity key={m} style={[styles.timeItem, (date.getMonth()+1).toString().padStart(2,'0') === m && { backgroundColor: colors.accent, borderRadius: 8 }]} onPress={() => { const nd = new Date(date); nd.setMonth(parseInt(m)-1); setDate(nd); }}>
                        <Text style={[styles.timeItemText, { color: (date.getMonth()+1).toString().padStart(2,'0') === m ? '#fff' : colors.text }]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.timeColumn}>
                  <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Year</Text>
                  <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                    {[2025, 2026, 2027].map((y) => (
                      <TouchableOpacity key={y} style={[styles.timeItem, date.getFullYear() === y && { backgroundColor: colors.accent, borderRadius: 8 }]} onPress={() => { const nd = new Date(date); nd.setFullYear(y); setDate(nd); }}>
                        <Text style={[styles.timeItemText, { color: date.getFullYear() === y ? '#fff' : colors.text }]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={styles.timeModalButtons}>
                <TouchableOpacity style={[styles.timeModalBtn, { borderColor: colors.cardBorder }]} onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.timeModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.timeModalBtn, { backgroundColor: colors.accent }]} onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.timeModalBtnText, { color: '#fff' }]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Start time</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowStartTimePicker(true)}>
          <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(startTime)}</Text>
        </TouchableOpacity>
        <TimePickerModal visible={showStartTimePicker} value={startTime} title="Start time" isDark={isDark} colors={colors} onCancel={() => setShowStartTimePicker(false)} onConfirm={(d: Date) => { setStartTime(d); setShowStartTimePicker(false); }} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>End time</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowEndTimePicker(true)}>
          <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(endTime)}</Text>
        </TouchableOpacity>
        <TimePickerModal visible={showEndTimePicker} value={endTime} title="End time" isDark={isDark} colors={colors} onCancel={() => setShowEndTimePicker(false)} onConfirm={(d: Date) => { setEndTime(d); setShowEndTimePicker(false); }} />

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

        {/* Gender */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Gender</Text>
        <View style={styles.optionsRow}>
          {genderOptions.map((g) => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.optionBtn,
                { borderColor: gender === g.id ? g.color : colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' },
                gender === g.id && { backgroundColor: g.color, borderColor: g.color }
              ]}
              onPress={() => setGender(g.id)}
            >
              <Text style={[styles.optionText, { color: gender === g.id ? '#fff' : colors.text }]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save changes'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
          onPress={handleDelete}
          disabled={loading}
        >
          <Text style={styles.deleteBtnText}>Delete event</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, fontSize: 15 },
  locationRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  locationInput: { flex: 1, marginBottom: 8 },
  mapPickBtn: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1F5EE', minWidth: 70 },
  mapPickBtnText: { fontSize: 13, fontWeight: '500' },
  suggestions: { borderRadius: 12, borderWidth: 0.5, marginBottom: 8, overflow: 'hidden' },
  suggestionItem: { padding: 14, borderBottomWidth: 0.5 },
  suggestionText: { fontSize: 13 },
  locationConfirmed: { padding: 10, borderRadius: 10, marginBottom: 16 },
  locationConfirmedText: { fontSize: 13, fontWeight: '500' },
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
  timeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  timeModalContent: { width: 320, borderRadius: 20, padding: 24 },
  timeModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeColumn: { flex: 1, alignItems: 'center' },
  timeColumnLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  timeScroll: { height: 180 },
  timeItem: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginVertical: 2 },
  timeItemText: { fontSize: 18, fontWeight: '500' },
  timeColon: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  timeModalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  timeModalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  timeModalBtnText: { fontSize: 15, fontWeight: '600' },
});