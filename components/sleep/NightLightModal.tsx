import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useKeepAwake } from 'expo-keep-awake';

import { colors, radii, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';

interface NightLightModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NightLightModal({ visible, onClose }: NightLightModalProps) {
  // Keep the screen awake on nightstand when modal is active
  if (visible) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useKeepAwake();
  }

  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const storedColor = useSettingsStore((s) => s.nightLightColor);
  const storedBrightness = useSettingsStore((s) => s.nightLightBrightness);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [colorTheme, setColorTheme] = useState<'amber' | 'moonlight'>(storedColor || 'amber');
  const [brightness, setBrightness] = useState<number>(storedBrightness ?? 0.6);
  const [showControls, setShowControls] = useState(true);
  const [timeString, setTimeString] = useState('');

  // Breathing pulse animation for soothing rhythm
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 4000 }),
          withTiming(0.92, { duration: 4000 })
        ),
        -1,
        true
      );
    }
  }, [visible, breathe]);

  // Live digital clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeString(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0.05, Math.min(1.0, brightness * breathe.value)),
  }));

  const handleColorSelect = (theme: 'amber' | 'moonlight') => {
    setColorTheme(theme);
    updateSetting('nightLightColor', theme);
  };

  const handleBrightnessChange = (val: number) => {
    const clamped = Math.max(0.05, Math.min(1.0, Math.round(val * 100) / 100));
    setBrightness(clamped);
    updateSetting('nightLightBrightness', clamped);
  };

  const gradientColors: [string, string, string] =
    colorTheme === 'amber'
      ? ['#E8A04A', '#45220E', '#0D0602']
      : ['#8CA0B8', '#162230', '#060B12'];

  const accentColor = colorTheme === 'amber' ? '#E8A04A' : '#8CA0B8';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => setShowControls((prev) => !prev)}>
        <View style={styles.container}>
          {/* Animated Night Light Glow Canvas */}
          <Animated.View style={[StyleSheet.absoluteFill, animatedGlowStyle]}>
            <LinearGradient
              colors={gradientColors}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0.2 }}
              end={{ x: 0.5, y: 1.0 }}
            />
          </Animated.View>

          {/* Central Calming Time & Bedtime Message */}
          <View style={styles.centerStage}>
            <Text style={[styles.clockText, { color: accentColor }]}>
              {timeString}
            </Text>
            <Text style={[styles.peacefulGreeting, isNe && styles.neBold]}>
              {isNe ? 'शुभ रात्रि · मीठो सपना' : 'Sweet Dreams · Rest Peacefully'}
            </Text>
            <Text style={[styles.tapHint, isNe && styles.neRegular]}>
              {isNe ? 'स्क्रिनमा थिचेर बन्द गर्न वा नियन्त्रण खोल्न सकिन्छ' : 'Tap anywhere to toggle controls'}
            </Text>
          </View>

          {/* Floating Top Dismiss Button */}
          {showControls && (
            <Pressable
              onPress={onClose}
              style={styles.dismissBtn}
              hitSlop={14}
              accessibilityLabel={isNe ? 'बन्द गर्नुहोस्' : 'Close Night Light'}
            >
              <Ionicons name="close-circle-outline" size={32} color="rgba(255, 255, 255, 0.7)" />
            </Pressable>
          )}

          {/* Floating Bottom Control Bar */}
          {showControls && (
            <View style={styles.bottomBar}>
              {/* Color Theme Selector */}
              <View style={styles.themeToggleRow}>
                <Pressable
                  onPress={() => handleColorSelect('amber')}
                  style={[
                    styles.themeBtn,
                    colorTheme === 'amber' && styles.themeBtnAmberActive,
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: '#E8A04A' }]} />
                  <Text style={[styles.themeBtnText, isNe && styles.neBold]}>
                    {isNe ? 'न्यानो साँझ (Amber)' : 'Warm Amber'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleColorSelect('moonlight')}
                  style={[
                    styles.themeBtn,
                    colorTheme === 'moonlight' && styles.themeBtnMoonActive,
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: '#8CA0B8' }]} />
                  <Text style={[styles.themeBtnText, isNe && styles.neBold]}>
                    {isNe ? 'शीतल चन्द्रमा (Moonlight)' : 'Moonlight'}
                  </Text>
                </Pressable>
              </View>

              {/* Brightness Adjustment Bar */}
              <View style={styles.brightnessRow}>
                <Ionicons name="sunny-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                <View style={styles.sliderTrack}>
                  {[0.1, 0.25, 0.45, 0.65, 0.85, 1.0].map((step) => {
                    const isFilled = brightness >= step - 0.08;
                    return (
                      <Pressable
                        key={step}
                        onPress={() => handleBrightnessChange(step)}
                        style={[
                          styles.sliderStep,
                          isFilled && { backgroundColor: accentColor },
                        ]}
                      />
                    );
                  })}
                </View>
                <Ionicons name="sunny" size={20} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.brightnessValText}>
                  {Math.round(brightness * 100)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060913',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerStage: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  clockText: {
    fontSize: 64,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  peacefulGreeting: {
    color: colors.cream,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    marginTop: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
  tapHint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    marginTop: 18,
    textAlign: 'center',
  },
  dismissBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    padding: 8,
    zIndex: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(10, 15, 28, 0.85)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: spacing.lg,
    gap: 14,
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeBtnAmberActive: {
    backgroundColor: 'rgba(232, 160, 74, 0.2)',
    borderColor: '#E8A04A',
  },
  themeBtnMoonActive: {
    backgroundColor: 'rgba(140, 160, 184, 0.25)',
    borderColor: '#8CA0B8',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeBtnText: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  brightnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 16,
    alignItems: 'center',
  },
  sliderStep: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  brightnessValText: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
});
