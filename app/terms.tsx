import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📋 Terms of Use</Text>
        <Text style={styles.subtitle}>Last updated: April 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>By using SportBuddy, you agree to these Terms of Use. If you do not agree, please do not use the app.</Text>

        <Text style={styles.sectionTitle}>2. User Conduct</Text>
        <Text style={styles.text}>Users must not post objectionable, offensive, or abusive content. SportBuddy has zero tolerance for harassment, hate speech, or inappropriate behavior.</Text>

        <Text style={styles.sectionTitle}>3. User-Generated Content</Text>
        <Text style={styles.text}>You are responsible for the content you post. SportBuddy reserves the right to remove any content that violates these terms and to ban users who violate them.</Text>

        <Text style={styles.sectionTitle}>4. Reporting & Blocking</Text>
        <Text style={styles.text}>Users can report objectionable content or abusive users. Reported content will be reviewed within 24 hours. You can block users to prevent them from contacting you.</Text>

        <Text style={styles.sectionTitle}>5. Privacy</Text>
        <Text style={styles.text}>SportBuddy collects your location to show nearby events and your photos only for profile pictures. We do not sell your data to third parties.</Text>

        <Text style={styles.sectionTitle}>6. Account Termination</Text>
        <Text style={styles.text}>SportBuddy may terminate accounts that violate these terms without prior notice.</Text>

        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.text}>For questions or to report abuse, contact us at: support@sportbuddy.net</Text>
      </ScrollView>

      <TouchableOpacity style={styles.agreeBtn} onPress={() => router.replace('/')}>
        <Text style={styles.agreeBtnText}>✅ I Agree to Terms of Use</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1923' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1D9E75', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6B8FA8', textAlign: 'center', marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 8, marginTop: 20 },
  text: { fontSize: 14, color: '#6B8FA8', lineHeight: 22 },
  agreeBtn: { margin: 24, backgroundColor: '#1D9E75', padding: 18, borderRadius: 12, alignItems: 'center' },
  agreeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});