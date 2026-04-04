import { useLanguage, useTheme } from '@/lib/AppContext';
import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const sportsByCategory: any = {
  team: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  individual: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  water: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  watch: ['Stadium', 'Sports bar / Cafe', 'Open air'],
};

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

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

export default function CreateEventScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [sport, setSport] = useState('');
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
  const [isAlert, setIsAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<any>(null);
  const isWatchSport = category === 'watch';

  const categories = [
    { id: 'team', label: t('teamSports') },
    { id: 'individual', label: t('individualSports') },
    { id: 'water', label: t('waterSports') },
    { id: 'watch', label: t('watchSports') },
  ];

  const skillLevels = [
    { id: 'Beginner', label: t('beginner') },
    { id: 'Intermediate', label: t('intermediate') },
    { id: 'Advanced', label: t('advanced') },
  ];

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

  const formatDate = (d: Date) => `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  const formatTime = (d: Date) => `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

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

  async function handleCreate() {
    if (!title || !category || !sport || !location) { Alert.alert(t('error'), 'Please fill in all fields'); return; }
    if (!isWatchSport && !players) { Alert.alert(t('error'), 'Please enter number of players'); return; }
    setLoading(true);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert(t('error'), 'Location permission is needed'); setLoading(false); return; }
    const userLoc = await Location.getCurrentPositionAsync({});

    let latitude = selectedLat, longitude = selectedLon;

    if (!latitude || !longitude) {
      latitude = userLoc.coords.latitude;
      longitude = userLoc.coords.longitude;
    } else {
      const distance = getDistanceKm(userLoc.coords.latitude, userLoc.coords.longitude, latitude, longitude);
      if (distance > 20) {
        Alert.alert(t('error'), 'Event location must be within 20km of your current location');
        setLoading(false);
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { Alert.alert(t('error'), 'You must be signed in'); setLoading(false); return; }
    const { error } = await supabase.from('events').insert({
      title, description, category, sport, location,
      date: formatDate(date), time: formatTime(startTime), end_time: formatTime(endTime),
      max_players: isWatchSport ? null : parseInt(players),
      skill_level: isWatchSport ? null : skillLevel,
      created_by: session.user.id, latitude, longitude, is_alert: isAlert,
    }).select().single();
    if (error) { Alert.alert(t('error'), JSON.stringify(error)); setLoading(false); return; }
    if (isAlert && latitude && longitude) {
      const { data: nearbyUsers } = await supabase.from('profiles').select('id, push_token, favorite_sport').eq('favorite_sport', sport).not('push_token', 'is', null);
      for (const profile of nearbyUsers || []) {
        if (profile.push_token && profile.id !== session.user.id) await sendPushNotification(profile.push_token, '🔔 Alert Event!', `New ${sport} event nearby: ${title}`);
      }
    }
    Alert.alert(t('success'), 'Event created!');
    router.replace('/');
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0F1923' : '#fff' }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.accent }]}>{t('createAnEvent')}</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('title')}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="e.g. Football in the park" placeholderTextColor={colors.textSecondary} value={title} onChangeText={setTitle} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('description')} <Text style={{ fontSize: 12, fontWeight: '400' }}>{t('optional')}</Text></Text>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="e.g. Bring your own ball..." placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} multiline numberOfLines={3} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('category')}</Text>
        <View style={styles.optionsRow}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.optionBtn, { borderColor: colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' }, category === cat.id && styles.optionBtnActive]} onPress={() => { setCategory(cat.id); setSport(''); }}>
              <Text style={[styles.optionText, { color: colors.text }, category === cat.id && styles.optionTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {category !== '' && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('sport')}</Text>
            <View style={styles.optionsRow}>
              {sportsByCategory[category].map((s: string) => (
                <TouchableOpacity key={s} style={[styles.optionBtn, { borderColor: colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' }, sport === s && styles.optionBtnActive]} onPress={() => setSport(s)}>
                  <Text style={[styles.optionText, { color: colors.text }, sport === s && styles.optionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('location')}</Text>
        <View style={styles.locationRow}>
          <TextInput style={[styles.input, styles.locationInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="e.g. Todor Proeski Arena" placeholderTextColor={colors.textSecondary} value={location} onChangeText={searchLocation} />
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
        {selectedLat && <View style={[styles.locationConfirmed, { backgroundColor: colors.accentLight }]}><Text style={[styles.locationConfirmedText, { color: colors.accentText }]}>{t('locationSelected')}</Text></View>}

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('date')}</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.pickerText, { color: colors.text }]}>{formatDate(date)}</Text>
        </TouchableOpacity>
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={styles.timeModalOverlay}>
            <View style={[styles.timeModalContent, { backgroundColor: isDark ? '#1E2D3D' : '#fff' }]}>
              <Text style={[styles.timeModalTitle, { color: colors.text }]}>{t('date')}</Text>
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

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('startTime')}</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowStartTimePicker(true)}>
          <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(startTime)}</Text>
        </TouchableOpacity>
        <TimePickerModal visible={showStartTimePicker} value={startTime} title={t('startTime')} isDark={isDark} colors={colors} onCancel={() => setShowStartTimePicker(false)} onConfirm={(d: Date) => { setStartTime(d); setShowStartTimePicker(false); }} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('endTime')}</Text>
        <TouchableOpacity style={[styles.pickerBtn, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowEndTimePicker(true)}>
          <Text style={[styles.pickerText, { color: colors.text }]}>{formatTime(endTime)}</Text>
        </TouchableOpacity>
        <TimePickerModal visible={showEndTimePicker} value={endTime} title={t('endTime')} isDark={isDark} colors={colors} onCancel={() => setShowEndTimePicker(false)} onConfirm={(d: Date) => { setEndTime(d); setShowEndTimePicker(false); }} />

        {!isWatchSport && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('playersNeeded')}</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="e.g. 5" placeholderTextColor={colors.textSecondary} value={players} onChangeText={setPlayers} keyboardType="numeric" />
          </>
        )}

        {isWatchSport && <View style={[styles.unlimitedBadge, { backgroundColor: colors.accentLight }]}><Text style={[styles.unlimitedText, { color: colors.accentText }]}>{t('unlimited')}</Text></View>}

        {!isWatchSport && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('skillLevel')}</Text>
            <View style={styles.optionsRow}>
              {skillLevels.map((level) => (
                <TouchableOpacity key={level.id} style={[styles.optionBtn, { borderColor: colors.inputBorder, backgroundColor: isDark ? colors.inputBg : '#fff' }, skillLevel === level.id && styles.optionBtnActive]} onPress={() => setSkillLevel(level.id)}>
                  <Text style={[styles.optionText, { color: colors.text }, skillLevel === level.id && styles.optionTextActive]}>{level.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={[styles.alertToggle, { backgroundColor: isDark ? '#1E2D3D' : '#F1EFE8', borderColor: colors.cardBorder }, isAlert && styles.alertToggleActive]} onPress={() => setIsAlert(!isAlert)}>
          <Text style={[styles.alertToggleText, { color: colors.text }, isAlert && styles.alertToggleTextActive]}>🔔 {isAlert ? t('alertEventOn') : t('alertEventOff')}</Text>
          <Text style={[styles.alertToggleDesc, { color: colors.textSecondary }, isAlert && styles.alertToggleDescActive]}>{t('alertEventDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          <Text style={styles.createBtnText}>{loading ? t('creating') : t('createEvent')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8, fontSize: 15 },
  textArea: { height: 90, textAlignVertical: 'top', marginBottom: 20 },
  locationRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  locationInput: { flex: 1, marginBottom: 8 },
  mapPickBtn: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
  unlimitedBadge: { padding: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  unlimitedText: { fontWeight: '500', fontSize: 14 },
  alertToggle: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  alertToggleActive: { backgroundColor: 'rgba(65,57,12,0.8)', borderColor: '#BA7517' },
  alertToggleText: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  alertToggleTextActive: { color: '#BA7517' },
  alertToggleDesc: { fontSize: 12 },
  alertToggleDescActive: { color: '#BA7517' },
  createBtn: { width: '100%', padding: 18, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', marginTop: 8, marginBottom: 40 },
  createBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
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