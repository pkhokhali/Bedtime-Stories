import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { hydrateVoices } from '@/lib/speech';
import { colors } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { fetchRemoteCatalog } from '@/lib/catalogFetcher';
import { VideoSplash } from '@/components/VideoSplash';
import { startGlobalSleepTimerTicker, stopGlobalSleepTimerTicker } from '@/lib/sleepTimer';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const [showSplash, setShowSplash] = useState(true);

  useFonts({
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });

  useEffect(() => {
    hydrate();
    hydrateVoices().catch(() => undefined);
    fetchRemoteCatalog();
    SplashScreen.hideAsync().catch(() => undefined);
    startGlobalSleepTimerTicker();
    return () => {
      stopGlobalSleepTimerTicker();
    };
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="library" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="story-detail/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="story/[id]" options={{ animation: 'fade' }} />
      </Stack>

      {/* Magical Storybook Animated Splash Ritual Overlay */}
      {showSplash && (
        <VideoSplash onFinish={() => setShowSplash(false)} />
      )}
    </GestureHandlerRootView>
  );
}
