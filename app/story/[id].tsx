import { Suspense, lazy } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { colors } from '@/constants/theme';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import MediaStoryPlayer from '@/components/player/MediaStoryPlayer';

const StoryPlayer = lazy(() => import('@/components/player/StoryPlayer'));

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remoteStories = useDownloadsStore((s) => s.remoteStories);
  
  // Check if this is a remote media story
  const isMediaStory = remoteStories.some((s) => s.id === id);

  if (isMediaStory) {
    return <MediaStoryPlayer storyId={id as string} />;
  }

  return (
    <Suspense fallback={<View style={styles.fallback} />}>
      <StoryPlayer />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, backgroundColor: colors.background },
});
