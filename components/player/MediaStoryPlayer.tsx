import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/constants/theme';
import { useDownloadsStore } from '@/store/useDownloadsStore';

export default function MediaStoryPlayer({ storyId }: { storyId: string }) {
  const router = useRouter();
  const remoteStories = useDownloadsStore((s) => s.remoteStories);
  const downloads = useDownloadsStore((s) => s.downloads);
  
  const story = remoteStories.find(s => s.id === storyId);
  const dl = downloads[storyId];
  
  // Use local URI if downloaded, otherwise stream the remote URL
  const videoSource = dl?.status === 'completed' && dl.localUri 
    ? dl.localUri 
    : story?.mediaUrl;

  const player = useVideoPlayer(videoSource || '', player => {
    player.loop = false;
    player.play();
  });

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
        <Text style={styles.title}>{story.title.en}</Text>
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
  }
});
