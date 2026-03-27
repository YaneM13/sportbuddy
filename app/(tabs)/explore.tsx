import { useTheme } from '@/lib/AppContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const sports = [
  {
    category: 'Team sports',
    light: { bg: '#E1F5EE', text: '#0F6E56', card: '#fff', border: '#e0e0e0' },
    dark: { bg: '#0F3D2E', text: '#9FE1CB', card: '#1E2D3D', border: '#2A3D50' },
    items: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  },
  {
    category: 'Individual sports',
    light: { bg: '#E6F1FB', text: '#185FA5', card: '#fff', border: '#e0e0e0' },
    dark: { bg: '#0C1E35', text: '#B5D4F4', card: '#1E2D3D', border: '#2A3D50' },
    items: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  },
  {
    category: 'Water sports',
    light: { bg: '#EEEDFE', text: '#534AB7', card: '#fff', border: '#e0e0e0' },
    dark: { bg: '#26215C', text: '#CECBF6', card: '#1E2D3D', border: '#2A3D50' },
    items: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  },
  {
    category: 'Watch sports',
    light: { bg: '#FAECE7', text: '#993C1D', card: '#fff', border: '#e0e0e0' },
    dark: { bg: '#4A1B0C', text: '#F5C4B3', card: '#1E2D3D', border: '#2A3D50' },
    items: ['Stadium', 'Sports bar / Cafe', 'Open air'],
  },
];

export default function AllSportsScreen() {
  const { isDark, colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.accent }]}>All Sports</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Browse all supported sports</Text>

      {sports.map((cat) => {
        const c = isDark ? cat.dark : cat.light;
        return (
          <View key={cat.category} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.categoryTitle, { color: c.text }]}>{cat.category}</Text>
            <View style={styles.tagsContainer}>
              {cat.items.map((sport) => (
                <View key={sport} style={[styles.tag, { backgroundColor: c.bg }]}>
                  <Text style={[styles.tagText, { color: c.text }]}>{sport}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  card: { marginBottom: 24, padding: 16, borderRadius: 16, borderWidth: 0.5 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tagText: { fontSize: 13, fontWeight: '500' },
});