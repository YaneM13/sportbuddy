import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  return (
    <TouchableOpacity
      style={styles.backBtn}
      onPress={onPress || (() => router.back())}
    >
      <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 19,
    color: '#1D9E75',
    fontWeight: '500',
  },
});