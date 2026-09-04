import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

// Since the file has an extra .mp4 extension, require it exactly as is
const splashVideoSource = require('@/assets/videos/splash.mp4.mp4');

interface VideoSplashProps {
  onFinish: () => void;
}

export function VideoSplash({ onFinish }: VideoSplashProps) {
  const player = useVideoPlayer(splashVideoSource, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      // Handle status if needed
    });
    
    // In expo-video, you typically check if playing finished via event or time
    // Let's rely on playingToEnd if supported, or status change
    const playToEndSub = player.addListener('playToEnd', () => {
      onFinish();
    });

    return () => {
      subscription.remove();
      playToEndSub.remove();
    };
  }, [player, onFinish]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView 
        style={StyleSheet.absoluteFill} 
        player={player} 
        contentFit="cover" 
        nativeControls={false} 
      />
    </View>
  );
}
