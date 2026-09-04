import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlayerChrome } from '@/components/player/PlayerChrome';
import { SeekBar } from '@/components/player/SeekBar';
import { SleepFade } from '@/components/player/SleepFade';
import { SubtitleBar } from '@/components/player/SubtitleBar';
import { ForestStage } from '@/components/scenes/ForestStage';
import { NightStage } from '@/components/scenes/NightStage';
import { colors } from '@/constants/theme';
import { getStory, isGrownListening } from '@/data/catalog';
import { useStoryPlayback } from '@/hooks/useStoryPlayback';
import { useSettingsStore } from '@/store/useSettingsStore';

function KeepScreenAwake() {
  useKeepAwake();
  return null;
}

export default function StoryPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  const story = getStory(id ?? '');
  const beats = story?.beats ?? [];
  const playback = useStoryPlayback(beats, language, story?.stage);

  useEffect(() => {
    if (beats.length) playback.play();
    return () => playback.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paywall Check Effect
  useEffect(() => {
    if (
      story?.isPremium &&
      story.freeBeatsCount !== undefined &&
      playback.index >= story.freeBeatsCount &&
      playback.status === 'playing'
    ) {
      playback.pause();
      router.push('/subscribe');
    }
  }, [playback.index, playback.status, story?.isPremium, story?.freeBeatsCount, router, playback]);

  if (!story || !story.beats?.length) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Story not ready yet.</Text>
      </View>
    );
  }

  const beat = playback.beat;

  return (
    <View style={styles.root}>
      {playback.status === 'playing' && keepAwake ? <KeepScreenAwake /> : null}
      <Pressable style={styles.stage} onPress={playback.toggle}>
        {story.stage === 'forest' ? (
          <ForestStage scene={beat.scene} rabbit={beat.rabbit} tiger={beat.tiger} />
        ) : (
          <NightStage
            stage={story.stage || 'moon'}
            scene={beat.scene}
            showRabbit={story.cast !== 'none'}
            rabbitPose={beat.rabbit}
          />
        )}
      </Pressable>
      <PlayerChrome
        language={language}
        playing={playback.status === 'playing'}
        onBack={() => {
          playback.stop();
          router.back();
        }}
        onTogglePlay={() => {
          if (story.isPremium && story.freeBeatsCount !== undefined && playback.index >= story.freeBeatsCount) {
             router.push('/subscribe');
             return;
          }
          playback.toggle();
        }}
      />
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 28 }]}>
        <SeekBar
          index={playback.index}
          count={playback.count}
          language={language}
          onSeek={playback.seekTo}
        />
        <SubtitleBar text={beat.text[language]} language={language} />
      </View>
      <SleepFade
        visible={playback.status === 'done'}
        language={language}
        adult={isGrownListening(story.ageBand)}
        onPress={() => {
          playback.stop();
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  stage: { flex: 1.35 },
  dock: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(244, 230, 200, 0.12)',
  },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  missingText: { color: colors.cream, fontFamily: 'Nunito_600SemiBold' },
});
