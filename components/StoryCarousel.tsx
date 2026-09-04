import React from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Story } from '@/types/story';
import { colors, radii, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  title: string;
  stories: Story[];
}

export function StoryCarousel({ title, stories }: Props) {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  if (stories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isNe && styles.titleNe]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {stories.map(story => (
          <Pressable 
            key={story.id} 
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed
            ]} 
            onPress={() => router.push('/story-detail/' + story.id)}
          >
            <View style={styles.coverWrapper}>
              {story.coverImage ? (
                <Image source={{ uri: story.coverImage }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.placeholderCover, { backgroundColor: story.accent || colors.surface }]}>
                  <Text
                    style={[styles.placeholderTitle, isNe && styles.placeholderTitleNe]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {story.title[language] || story.title.en}
                  </Text>
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.cardGradient}
              />
              <View style={styles.badgeContainer}>
                {story.mediaType === 'youtube' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Video</Text>
                  </View>
                )}
                {(story.isPremium || story.locked) && (
                  <View style={[styles.badge, styles.badgePremium]}>
                    <Text style={styles.badgeText}>Premium</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardDetails}>
              <Text style={[styles.cardTitle, isNe && styles.titleNe]} numberOfLines={1}>
                {story.title[language] || story.title.en}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {story.runtimeMinutes || 5} min • {story.form === 'novel' ? 'Novel' : 'Story'}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 140,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  coverWrapper: {
    width: '100%',
    height: 200,
    borderRadius: radii.card,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgePremium: {
    backgroundColor: 'rgba(217, 119, 6, 0.8)',
    borderColor: 'rgba(217, 119, 6, 1)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  placeholderTitle: {
    color: colors.background,
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  cardDetails: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  cardTitle: {
    color: colors.cream,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    marginBottom: 2,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  titleNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  placeholderTitleNe: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
});
