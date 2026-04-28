import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EmailConfirmedScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Email Confirmed!</Text>
      <Text style={styles.subtitle}>Your email has been successfully verified. Welcome to SportBuddy!</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
        <Text style={styles.btnText}>Start Playing! 🏆</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0F1923' },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1D9E75', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6B8FA8', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  btn: { backgroundColor: '#1D9E75', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});