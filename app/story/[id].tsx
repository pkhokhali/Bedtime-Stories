import { Suspense, lazy } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

const StoryPlayer = lazy(() => import('@/components/player/StoryPlayer'));

export default function StoryScreen() {
  return (
    <Suspense fallback={<View style={styles.fallback} />}>
      <StoryPlayer />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, backgroundColor: colors.background },
});
