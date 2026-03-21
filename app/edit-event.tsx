import BackButton from '@/components/BackButton';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
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

  useEffect(() => {
    fetchEvent();
  }, []);

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setTitle(data.title);
    setCategory(data.category);
    setSport(data.sport);
    setLocation(data.location);
    setPlayers(data.max_players?.toString() || '');
    setSkillLevel(data.skill_level || '');

    if (data.date) {
      const parts = data.date.split('/');
      setDate(new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
    }
    if (data.time) {
      const timeParts = data.time.split(':');
      const d = new Date();
      d.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
      setStartTime(d);
    }
    if (data.end_time) {
      const timeParts = data.end_time.split(':');
      const d = new Date();
      d.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
      setEndTime(d);
    }
  }

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

  function handleBack() {
    Alert.alert(
      'Discard changes?',
      'Are you sure you want to go back? Any unsaved changes will be lost.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  }

  async function handleSave() {
    if (!title || !category || !sport || !location) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('events')
      .update({
        title,
        category,
        sport,
        location,
        date: formatDate(date),
        time: formatTime(startTime),
        end_time: formatTime(endTime),
        max_players: isWatchSport ? null : parseInt(players),
        skill_level: isWatchSport ? null : skillLevel,
      })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Event updated!');
      router.back();
    }
    setLoading(false);
  }

  async function handleDelete() {
    Alert.alert(
      'Delete event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) Alert.alert('Error', error.message);
            else {
              Alert.alert('Deleted', 'Event deleted successfully');
              router.replace('/find-event' as any);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <BackButton onPress={handleBack} />

      <Text style={styles.title}>Edit event</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

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
      <TextInput style={styles.input} value={location} onChangeText={setLocation} />

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
            value={players}
            onChangeText={setPlayers}
            keyboardType="numeric"
          />
        </>
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

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save changes'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete event</Text>
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
    marginBottom: 20,
    fontSize: 15,
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
  saveBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteBtn: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#FCEBEB',
    alignItems: 'center',
    marginBottom: 40,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E24B4A',
  },
});