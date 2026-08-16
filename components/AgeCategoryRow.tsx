import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { ageBands, audienceGroups, bandsForGroup, groupForAge } from '@/data/catalog';
import { useSettingsStore } from '@/store/useSettingsStore';

type Props = {
  variant?: 'compact' | 'full';
};

export function AgeCategoryRow({ variant = 'compact' }: Props) {
  const language = useSettingsStore((s) => s.language);
  const ageBand = useSettingsStore((s) => s.ageBand);
  const setAgeBand = useSettingsStore((s) => s.setAgeBand);
  const group = groupForAge(ageBand);
  const bands = bandsForGroup(group);
  const selected = ageBands.find((band) => band.id === ageBand) ?? bands[0];
  const ne = language === 'ne';

  return (
    <View style={styles.wrap}>
      <View style={styles.groups}>
        {audienceGroups.map((item) => {
          const on = item.id === group;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                const next = bandsForGroup(item.id);
                if (!next.some((band) => band.id === ageBand)) {
                  setAgeBand(next[0].id);
                }
              }}
              style={[styles.group, on && styles.groupOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.groupText, on && styles.groupTextOn, ne && styles.neBold]}>
                {item.label[language]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ages}>
        {bands.map((band) => {
          const on = band.id === ageBand;
          return (
            <Pressable
              key={band.id}
              onPress={() => setAgeBand(band.id)}
              style={[styles.age, on && styles.ageOn, variant === 'full' && styles.ageFull]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.ageNum, on && styles.ageNumOn, ne && styles.neBold]}>
                {band.ages[language]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <Text style={[styles.hint, ne && styles.neRegular]}>
          {selected.label[language]} · {selected.hint[language]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  groups: { flexDirection: 'row', gap: 8 },
  group: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(18, 12, 8, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(244, 230, 200, 0.12)',
  },
  groupOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  groupText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  groupTextOn: { color: colors.background },
  ages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  age: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.4)',
    backgroundColor: 'rgba(18, 12, 8, 0.28)',
  },
  ageFull: { paddingHorizontal: 18, paddingVertical: 12 },
  ageOn: {
    backgroundColor: colors.amberSoft,
    borderColor: colors.amber,
  },
  ageNum: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
  },
  ageNumOn: { color: colors.amber },
  hint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  neBold: { fontFamily: 'NotoSansDevanagari_700Bold' },
  neRegular: { fontFamily: 'NotoSansDevanagari_400Regular' },
});
