import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';
import { radii } from '@/constants/theme';

interface Props {
  count?: number;
  showTitle?: boolean;
}

export function StoryCardSkeleton({ count = 4, showTitle = true }: Props) {
  const animatedOpacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedOpacity, {
          toValue: 0.65,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0.25,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [animatedOpacity]);

  const items = Array.from({ length: count });

  return (
    <View style={styles.container}>
      {showTitle && (
        <Animated.View style={[styles.titlePlaceholder, { opacity: animatedOpacity }]} />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        scrollEnabled={false}
      >
        {items.map((_, index) => (
          <Animated.View
            key={index}
            style={[styles.card, { opacity: animatedOpacity }]}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  titlePlaceholder: {
    width: 140,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    height: 180,
    borderRadius: radii.card,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
