import { useLanguage } from '@/lib/useLanguage';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const categories = [
  {
    id: 'team',
    labelKey: 'teamSports',
    emoji: '👥',
    color: { bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
    sports: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  },
  {
    id: 'individual',
    labelKey: 'individualSports',
    emoji: '🏃',
    color: { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
    sports: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  },
  {
    id: 'water',
    labelKey: 'waterSports',
    emoji: '🌊',
    color: { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6' },
    sports: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  },
  {
    id: 'watch',
    labelKey: 'watchSports',
    emoji: '🏟️',
    color: { bg: '#FAECE7', text: '#993C1D', border: '#F5C4B3' },
    sports: ['Stadium', 'Sports bar / Cafe', 'Open air'],
  },
];

export default function FindEventScreen() {
  const { t } = useLanguage();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.replace('/' as any)} style={styles.backBtn}>
        <Text style={styles.backText}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('findAnEvent')}</Text>
      <Text style={styles.subtitle}>{t('eventsWithin20km')}</Text>

      {categories.map((cat) => {
        const isOpen = openCategory === cat.id;
        return (
          <View key={cat.id} style={[styles.categoryCard, { borderColor: cat.color.border }]}>
            <TouchableOpacity
              style={[styles.categoryHeader, { backgroundColor: cat.color.bg }]}
              onPress={() => setOpenCategory(isOpen ? null : cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, { color: cat.color.text }]}>{t(cat.labelKey)}</Text>
              <Text style={[styles.categoryChevron, { color: cat.color.text }]}>
                {isOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={styles.sportsContainer}>
                {cat.sports.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={styles.sportRow}
                    onPress={() => router.push({ pathname: '/events-by-sport', params: { sport, category: cat.id } } as any)}
                  >
                    <Text style={styles.sportRowText}>{sport}</Text>
                    <Text style={styles.sportRowArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.mapBtn}
        onPress={() => router.push('/all-events-map' as any)}
      >
        <Text style={styles.mapBtnText}>{t('viewAllOnMap')}</Text>
        <Text style={styles.mapBtnSub}>{t('seeAllNearbyEvents')}</Text>
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
    fontSize: 17,
    color: '#1D9E75',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  categoryCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  categoryChevron: {
    fontSize: 12,
  },
  sportsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 4,
  },
  sportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
  },
  sportRowText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  sportRowArrow: {
    fontSize: 16,
    color: '#888',
  },
  mapBtn: {
    backgroundColor: '#1D9E75',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  mapBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  mapBtnSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
});