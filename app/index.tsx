import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgeCategoryRow } from '@/components/AgeCategoryRow';
import { SettingsButton } from '@/components/SettingsButton';
import { brand, colors, radii, spacing } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { categoryLabel, featuredForAge, isGrownListening } from '@/data/catalog';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function TonightScreen() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const ageBand = useSettingsStore((s) => s.ageBand);
  const story = featuredForAge(ageBand);
  const grown = isGrownListening(ageBand);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.skyTop, colors.skyMid, colors.skyHorizon]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.moon} />
      <View style={styles.hillFar} />
      <View style={styles.hillNear} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.brandNe}>{brand.nameNe}</Text>
              <Text style={styles.brand}>{brand.name}</Text>
            </View>
            <SettingsButton />
          </View>

          <Text style={[styles.who, language === 'ne' && styles.whoNe]}>{t(ui.whoListening, language)}</Text>
          <AgeCategoryRow />

          <View style={styles.hero}>
            <Text style={[styles.kicker, language === 'ne' && styles.kickerNe]}>
              {t(grown ? ui.tonightAdult : ui.tonight, language)}
            </Text>
            <Text style={[styles.title, language === 'ne' && styles.titleNe]}>
              {story.title[language]}
            </Text>
            <Text style={[styles.sub, language === 'ne' && styles.subNe]}>
              {story.subtitle[language]}
            </Text>
            <Text style={styles.meta}>
              {categoryLabel(story, language)} · {story.runtimeMinutes} {t(ui.minutes, language)}
            </Text>
          </View>

          <Pressable style={styles.begin} onPress={() => router.push(`/story/${story.id}`)}>
            <Text style={styles.beginText}>{t(grown ? ui.beginAdult : ui.begin, language)}</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/library')} style={styles.more}>
            <Text style={styles.moreText}>{t(ui.moreStories, language)}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandNe: {
    color: colors.amber,
    fontFamily: 'NotoSansDevanagari_700Bold',
    fontSize: 28,
  },
  brand: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -4,
  },
  who: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 10,
    opacity: 0.9,
  },
  whoNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    fontSize: 16,
  },
  hero: { flex: 1, justifyContent: 'center', paddingTop: 28, paddingBottom: 20 },
  kicker: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  kickerNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    textTransform: 'none',
    fontSize: 16,
    letterSpacing: 0,
  },
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 30,
    lineHeight: 38,
    marginTop: 10,
  },
  titleNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    fontSize: 28,
    lineHeight: 40,
  },
  sub: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 320,
  },
  subNe: {
    fontFamily: 'NotoSansDevanagari_400Regular',
    lineHeight: 26,
  },
  meta: {
    color: colors.cream,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    marginTop: 14,
    opacity: 0.72,
  },
  moon: {
    position: 'absolute',
    top: 72,
    right: 36,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cream,
    opacity: 0.9,
  },
  hillFar: {
    position: 'absolute',
    left: -40,
    right: 80,
    bottom: 88,
    height: 120,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: colors.forestFar,
    opacity: 0.7,
  },
  hillNear: {
    position: 'absolute',
    left: 40,
    right: -60,
    bottom: 0,
    height: 140,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 160,
    backgroundColor: colors.forestNear,
  },
  begin: {
    backgroundColor: colors.amber,
    borderRadius: radii.pill,
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: spacing.md,
  },
  beginText: {
    color: colors.background,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
  more: { alignItems: 'center', paddingBottom: spacing.sm },
  moreText: {
    color: colors.cream,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    opacity: 0.85,
  },
});
