const fs = require('fs');

const gradlePath = 'android/app/build.gradle';
let gradle = fs.readFileSync(gradlePath, 'utf8');
if (!gradle.includes('debuggableVariants = []')) {
  gradle = gradle.replace(
    '// debuggableVariants = ["liteDebug", "prodDebug"]',
    'debuggableVariants = []',
  );
  fs.writeFileSync(gradlePath, gradle);
}
console.log('gradle embed:', gradle.includes('debuggableVariants = []'));

const layout = `import {
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
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hydrate = useSettingsStore((s) => s.hydrate);
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
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 400);
    return () => clearTimeout(timer);
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
        <Stack.Screen name="story/[id]" options={{ animation: 'fade' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
`;

fs.writeFileSync('app/_layout.tsx', layout, 'utf8');

const storePath = 'store/useSettingsStore.ts';
let store = fs.readFileSync(storePath, 'utf8');
store = store.replace('ready: false,', 'ready: true,');
fs.writeFileSync(storePath, store, 'utf8');
console.log('layout and store updated');
