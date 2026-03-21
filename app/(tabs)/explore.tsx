import { ScrollView, StyleSheet, Text, View } from 'react-native';

const sports = [
  {
    category: 'Team sports',
    color: '#E1F5EE',
    textColor: '#0F6E56',
    items: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  },
  {
    category: 'Individual sports',
    color: '#E6F1FB',
    textColor: '#185FA5',
    items: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  },
  {
    category: 'Water sports',
    color: '#EEEDFE',
    textColor: '#534AB7',
    items: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  },
  {
    category: 'Watch sports',
    color: '#FAECE7',
    textColor: '#993C1D',
    items: ['Stadium', 'Sports bar / Cafe', 'Open air'],
  },
];

export default function AllSportsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>All Sports</Text>
      <Text style={styles.subtitle}>Browse all supported sports</Text>

      {sports.map((cat) => (
        <View key={cat.category} style={styles.card}>
          <Text style={[styles.categoryTitle, { color: cat.textColor }]}>{cat.category}</Text>
          <View style={styles.tagsContainer}>
            {cat.items.map((sport) => (
              <View key={sport} style={[styles.tag, { backgroundColor: cat.color }]}>
                <Text style={[styles.tagText, { color: cat.textColor }]}>{sport}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  card: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
});