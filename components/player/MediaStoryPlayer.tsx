import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { getStory } from '@/data/catalog';
import { useState, useEffect } from 'react';
import { useEvent } from 'expo';

export default function MediaStoryPlayer({ storyId, isLocalMedia }: { storyId: string, isLocalMedia?: boolean }) {
  const router = useRouter();
  const remoteStories = useDownloadsStore((s) => s.remoteStories);
  const downloads = useDownloadsStore((s) => s.downloads);
  const globalLang = useSettingsStore((s) => s.language);
  
  const rawStory = isLocalMedia ? getStory(storyId) : remoteStories.find(s => s.id === storyId);
  const remoteMetadata = remoteStories.find(s => s.id === storyId);
  const story = isLocalMedia && rawStory && remoteMetadata ? { ...rawStory, ...remoteMetadata } : rawStory;
  
  const dl = downloads[storyId];
  
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ne'>(globalLang || 'en');

  // Check if we have two language tracks available
  const hasBilingual = !isLocalMedia && story?.mediaUrl && story?.mediaUrl_ne;

  // For multi-part local media, use the current index
  const hasMultipleParts = isLocalMedia && story?.mediaAssets && story.mediaAssets.length > 0;
  
  // Use local URI if downloaded, otherwise stream the remote URL (respecting language choice if bilingual), or use local bundled asset
  let videoSource = '';
  if (hasMultipleParts) {
    videoSource = story!.mediaAssets![currentPartIndex];
  } else if (dl?.status === 'completed' && dl.localUri) {
    videoSource = dl.localUri;
  } else if (hasBilingual && activeLanguage === 'ne') {
    videoSource = story?.mediaUrl_ne || '';
  } else {
    videoSource = story?.mediaUrl || '';
  }

  const player = useVideoPlayer(videoSource || '', player => {
    player.loop = false;
    player.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (status === 'idle' && hasMultipleParts && currentPartIndex < (story!.mediaAssets!.length - 1)) {
      // Auto-play next part
      setCurrentPartIndex(prev => prev + 1);
    }
  }, [status, hasMultipleParts, currentPartIndex]);


  if (!story || !videoSource) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Story media not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {story.mediaType === 'audio' ? (
        <View style={styles.audioContainer}>
          {story.coverImage ? (
            <Image source={{ uri: story.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.fallbackCover}>
              <Ionicons name="musical-notes" size={64} color={colors.amber} />
            </View>
          )}
          {/* We still need VideoView in the tree for the player to work in expo-video, but we hide it */}
          <VideoView player={player} style={{ width: 0, height: 0 }} />
        </View>
      ) : (
        <VideoView 
          style={styles.video} 
          player={player} 
          allowsFullscreen 
          allowsPictureInPicture 
        />
      )}
      
      <View style={styles.chrome}>
        <Pressable onPress={() => router.back()} hitSlop={20} style={styles.backBtnRound}>
          <Ionicons name="close" size={28} color={colors.cream} />
        </Pressable>
        <Text style={styles.title}>{story.title[activeLanguage] || story.title.en}</Text>
        
        {hasBilingual && (
           <Pressable 
             onPress={() => setActiveLanguage(prev => prev === 'en' ? 'ne' : 'en')} 
             style={styles.languageToggle}
           >
             <Text style={styles.languageToggleText}>{activeLanguage === 'en' ? 'A/क' : 'क/A'}</Text>
           </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  fallbackCover: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  chrome: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtnRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  errorText: {
    color: colors.cream,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
  },
  languageToggle: {
    marginLeft: 'auto', // push to the right
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  languageToggleText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  }
});
