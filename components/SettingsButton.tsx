import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

export function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/settings')}
      hitSlop={12}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel="Settings"
    >
      <Ionicons name="settings-outline" size={22} color={colors.cream} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 12, 8, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(244, 230, 200, 0.12)',
  },
});
