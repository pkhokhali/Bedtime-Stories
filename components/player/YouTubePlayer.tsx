import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { colors } from '@/constants/theme';

interface Props {
  youtubeId: string;
  onEnded?: () => void;
  onReady?: () => void;
  onError?: (error: string) => void;
}

export default function YouTubePlayer({ youtubeId, onEnded, onReady, onError }: Props) {
  const [playing, setPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
      onEnded?.();
    }
  }, [onEnded]);

  return (
    <View style={styles.container}>
      {!isReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.amber} />
        </View>
      )}
      <YoutubeIframe
        height={300} // This will be constrained by the container
        videoId={youtubeId}
        play={playing}
        onChangeState={onStateChange}
        onReady={() => {
          setIsReady(true);
          onReady?.();
        }}
        onError={(err: any) => onError?.(err)}
        webViewProps={{
          injectedJavaScript: `
            var element = document.getElementsByClassName('ytp-chrome-top')[0];
            if (element) {
                element.style.display = 'none';
            }
            true;
          `,
        }}
        initialPlayerParams={{
          controls: true,
          rel: false,
          modestbranding: true,
          iv_load_policy: 3,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill as any,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
});
