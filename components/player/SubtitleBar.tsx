import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { Language } from '@/types/story';

type Props = {
  text: string;
  language: Language;
};

export function SubtitleBar({ text, language }: Props) {
  return (
    <View style={styles.wrap}>
      <Text
        style={[styles.text, language === 'ne' ? styles.ne : styles.en]}
        maxFontSizeMultiplier={1.25}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.background,
    paddingHorizontal: 22,
    paddingTop: 16,
    minHeight: 120,
  },
  text: {
    color: colors.cream,
    textAlign: 'center',
    lineHeight: 30,
  },
  en: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
  },
  ne: {
    fontFamily: 'NotoSansDevanagari_600SemiBold',
    fontSize: 19,
    lineHeight: 32,
  },
});
