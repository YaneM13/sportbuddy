import { useTheme } from '@/lib/useTheme';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';

const sports = [
  {
    category: 'Team sports',
    light: { bg: '#E1F5EE', text: '#0F6E56', card: '#fff', border: '#e0e0e0' },
    dark: { bg: 'rgba(15,61,46,0.8)', text: '#9FE1CB', card: 'rgba(30,45,61,0.8)', border: '#2A3D50' },
    items: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  },
  {
    category: 'Individual sports',
    light: { bg: '#E6F1FB', text: '#185FA5', card: '#fff', border: '#e0e0e0' },
    dark: { bg: 'rgba(12,30,53,0.8)', text: '#B5D4F4', card: 'rgba(30,45,61,0.8)', border: '#2A3D50' },
    items: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  },
  {
    category: 'Water sports',
    light: { bg: '#EEEDFE', text: '#534AB7', card: '#fff', border: '#e0e0e0' },
    dark: { bg: 'rgba(38,33,92,0.8)', text: '#CECBF6', card: 'rgba(30,45,61,0.8)', border: '#2A3D50' },
    items: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  },
  {
    category: 'Watch sports',
    light: { bg: '#FAECE7', text: '#993C1D', card: '#fff', border: '#e0e0e0' },
    dark: { bg: 'rgba(74,27,12,0.8)', text: '#F5C4B3', card: 'rgba(30,45,61,0.8)', border: '#2A3D50' },
    items: ['Stadium', 'Sports bar / Cafe', 'Open air'],
  },
];

export default function AllSportsScreen() {
  const { isDark, colors } = useTheme();

  const content = (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]} contentContainerStyle={styles.content}>
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

  if (isDark) {
    return (
      <ImageBackground source={require('../../assets/images/sports-bg.png')} style={styles.bg} blurRadius={3}>
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
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  card: { marginBottom: 24, padding: 16, borderRadius: 16, borderWidth: 0.5 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tagText: { fontSize: 13, fontWeight: '500' },
});