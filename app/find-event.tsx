import { useLanguage } from '@/lib/useLanguage';
import { useTheme } from '@/lib/useTheme';
import { router } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const categories = [
  {
    id: 'team',
    labelKey: 'teamSports',
    emoji: '👥',
    color: { bg: '#E1F5EE', text: '#0F6E56', border: '#9FE1CB' },
    darkColor: { bg: 'rgba(15,61,46,0.8)', text: '#9FE1CB', border: '#0F6E56' },
    sports: ['Football', 'Basketball', 'Basketball 3x3', 'Volleyball', 'Beach Volleyball', 'Rugby', 'Cricket', 'Handball'],
  },
  {
    id: 'individual',
    labelKey: 'individualSports',
    emoji: '🏃',
    color: { bg: '#E6F1FB', text: '#185FA5', border: '#B5D4F4' },
    darkColor: { bg: 'rgba(12,30,53,0.8)', text: '#B5D4F4', border: '#185FA5' },
    sports: ['Tennis', 'Ping Pong', 'Roller Skating', 'Cycling', 'Padel', 'Swimming'],
  },
  {
    id: 'water',
    labelKey: 'waterSports',
    emoji: '🌊',
    color: { bg: '#EEEDFE', text: '#534AB7', border: '#CECBF6' },
    darkColor: { bg: 'rgba(38,33,92,0.8)', text: '#CECBF6', border: '#534AB7' },
    sports: ['Kayaking', 'Paddleboarding', 'Rafting', 'Fishing'],
  },
  {
    id: 'watch',
    labelKey: 'watchSports',
    emoji: '🏟️',
    color: { bg: '#FAECE7', text: '#993C1D', border: '#F5C4B3' },
    darkColor: { bg: 'rgba(74,27,12,0.8)', text: '#F5C4B3', border: '#993C1D' },
    sports: ['Stadium', 'Sports bar / Cafe', 'Open air'],
  },
];

export default function FindEventScreen() {
  const { t } = useLanguage();
  const { isDark, colors } = useTheme();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const content = (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? 'transparent' : '#fff' }]}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity onPress={() => router.replace('/' as any)} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.accent }]}>{t('back')}</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.accent }]}>{t('findAnEvent')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('eventsWithin20km')}</Text>

      {categories.map((cat) => {
        const isOpen = openCategory === cat.id;
        const c = isDark ? cat.darkColor : cat.color;
        return (
          <View key={cat.id} style={[styles.categoryCard, { borderColor: c.border }]}>
            <TouchableOpacity
              style={[styles.categoryHeader, { backgroundColor: c.bg }]}
              onPress={() => setOpenCategory(isOpen ? null : cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryLabel, { color: c.text }]}>{t(cat.labelKey)}</Text>
              <Text style={[styles.categoryChevron, { color: c.text }]}>
                {isOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={[styles.sportsContainer, { backgroundColor: isDark ? 'rgba(30,45,61,0.8)' : '#fff' }]}>
                {cat.sports.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.sportRow, { borderTopColor: isDark ? '#2A3D50' : '#f0f0f0' }]}
                    onPress={() => router.push({ pathname: '/events-by-sport', params: { sport, category: cat.id } } as any)}
                  >
                    <Text style={[styles.sportRowText, { color: colors.text }]}>{sport}</Text>
                    <Text style={[styles.sportRowArrow, { color: colors.textSecondary }]}>→</Text>
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

  if (isDark) {
    return (
      <ImageBackground
        source={require('../assets/images/sports-bg.png')}
        style={styles.bg}
        blurRadius={3}
      >
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
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 17, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 32 },
  categoryCard: { borderRadius: 16, borderWidth: 0.5, marginBottom: 12, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { fontSize: 16, fontWeight: '500', flex: 1 },
  categoryChevron: { fontSize: 12 },
  sportsContainer: { paddingVertical: 4 },
  sportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 0.5 },
  sportRowText: { fontSize: 15 },
  sportRowArrow: { fontSize: 16 },
  mapBtn: { backgroundColor: '#1D9E75', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  mapBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  mapBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
});