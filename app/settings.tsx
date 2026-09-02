import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgeCategoryRow } from '@/components/AgeCategoryRow';
import { AtmosphericBackground } from '@/components/background/AtmosphericBackground';
import {
  NightLightModal,
  SleepTimerHeaderBadge,
  SoundscapesPlayer,
} from '@/components/sleep';
import { colors, radii, spacing } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { SLEEP_TIMER_OPTIONS } from '@/lib/sleepTimer';
import { previewTeller } from '@/lib/speech';
import {
  VoiceGender,
  VoicePace,
  useSettingsStore,
} from '@/store/useSettingsStore';
import {
  SleepTimerDuration,
  useSleepTimerStore,
} from '@/store/useSleepTimerStore';

export default function SettingsScreen() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const voicePace = useSettingsStore((s) => s.voicePace);
  const voiceGender = useSettingsStore((s) => s.voiceGender);
  const nightSounds = useSettingsStore((s) => s.nightSounds);
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  const aiVoice = useSettingsStore((s) => s.aiVoice);
  const nightLightColor = useSettingsStore((s) => s.nightLightColor);

  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setVoicePace = useSettingsStore((s) => s.setVoicePace);
  const setVoiceGender = useSettingsStore((s) => s.setVoiceGender);
  const setNightSounds = useSettingsStore((s) => s.setNightSounds);
  const setKeepAwake = useSettingsStore((s) => s.setKeepAwake);
  const setAiVoice = useSettingsStore((s) => s.setAiVoice);
  const setNightLightColor = useSettingsStore((s) => s.setNightLightColor);

  const sleepTimerDuration = useSleepTimerStore((s) => s.duration);
  const setSleepTimerDuration = useSleepTimerStore((s) => s.setDuration);

  const [nightLightOpen, setNightLightOpen] = useState(false);

  return (
    <AtmosphericBackground style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.back}
            accessibilityLabel={isNe ? 'फर्कनुहोस्' : 'Go Back'}
          >
            <Ionicons name="chevron-back" size={24} color={colors.cream} />
          </Pressable>

          <Text style={[styles.title, isNe && styles.neBold]}>
            {t(ui.settings, language)}
          </Text>

          <View style={styles.headerRight}>
            <SleepTimerHeaderBadge />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* ============================================================ */}
          {/* CARD 1: AUDIO & VOICES (कथावाचक र स्वर) */}
          {/* ============================================================ */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mic-outline" size={20} color={colors.amber} />
              <Text style={[styles.cardTitle, isNe && styles.neBold]}>
                {isNe ? 'कथावाचक र स्वर' : 'Storyteller & Voices'}
              </Text>
            </View>
            <Text style={[styles.cardHint, isNe && styles.neRegular]}>
              {isNe ? 'कथावाचकको गति र स्वर छान्नुहोस्।' : 'Choose narration pace and storyteller tone.'}
            </Text>

            {/* Voice Pace */}
            <Text style={[styles.sectionLabel, isNe && styles.neBold]}>
              {t(ui.voicePace, language)}
            </Text>
            <View style={styles.rowGroup}>
              {(['slow', 'gentle', 'clear'] as VoicePace[]).map((pace) => {
                const labels = {
                  slow: ui.paceSlow,
                  gentle: ui.paceGentle,
                  clear: ui.paceClear,
                };
                const on = voicePace === pace;
                return (
                  <Pressable
                    key={pace}
                    onPress={() => setVoicePace(pace)}
                    style={[styles.pillBtn, on && styles.pillBtnOn]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.pillText,
                        on && styles.pillTextOn,
                        isNe && styles.neBold,
                      ]}
                    >
                      {t(labels[pace], language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Voice Gender */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }, isNe && styles.neBold]}>
              {t(ui.voiceGender, language)}
            </Text>
            <View style={styles.rowGroup}>
              {(['female', 'male'] as VoiceGender[]).map((gender) => {
                const on = voiceGender === gender;
                return (
                  <Pressable
                    key={gender}
                    onPress={() => setVoiceGender(gender)}
                    style={[styles.pillBtn, on && styles.pillBtnOn]}
                  >
                    <Ionicons
                      name={gender === 'female' ? 'person' : 'person-outline'}
                      size={15}
                      color={on ? colors.background : colors.creamMuted}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        on && styles.pillTextOn,
                        isNe && styles.neBold,
                      ]}
                    >
                      {t(gender === 'female' ? ui.female : ui.male, language)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Hear a Line Preview */}
            <Pressable onPress={previewTeller} style={styles.previewBtn}>
              <Ionicons name="volume-medium" size={18} color={colors.amber} />
              <Text style={[styles.previewBtnText, isNe && styles.neBold]}>
                {t(ui.hearVoice, language)}
              </Text>
            </Pressable>

            {/* AI Voice Toggle */}
            <View style={{ marginTop: 12 }}>
              <ToggleRow
                label={t(ui.aiVoice, language)}
                hint={t(ui.aiVoiceHint, language)}
                value={aiVoice}
                onValueChange={setAiVoice}
                nepali={isNe}
              />
            </View>

            {/* Night Sounds / SFX Toggle */}
            <ToggleRow
              label={t(ui.nightSounds, language)}
              hint={t(ui.nightSoundsHint, language)}
              value={nightSounds}
              onValueChange={setNightSounds}
              nepali={isNe}
            />
          </View>

          {/* ============================================================ */}
          {/* CARD 2: SLEEP TIMER & AMBIANCE (निद्रा टाइमर र आवाज) */}
          {/* ============================================================ */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="alarm-outline" size={20} color={colors.amber} />
              <Text style={[styles.cardTitle, isNe && styles.neBold]}>
                {isNe ? 'निद्रा टाइमर र वातावरण' : 'Sleep Timer & Ambiance'}
              </Text>
            </View>
            <Text style={[styles.cardHint, isNe && styles.neRegular]}>
              {isNe
                ? 'निदाउनका लागि टाइमर सेट गर्नुहोस् र सेतो आवाज (White Noise) बजाउनुहोस्।'
                : 'Configure bedtime auto-stop timer and relaxing white noise ambiance.'}
            </Text>

            {/* Sleep Timer Duration Options */}
            <Text style={[styles.sectionLabel, isNe && styles.neBold]}>
              {isNe ? 'निद्रा टाइमर अवधि' : 'Sleep Timer Duration'}
            </Text>
            <View style={styles.timerPillsGrid}>
              {SLEEP_TIMER_OPTIONS.map((opt) => {
                const on = sleepTimerDuration === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSleepTimerDuration(opt.id as SleepTimerDuration)}
                    style={[styles.timerPill, on && styles.timerPillOn]}
                  >
                    <Text
                      style={[
                        styles.timerPillText,
                        on && styles.timerPillTextOn,
                        isNe && styles.neBold,
                      ]}
                    >
                      {opt.label[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Embedded Continuous Sleep Soundscapes Player */}
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionLabel, isNe && styles.neBold]}>
                {isNe ? 'निरन्तर सुत्ने आवाज (Soundscapes)' : 'Continuous Sleep Soundscapes'}
              </Text>
              <SoundscapesPlayer compact />
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 3: LANGUAGE & AGE GROUP (भाषा र उमेर समूह) */}
          {/* ============================================================ */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="language-outline" size={20} color={colors.amber} />
              <Text style={[styles.cardTitle, isNe && styles.neBold]}>
                {isNe ? 'भाषा र उमेर समूह' : 'Language & Age Group'}
              </Text>
            </View>
            <Text style={[styles.cardHint, isNe && styles.neRegular]}>
              {isNe ? 'कथा र वाचकको भाषा तथा उमेर समूह।' : 'Set the story catalog language and age category.'}
            </Text>

            {/* Language Pair */}
            <View style={styles.rowGroup}>
              <LangChoice
                label={t(ui.nepali, language)}
                native
                selected={language === 'ne'}
                onPress={() => setLanguage('ne')}
              />
              <LangChoice
                label={t(ui.english, language)}
                selected={language === 'en'}
                onPress={() => setLanguage('en')}
              />
            </View>

            {/* Age Category Row */}
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionLabel, isNe && styles.neBold]}>
                {t(ui.whoListening, language)}
              </Text>
              <AgeCategoryRow variant="full" />
            </View>
          </View>

          {/* ============================================================ */}
          {/* CARD 4: DISPLAY & NIGHT LIGHT (डिस्प्ले र नाइट लाइट) */}
          {/* ============================================================ */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb-outline" size={20} color={colors.amber} />
              <Text style={[styles.cardTitle, isNe && styles.neBold]}>
                {isNe ? 'डिस्प्ले र नाइट लाइट' : 'Display & Night Light'}
              </Text>
            </View>
            <Text style={[styles.cardHint, isNe && styles.neRegular]}>
              {isNe
                ? 'सिरानी नजिक राख्नका लागि मधुरो प्रकाश र स्क्रिन सेटिङ।'
                : 'Gentle bedside room illumination and display settings.'}
            </Text>

            {/* Keep Awake Toggle */}
            <ToggleRow
              label={t(ui.keepAwake, language)}
              hint={t(ui.keepAwakeHint, language)}
              value={keepAwake}
              onValueChange={setKeepAwake}
              nepali={isNe}
            />

            {/* Night Light Mode Launcher */}
            <View style={styles.nightLightLaunchBox}>
              <View style={styles.nightLightLaunchInfo}>
                <Text style={[styles.nightLightTitle, isNe && styles.neBold]}>
                  {isNe ? 'बेडसाइड नाइट लाइट मोड' : 'Bedside Night Light Mode'}
                </Text>
                <Text style={[styles.nightLightHint, isNe && styles.neRegular]}>
                  {isNe
                    ? 'न्यानो प्रकाश र मधुरो घडीका साथ पूर्ण स्क्रिन बत्ती।'
                    : 'Full-screen soothing warm glow with breathing pulse and clock.'}
                </Text>

                {/* Quick Color Theme Selector */}
                <View style={styles.nightLightThemeRow}>
                  <Pressable
                    onPress={() => setNightLightColor('amber')}
                    style={[
                      styles.nightLightChip,
                      nightLightColor === 'amber' && styles.nightLightChipAmberOn,
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: '#E8A04A' }]} />
                    <Text
                      style={[
                        styles.nightLightChipText,
                        nightLightColor === 'amber' && styles.nightLightChipTextOn,
                        isNe && styles.neBold,
                      ]}
                    >
                      {isNe ? 'न्यानो साँझ (Amber)' : 'Amber'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setNightLightColor('moonlight')}
                    style={[
                      styles.nightLightChip,
                      nightLightColor === 'moonlight' && styles.nightLightChipMoonOn,
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: '#8CA0B8' }]} />
                    <Text
                      style={[
                        styles.nightLightChipText,
                        nightLightColor === 'moonlight' && styles.nightLightChipTextOn,
                        isNe && styles.neBold,
                      ]}
                    >
                      {isNe ? 'शीतल चन्द्रमा (Moon)' : 'Moonlight'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => setNightLightOpen(true)}
                style={styles.openNightLightBtn}
                accessibilityLabel={isNe ? 'नाइट लाइट खोल्नुहोस्' : 'Open Night Light'}
              >
                <Ionicons name="sparkles" size={18} color="#000" />
                <Text style={[styles.openNightLightText, isNe && styles.neBold]}>
                  {isNe ? 'बत्ती बाल्नुहोस्' : 'Launch Glow'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer Note */}
          <Text style={[styles.foot, isNe && styles.neRegular]}>
            {t(ui.settingsFoot, language)}
          </Text>
        </ScrollView>

        {/* Night Light Modal */}
        <NightLightModal
          visible={nightLightOpen}
          onClose={() => setNightLightOpen(false)}
        />
      </SafeAreaView>
    </AtmosphericBackground>
  );
}

function LangChoice({
  label,
  selected,
  onPress,
  native,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  native?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.lang, selected && styles.langOn]}
      hitSlop={4}
    >
      <Text
        style={[
          styles.langText,
          selected && styles.langTextOn,
          native && styles.neBold,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  nepali,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  nepali: boolean;
}) {
  return (
    <View style={styles.toggle}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.toggleLabel, nepali && styles.neBold]}>
          {label}
        </Text>
        <Text style={[styles.toggleHint, nepali && styles.neRegular]}>
          {hint}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(30, 41, 59, 0.8)', true: colors.amber }}
        thumbColor={colors.cream}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(12, 18, 34, 0.78)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.16)',
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  cardHint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  sectionLabel: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    marginBottom: 8,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
  },
  pillBtnOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  pillText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  pillTextOn: {
    color: colors.background,
  },
  previewBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: 'rgba(232, 160, 74, 0.08)',
  },
  previewBtnText: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  timerPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timerPill: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
  },
  timerPillOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  timerPillText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  timerPillTextOn: {
    color: colors.background,
  },
  lang: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radii.card,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
  },
  langOn: {
    backgroundColor: 'rgba(232, 160, 74, 0.2)',
    borderColor: colors.amber,
  },
  langText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  langTextOn: {
    color: colors.amber,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(18, 26, 44, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.1)',
    borderRadius: radii.chip,
    padding: spacing.md,
    marginTop: 8,
  },
  toggleCopy: { flex: 1 },
  toggleLabel: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  toggleHint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  nightLightLaunchBox: {
    backgroundColor: 'rgba(18, 26, 44, 0.65)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.14)',
    padding: spacing.md,
    marginTop: 10,
    gap: 12,
  },
  nightLightLaunchInfo: {
    gap: 4,
  },
  nightLightTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  nightLightHint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  nightLightThemeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  nightLightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nightLightChipAmberOn: {
    backgroundColor: 'rgba(232, 160, 74, 0.18)',
    borderColor: '#E8A04A',
  },
  nightLightChipMoonOn: {
    backgroundColor: 'rgba(140, 160, 184, 0.22)',
    borderColor: '#8CA0B8',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nightLightChipText: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  nightLightChipTextOn: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
  },
  openNightLightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.amber,
    borderRadius: radii.pill,
    paddingVertical: 10,
  },
  openNightLightText: {
    color: '#000',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
  },
  foot: {
    color: colors.textSubtle,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
    textTransform: 'none',
    letterSpacing: 0,
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
});

