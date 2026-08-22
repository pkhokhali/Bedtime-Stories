import { Suspense, lazy } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { colors } from '@/constants/theme';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { getStory } from '@/data/catalog';
import MediaStoryPlayer from '@/components/player/MediaStoryPlayer';

const StoryPlayer = lazy(() => import('@/components/player/StoryPlayer'));

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remoteStories = useDownloadsStore((s) => s.remoteStories);
  
  // Check if this is a remote media story or a local bundled media story
  const isRemoteMedia = remoteStories.some((s) => s.id === id);
  const localStory = getStory(id as string);
  const isLocalMedia = !!localStory?.mediaAssets || !!localStory?.mediaType;

  if (isRemoteMedia || isLocalMedia) {
    return <MediaStoryPlayer storyId={id as string} isLocalMedia={isLocalMedia} />;
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
