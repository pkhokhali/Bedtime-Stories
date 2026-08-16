import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.wrap}>
        <Text style={styles.text}>This screen is missing.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to tonight</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: { color: colors.cream, fontFamily: 'Nunito_600SemiBold' },
  link: { padding: 8 },
  linkText: { color: colors.amber, fontFamily: 'Nunito_700Bold' },
});
