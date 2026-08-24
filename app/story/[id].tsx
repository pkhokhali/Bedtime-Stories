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
  
  // Check if this story has media (video/audio) or is a legacy programmatic animation (beats)
  const remoteStory = remoteStories.find(s => s.id === id);
  const localStory = getStory(id as string);
  
  // Merge to see the final story properties
  const mergedStory = { ...localStory, ...remoteStory };
  
  // It's a media story if it has a mediaType, mediaUrl, or local mediaAssets
  const isMediaStory = !!mergedStory.mediaType || !!mergedStory.mediaUrl || !!mergedStory.mediaAssets;

  if (isMediaStory) {
    return <MediaStoryPlayer storyId={id as string} isLocalMedia={!!localStory?.mediaAssets} />;
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
