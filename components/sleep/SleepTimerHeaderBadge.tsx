import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  SleepTimerDuration,
  useSleepTimerStore,
} from '@/store/useSleepTimerStore';
import {
  SLEEP_TIMER_OPTIONS,
  getSleepTimerBadgeText,
} from '@/lib/sleepTimer';

interface SleepTimerHeaderBadgeProps {
  alwaysShow?: boolean;
}

export function SleepTimerHeaderBadge({ alwaysShow = false }: SleepTimerHeaderBadgeProps) {
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const duration = useSleepTimerStore((s) => s.duration);
  const remainingSeconds = useSleepTimerStore((s) => s.remainingSeconds);
  const isActive = useSleepTimerStore((s) => s.isActive);
  const isFadingOut = useSleepTimerStore((s) => s.isFadingOut);
  const setDuration = useSleepTimerStore((s) => s.setDuration);

  const [modalVisible, setModalVisible] = useState(false);

  // Gentle pulsating glow for active timer
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200 }),
          withTiming(0.96, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isActive, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: isFadingOut ? 0.8 : 1,
  }));

  if (!isActive && !alwaysShow) {
    return null;
  }

  const badgeText = getSleepTimerBadgeText(duration, remainingSeconds, language);

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        hitSlop={8}
        accessibilityLabel={isNe ? 'निद्रा टाइमर' : 'Sleep Timer'}
      >
        <Animated.View
          style={[
            styles.badge,
            isActive && styles.badgeActive,
            isFadingOut && styles.badgeFading,
            animatedStyle,
          ]}
        >
          <Ionicons
            name={isActive ? 'alarm' : 'alarm-outline'}
            size={14}
            color={isActive ? colors.amber : colors.creamMuted}
          />
          {isActive ? (
            <Text
              style={[
                styles.badgeTextActive,
                isNe && styles.neBold,
              ]}
            >
              {badgeText}
            </Text>
          ) : (
            <Text style={[styles.badgeTextInactive, isNe && styles.neRegular]}>
              {isNe ? 'टाइमर' : 'Timer'}
            </Text>
          )}
        </Animated.View>
      </Pressable>

      {/* Sleep Timer Selector Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Ionicons name="moon" size={20} color={colors.amber} />
                    <Text style={[styles.modalTitle, isNe && styles.neBold]}>
                      {isNe ? 'निद्रा टाइमर' : 'Bedtime Sleep Timer'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setModalVisible(false)}
                    hitSlop={12}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={22} color={colors.creamMuted} />
                  </Pressable>
                </View>

                <Text style={[styles.modalSubtitle, isNe && styles.neRegular]}>
                  {isNe
                    ? 'टाइमर सकिएपछि आवाज बिस्तारै १० सेकेन्डमा बन्द हुनेछ।'
                    : 'Audio will gently fade out over 10 seconds when the timer ends.'}
                </Text>

                {/* Duration Option List */}
                <View style={styles.optionsList}>
                  {SLEEP_TIMER_OPTIONS.map((opt) => {
                    const isSelected = duration === opt.id;
                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => {
                          setDuration(opt.id);
                          setModalVisible(false);
                        }}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                      >
                        <View style={styles.optionCopy}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                              isNe && styles.neBold,
                            ]}
                          >
                            {opt.label[language]}
                          </Text>
                          {opt.hint && (
                            <Text
                              style={[
                                styles.optionHint,
                                isNe && styles.neRegular,
                              ]}
                            >
                              {opt.hint[language]}
                            </Text>
                          )}
                        </View>

                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={colors.amber}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.2)',
  },
  badgeActive: {
    backgroundColor: 'rgba(232, 160, 74, 0.16)',
    borderColor: colors.amber,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeFading: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  badgeTextActive: {
    color: colors.amber,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  badgeTextInactive: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F1626',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.25)',
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.chip,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.1)',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(232, 160, 74, 0.15)',
    borderColor: colors.amber,
  },
  optionCopy: {
    flex: 1,
  },
  optionLabel: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  optionLabelSelected: {
    color: colors.amber,
  },
  optionHint: {
    color: colors.creamMuted,
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
});
