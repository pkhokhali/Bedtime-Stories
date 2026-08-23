import React from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Story } from '@/types/story';
import { colors, radii } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';

interface Props {
  title: string;
  stories: Story[];
}

export function StoryCarousel({ title, stories }: Props) {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);

  if (stories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {stories.map(story => (
          <Pressable 
            key={story.id} 
            style={styles.card} 
            onPress={() => router.push('/story/' + story.id)}
          >
            {story.coverImage ? (
              <Image source={{ uri: story.coverImage }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.placeholderCover, { backgroundColor: story.accent || colors.surface }]}>
                <Text style={styles.placeholderTitle} numberOfLines={3} ellipsizeMode="tail">
                  {story.title[language] || story.title.en}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: colors.cream,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  placeholderTitle: {
    color: colors.background,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    textAlign: 'center',
  }
});
