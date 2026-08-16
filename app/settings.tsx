import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgeCategoryRow } from '@/components/AgeCategoryRow';
import { colors, radii, spacing } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { previewTeller } from '@/lib/speech';
import { VoiceGender, VoicePace, useSettingsStore } from '@/store/useSettingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const voicePace = useSettingsStore((s) => s.voicePace);
  const voiceGender = useSettingsStore((s) => s.voiceGender);
  const nightSounds = useSettingsStore((s) => s.nightSounds);
  const keepAwake = useSettingsStore((s) => s.keepAwake);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setVoicePace = useSettingsStore((s) => s.setVoicePace);
  const setVoiceGender = useSettingsStore((s) => s.setVoiceGender);
  const setNightSounds = useSettingsStore((s) => s.setNightSounds);
  const setKeepAwake = useSettingsStore((s) => s.setKeepAwake);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <Text style={[styles.title, language === 'ne' && styles.neBold]}>{t(ui.settings, language)}</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={[styles.section, language === 'ne' && styles.neBold]}>{t(ui.whoListening, language)}</Text>
        <Text style={[styles.hint, language === 'ne' && styles.neRegular]}>{t(ui.whoListeningHint, language)}</Text>
        <AgeCategoryRow variant="full" />

        <Text style={[styles.section, language === 'ne' && styles.neBold]}>{t(ui.languageSection, language)}</Text>
        <Text style={[styles.hint, language === 'ne' && styles.neRegular]}>{t(ui.languageHint, language)}</Text>
        <View style={styles.pair}>
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

        <Text style={[styles.section, language === 'ne' && styles.neBold]}>{t(ui.storyteller, language)}</Text>
        <Text style={[styles.hint, language === 'ne' && styles.neRegular]}>{t(ui.voicePace, language)}</Text>
        <View style={styles.pair}>
          {(['slow', 'gentle', 'clear'] as VoicePace[]).map((pace) => {
            const labels = { slow: ui.paceSlow, gentle: ui.paceGentle, clear: ui.paceClear };
            const on = voicePace === pace;
            return (
              <Pressable key={pace} onPress={() => setVoicePace(pace)} style={[styles.pace, on && styles.paceOn]}>
                <Text
                  numberOfLines={1}
                  style={[styles.paceText, on && styles.paceTextOn, language === 'ne' && styles.neBold]}
                >
                  {t(labels[pace], language)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { marginTop: 16 }, language === 'ne' && styles.neRegular]}>
          {t(ui.voiceGenderHint, language)}
        </Text>
        <View style={styles.pair}>
          {(['female', 'male'] as VoiceGender[]).map((gender) => {
            const on = voiceGender === gender;
            return (
              <Pressable
                key={gender}
                onPress={() => setVoiceGender(gender)}
                style={[styles.lang, on && styles.langOn]}
              >
                <Text style={[styles.langText, on && styles.langTextOn, language === 'ne' && styles.neBold]}>
                  {t(gender === 'female' ? ui.female : ui.male, language)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={previewTeller} style={styles.hear}>
          <Text style={[styles.hearText, language === 'ne' && styles.neBold]}>{t(ui.hearVoice, language)}</Text>
        </Pressable>

        <Text style={[styles.section, language === 'ne' && styles.neBold]}>{t(ui.night, language)}</Text>
        <ToggleRow
          label={t(ui.nightSounds, language)}
          hint={t(ui.nightSoundsHint, language)}
          value={nightSounds}
          onValueChange={setNightSounds}
          nepali={language === 'ne'}
        />
        <ToggleRow
          label={t(ui.keepAwake, language)}
          hint={t(ui.keepAwakeHint, language)}
          value={keepAwake}
          onValueChange={setKeepAwake}
          nepali={language === 'ne'}
        />

        <Text style={[styles.foot, language === 'ne' && styles.neRegular]}>{t(ui.settingsFoot, language)}</Text>
      </ScrollView>
    </SafeAreaView>
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
    <Pressable onPress={onPress} style={[styles.lang, selected && styles.langOn]}>
      <Text style={[styles.langText, selected && styles.langTextOn, native && styles.neBold]}>{label}</Text>
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
        <Text style={[styles.toggleLabel, nepali && styles.neBold]}>{label}</Text>
        <Text style={[styles.toggleHint, nepali && styles.neRegular]}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3A2E24', true: colors.amber }}
        thumbColor={colors.cream}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
  },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 48 },
  section: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 6,
  },
  hint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  pair: { flexDirection: 'row', gap: 8 },
  lang: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langOn: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  langText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  },
  langTextOn: { color: colors.cream },
  pace: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paceOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  paceText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  paceTextOn: { color: colors.background },
  hear: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  hearText: {
    color: colors.amber,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: 10,
  },
  toggleCopy: { flex: 1 },
  toggleLabel: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  },
  toggleHint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  foot: {
    color: colors.textSubtle,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 28,
  },
  neBold: { fontFamily: 'NotoSansDevanagari_700Bold', textTransform: 'none', letterSpacing: 0 },
  neRegular: { fontFamily: 'NotoSansDevanagari_400Regular' },
});
