import { sendPushNotification } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

export default function CreateEventScreen() {
  const params = useLocalSearchParams();
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

  useEffect(() => {
    if (params.pickedLat && params.pickedLon && params.pickedAddress) {
      setSelectedLat(parseFloat(params.pickedLat as string));
      setSelectedLon(parseFloat(params.pickedLon as string));
      setLocation(params.pickedAddress as string);
      setLocationSuggestions([]);
    }
  }, [params.pickedLat, params.pickedLon, params.pickedAddress]);

  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (t: Date) => {
    const hours = t.getHours().toString().padStart(2, '0');
    const minutes = t.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  async function searchLocation(query: string) {
    setLocation(query);
    setSelectedLat(null);
    setSelectedLon(null);
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
        );
        const json = await response.json();
        const mapped = (json.features || []).map((f: any) => ({
          place_id: f.properties.osm_id,
          display_name: [f.properties.name, f.properties.street, f.properties.city, f.properties.country].filter(Boolean).join(', '),
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
        }));
        setLocationSuggestions(mapped);
      } catch (e) {
        setLocationSuggestions([]);
      }
    }, 500);
  }

  function selectLocation(item: any) {
    setLocation(item.display_name);
    setSelectedLat(item.lat);
    setSelectedLon(item.lon);
    setLocationSuggestions([]);
  }

  async function handleCreate() {
    if (!title || !category || !sport || !location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isWatchSport && !players) {
      Alert.alert('Error', 'Please enter number of players');
      return;
    }

    setLoading(true);

    let latitude = selectedLat;
    let longitude = selectedLon;

    if (!latitude || !longitude) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const userLocation = await Location.getCurrentPositionAsync({});
        latitude = userLocation.coords.latitude;
        longitude = userLocation.coords.longitude;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Alert.alert('Error', 'You must be signed in to create an event');
      setLoading(false);
      return;
    }

    const { data: newEvent, error } = await supabase.from('events').insert({
      title,
      description,
      category,
      sport,
      location,
      date: formatDate(date),
      time: formatTime(startTime),
      end_time: formatTime(endTime),
      max_players: isWatchSport ? null : parseInt(players),
      skill_level: isWatchSport ? null : skillLevel,
      created_by: session.user.id,
      latitude,
      longitude,
      is_alert: isAlert,
    }).select().single();

    if (error) {
      Alert.alert('Error', JSON.stringify(error));
      setLoading(false);
      return;
    }

    if (isAlert && latitude && longitude) {
      const { data: nearbyUsers } = await supabase
        .from('profiles')
        .select('id, push_token, favorite_sport')
        .eq('favorite_sport', sport)
        .not('push_token', 'is', null);

      for (const profile of nearbyUsers || []) {
        if (profile.push_token && profile.id !== session.user.id) {
          await sendPushNotification(
            profile.push_token,
            '🔔 Alert Event!',
            `New ${sport} event nearby: ${title}`
          );
        }
      }
    }

    Alert.alert('Success', 'Event created!');
    router.replace('/');
    setLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create an event</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Football in the park"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>
        Description <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g. Bring your own ball, wear sports shoes..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.optionsRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.optionBtn, category === cat.id && styles.optionBtnActive]}
            onPress={() => { setCategory(cat.id); setSport(''); }}
          >
            <Text style={[styles.optionText, category === cat.id && styles.optionTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {category !== '' && (
        <>
          <Text style={styles.label}>Sport</Text>
          <View style={styles.optionsRow}>
            {sportsByCategory[category].map((s: string) => (
              <TouchableOpacity
                key={s}
                style={[styles.optionBtn, sport === s && styles.optionBtnActive]}
                onPress={() => setSport(s)}
              >
                <Text style={[styles.optionText, sport === s && styles.optionTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Location</Text>
      <View style={styles.locationRow}>
        <TextInput
          style={[styles.input, styles.locationInput]}
          placeholder="e.g. Todor Proeski Arena, Skopje"
          value={location}
          onChangeText={searchLocation}
        />
        <TouchableOpacity
          style={styles.mapPickBtn}
          onPress={() => router.push('/pick-location' as any)}
        >
          <Text style={styles.mapPickBtnText}>📍 Map</Text>
        </TouchableOpacity>
      </View>

      {locationSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {locationSuggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => selectLocation(item)}
            >
              <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {selectedLat && (
        <View style={styles.locationConfirmed}>
          <Text style={styles.locationConfirmedText}>✅ Location selected</Text>
        </View>
      )}

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.pickerText}>{formatDate(date)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          minimumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>Start time</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStartTimePicker(true)}>
        <Text style={styles.pickerText}>{formatTime(startTime)}</Text>
      </TouchableOpacity>
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={(event, selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime) setStartTime(selectedTime);
          }}
        />
      )}

      <Text style={styles.label}>End time</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowEndTimePicker(true)}>
        <Text style={styles.pickerText}>{formatTime(endTime)}</Text>
      </TouchableOpacity>
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={true}
          onChange={(event, selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime) setEndTime(selectedTime);
          }}
        />
      )}

      {!isWatchSport && (
        <>
          <Text style={styles.label}>Number of players needed</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5"
            value={players}
            onChangeText={setPlayers}
            keyboardType="numeric"
          />
        </>
      )}

      {isWatchSport && (
        <View style={styles.unlimitedBadge}>
          <Text style={styles.unlimitedText}>Unlimited participants</Text>
        </View>
      )}

      {!isWatchSport && (
        <>
          <Text style={styles.label}>Skill level</Text>
          <View style={styles.optionsRow}>
            {skillLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.optionBtn, skillLevel === level && styles.optionBtnActive]}
                onPress={() => setSkillLevel(level)}
              >
                <Text style={[styles.optionText, skillLevel === level && styles.optionTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.alertToggle, isAlert && styles.alertToggleActive]}
        onPress={() => setIsAlert(!isAlert)}
      >
        <Text style={[styles.alertToggleText, isAlert && styles.alertToggleTextActive]}>
          🔔 {isAlert ? 'Alert event — ON' : 'Alert event — OFF'}
        </Text>
        <Text style={[styles.alertToggleDesc, isAlert && styles.alertToggleDescActive]}>
          Notify all nearby users who love this sport
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
        <Text style={styles.createBtnText}>{loading ? 'Creating...' : 'Create event'}</Text>
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
    marginBottom: 16,
  },
  backText: {
    fontSize: 14,
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
  optional: {
    fontSize: 12,
    color: '#888',
    fontWeight: '400',
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    fontSize: 15,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  locationInput: {
    flex: 1,
    marginBottom: 8,
  },
  mapPickBtn: {
    backgroundColor: '#E1F5EE',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPickBtnText: {
    fontSize: 13,
    color: '#0F6E56',
    fontWeight: '500',
  },
  suggestions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 13,
    color: '#333',
  },
  locationConfirmed: {
    backgroundColor: '#E1F5EE',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  locationConfirmedText: {
    fontSize: 13,
    color: '#0F6E56',
    fontWeight: '500',
  },
  pickerBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  optionBtnActive: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  optionText: {
    fontSize: 13,
    color: '#444',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  unlimitedBadge: {
    backgroundColor: '#E1F5EE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  unlimitedText: {
    color: '#0F6E56',
    fontWeight: '500',
    fontSize: 14,
  },
  alertToggle: {
    backgroundColor: '#F1EFE8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  alertToggleActive: {
    backgroundColor: '#FAEEDA',
    borderColor: '#BA7517',
  },
  alertToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#444',
    marginBottom: 4,
  },
  alertToggleTextActive: {
    color: '#BA7517',
  },
  alertToggleDesc: {
    fontSize: 12,
    color: '#888',
  },
  alertToggleDescActive: {
    color: '#BA7517',
  },
  createBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});