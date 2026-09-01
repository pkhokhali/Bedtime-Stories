# Survey Analysis & Handoff Report: UI, Navigation, Catalog & Content Architecture (Pillars R3 & R4)

**Explorer**: Explorer 3 (UI, Navigation, Catalog & Content)  
**Target Milestone**: Saanjh 3.0 Survey Phase  
**Authoritative Reference**: `.agents/ORIGINAL_REQUEST.md`  
**Date**: 2026-09-01  

---

## 1. Observation

### 1.1 Navigation & Routing Architecture
- **Root Layout (`app/_layout.tsx`, lines 48–60)**:
  ```typescript
  <Stack
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'fade',
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen name="library" />
    <Stack.Screen name="settings" />
    <Stack.Screen name="story/[id]" options={{ animation: 'fade' }} />
  </Stack>
  ```
  - Observation: Currently, only `index`, `library`, `settings`, and `story/[id]` are defined in the stack. There is no route or screen for story preview/details (`story-detail/[id]`).
- **Direct Navigation to Player**:
  - `app/index.tsx` (line 70): `onPress={() => router.push('/story/' + featuredStory.id)}`
  - `components/StoryCarousel.tsx` (line 27): `onPress={() => router.push('/story/' + story.id)}`
  - `app/library.tsx` (line 73): `onPress={() => router.push('/story/${story.id}')}`
  - Observation: All story cards in the app currently bypass any detail or preview screen and immediately launch playback in `app/story/[id].tsx`.

### 1.2 Home Screen Corrupted Nepali Strings (`app/index.tsx`, lines 64–88)
- Lines 64, 72, 77, 85, 86, 87, 88 contain corrupted ASCII question mark characters instead of Devanagari text:
  ```typescript
  64: <Text style={styles.heroKicker}>{language === 'ne' ? '?????? ??????' : 'Recently Added'}</Text>
  72: <Text style={styles.playButtonText}>{language === 'ne' ? '???? ?????????' : 'Play'}</Text>
  77: <Text style={styles.infoButtonText}>{language === 'ne' ? '?????????' : 'Library'}</Text>
  85: <StoryCarousel title={language === 'ne' ? '???? ????????? ????' : 'For Little Ones'} stories={toddlers} />
  86: <StoryCarousel title={language === 'ne' ? '?????????????? ????' : 'Kids & Tweens'} stories={kids} />
  87: <StoryCarousel title={language === 'ne' ? '????????? ???? (???????)' : 'After Hours (Parents)'} stories={parents} />
  88: <StoryCarousel title={language === 'ne' ? '????????? ????' : 'Young Adults'} stories={teens} />
  ```
  - Observation: This corrupts the UI whenever the user switches language to Nepali (`'ne'`).

### 1.3 Absence of Favorites System
- Observation: Neither `store/useSettingsStore.ts` nor `store/useDownloadsStore.ts` provides favorites state or persistence. No heart/bookmark icons exist on story cards or player screens.

### 1.4 Loading and Error States in Catalog
- **`lib/catalogFetcher.ts` (lines 10–26)**:
  ```typescript
  export async function fetchRemoteCatalog(): Promise<void> {
    try {
      const response = await fetch(CATALOG_URL);
      if (!response.ok) throw new Error('Failed to fetch catalog from Cloudflare API');
      const data: CatalogResponse = await response.json();
      const visibleStories = data.stories.filter(story => !story.isHidden);
      useDownloadsStore.getState().setRemoteStories(visibleStories);
    } catch (error) {
      console.warn('Error fetching remote catalog:', error);
    }
  }
  ```
  - Observation: Remote catalog fetching does not emit loading state flags (`isLoading`) or error status (`error`), so `app/index.tsx` renders empty carousels without skeleton loaders if remote data is slow, and silently fails if the network is down without giving the user a retry action.

### 1.5 Story Data Model (`types/story.ts` & `data/catalog.ts`)
- **`types/story.ts` (lines 66–88)**:
  - Supports `id`, `category`, `form`, `ageBand`, `title`, `subtitle`, `runtimeMinutes`, `theme`, `accent`, `stage`, `cast`, `beats`, `mediaType`, `mediaUrl`, `mediaUrl_ne`, `mediaAssets`, `coverImage`, `isHidden`.
  - `AgeBand` is `'2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents'`.
- **`data/catalog.ts` (lines 97–385)**:
  - 21 existing stories. None of the local stories in `data/catalog.ts` currently specify `coverImage` (all use fallback color `accent`).
  - No stories are directly assigned to the `'parents'` ageBand (only `'25+'` and `'18-25'`).
  - Most stories have `beats` with `lines(...)` helper or explicit beat arrays, but some lack ambient sound cues or rich metadata for previews.

---

## 2. Logic Chain

1. **Routing & Preview Requirements**:
   - `ORIGINAL_REQUEST.md` R3 states that tapping a story anywhere must open a new preview screen (`app/story-detail/[id].tsx`) displaying cover image, bilingual title, description, age badge, runtime, moral/lesson summary, and a Play action.
   - Therefore, `app/_layout.tsx` must declare `<Stack.Screen name="story-detail/[id]" />`, and all navigation hooks in `app/index.tsx`, `components/StoryCarousel.tsx`, and `app/library.tsx` must navigate to `/story-detail/${story.id}` instead of directly to `/story/${story.id}`.

2. **UI & Internationalization Consistency**:
   - Nepali is a core language for Saanjh. Corrupted question marks must be replaced with Devanagari strings following the localization conventions in `constants/ui.ts`.
   - Adding a centralized dictionary in `constants/ui.ts` ensures maintainability and prevents string encoding glitches.

3. **Favorites Persistence**:
   - A standalone Zustand store (`store/useFavoritesStore.ts`) backed by `@react-native-async-storage/async-storage` with `persist` middleware isolates favorites logic from settings/downloads.
   - When `favoriteIds.length > 0`, the Home screen (`app/index.tsx`) must prepend a "My Favorites" carousel to the category list.

4. **Skeleton & Error States**:
   - Catalog fetch status should be tracked in store (`isLoadingCatalog`, `catalogError`).
   - While loading, animated placeholder skeletons prevent layout shift. If the fetch fails, a friendly retry card allows manual re-fetching.

5. **Sample Content (R4)**:
   - To satisfy R4.1: 3 new bilingual stories with 8–12 beats each must be authored:
     - 2–4: Simple, comforting nature theme (`little-pine-sleep.ts` - 9 beats).
     - 6–8: Adventure / Nepali folklore (`langtang-waterfall.ts` - 10 beats).
     - Parents: Short literary piece suitable for the Novel Reader (`midnight-chiya.ts` - 11 beats).
   - To satisfy R4.2: Ambient sound beds (`night`, `moon`, `river`, `courtyard`, `wind`) and SFX (`chime`, `ripple`, `roar`, `splash`, `wind`) must be mapped across at least 5 existing stories.
   - To satisfy R4.3: Public domain / Creative Commons Unsplash image URLs must be added to 10+ stories in `data/catalog.ts`.

---

## 3. Caveats

- **No Live Network in Strict Test Environments**: Remote catalog fetch should gracefully fall back to local `stories` in `data/catalog.ts` immediately so offline users and automated tests never experience blank screens.
- **Image Caching**: Remote cover image URLs depend on internet access; a fallback gradient with thematic icons is required when offline or when images fail to load.
- **Novel Reader Mode**: Novels (like `midnight-chiya`, `happy-prince`) will leverage both the Story Detail screen and the future Novel Reader interface.

---

## 4. Conclusion & Architectural Specifications

### 4.1 Detailed Design: Story Detail Preview Screen (`app/story-detail/[id].tsx`)

```typescript
// Proposed app/story-detail/[id].tsx implementation blueprint
import React from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/constants/theme';
import { t, ui } from '@/constants/ui';
import { getStory, ageBands } from '@/data/catalog';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  
  const localStory = getStory(id as string);
  const remoteStories = useDownloadsStore((s) => s.remoteStories);
  const remoteStory = remoteStories.find((s) => s.id === id);
  const story = { ...localStory, ...remoteStory };

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorite(story.id || '');

  if (!story || !story.id) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Story not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const band = ageBands.find((b) => b.id === story.ageBand);
  const isNe = language === 'ne';

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Cover / Gradient Hero */}
        <View style={styles.heroWrapper}>
          {story.coverImage ? (
            <ImageBackground source={{ uri: story.coverImage }} style={styles.coverImage}>
              <LinearGradient
                colors={['rgba(26,20,16,0.3)', 'transparent', colors.background]}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : (
            <View style={[styles.gradientPlaceholder, { backgroundColor: story.accent || colors.surface }]}>
              <Ionicons name="moon-outline" size={64} color="rgba(255,255,255,0.25)" />
              <LinearGradient
                colors={['transparent', 'rgba(26,20,16,0.6)', colors.background]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          )}

          {/* Top Bar with Back and Favorite Toggle */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.circleBtn} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={colors.cream} />
            </Pressable>
            <Pressable onPress={() => toggleFavorite(story.id)} style={styles.circleBtn} hitSlop={12}>
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={24}
                color={favorited ? '#E05353' : colors.cream}
              />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Category Tag */}
          <Text style={[styles.categoryTag, isNe && styles.neBold]}>
            {story.form === 'novel' ? (isNe ? 'उपन्यास' : 'NOVEL') : (isNe ? 'सुत्ने बेलाको कथा' : 'BEDTIME STORY')}
          </Text>

          {/* Bilingual Title */}
          <Text style={[styles.title, isNe && styles.neBold]}>
            {story.title[language] || story.title.en}
          </Text>
          {story.title[language === 'ne' ? 'en' : 'ne'] && (
            <Text style={styles.subTitleBilingual}>
              {story.title[language === 'ne' ? 'en' : 'ne']}
            </Text>
          )}

          {/* Subtitle / Description */}
          {story.subtitle && (
            <Text style={[styles.subtitle, isNe && styles.neRegular]}>
              {story.subtitle[language] || story.subtitle.en}
            </Text>
          )}

          {/* Metadata Badges */}
          <View style={styles.badgeRow}>
            {band && (
              <View style={styles.badge}>
                <Ionicons name={band.icon as any || 'sparkles'} size={14} color={colors.amber} />
                <Text style={[styles.badgeText, isNe && styles.neBold]}>
                  {isNe ? `उमेर ${band.ages.ne}` : `Ages ${band.ages.en}`}
                </Text>
              </View>
            )}
            {story.runtimeMinutes && (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={14} color={colors.amber} />
                <Text style={[styles.badgeText, isNe && styles.neBold]}>
                  {story.runtimeMinutes} {isNe ? 'मिनेट' : 'min'}
                </Text>
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="language-outline" size={14} color={colors.amber} />
              <Text style={styles.badgeText}>EN / NE</Text>
            </View>
          </View>

          {/* Moral / Lesson Card */}
          {story.theme && (
            <View style={styles.moralCard}>
              <View style={styles.moralHeader}>
                <Ionicons name="bulb-outline" size={18} color={colors.amber} />
                <Text style={[styles.moralTitle, isNe && styles.neBold]}>
                  {isNe ? 'सन्देश र शिक्षा' : 'Lesson & Meaning'}
                </Text>
              </View>
              <Text style={[styles.moralText, isNe && styles.neRegular]}>
                "{story.theme[language] || story.theme.en}"
              </Text>
            </View>
          )}

          {/* Action CTA Button */}
          <Pressable
            style={styles.playButton}
            onPress={() => router.push('/story/' + story.id)}
          >
            <Ionicons name="play" size={24} color="#000" />
            <Text style={[styles.playButtonText, isNe && styles.neBold]}>
              {story.form === 'novel'
                ? (isNe ? 'उपन्यास सुन्न सुरु गरौं' : 'Listen to Novel')
                : (isNe ? 'कथा सुरु गरौं' : 'Play Story')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
```

---

### 4.2 Detailed Design: Favorites Store (`store/useFavoritesStore.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesStore {
  favoriteIds: string[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      addFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id) ? state.favoriteIds : [...state.favoriteIds, id],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((favId) => favId !== id),
        })),
      toggleFavorite: (id) => {
        const { favoriteIds, addFavorite, removeFavorite } = get();
        if (favoriteIds.includes(id)) {
          removeFavorite(id);
        } else {
          addFavorite(id);
        }
      },
      isFavorite: (id) => get().favoriteIds.includes(id),
    }),
    {
      name: 'saanjh.favorites.v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

### 4.3 Unified Home Screen Architecture (`app/index.tsx`)

1. **Nepali String Replacements**:
   - `heroKicker`: `language === 'ne' ? 'आजको विशेष' : 'Featured Story'`
   - `playButtonText`: `language === 'ne' ? 'कथा सुरु गरौं' : 'Play'`
   - `infoButtonText`: `language === 'ne' ? 'पुस्तकालय' : 'Library'`
   - `detailsButtonText`: `language === 'ne' ? 'विवरण' : 'Details'`
   - `favoritesSection`: `language === 'ne' ? 'मेरो मनपर्ने कथाहरू' : 'My Favorites'`
   - `toddlersSection`: `language === 'ne' ? 'साना नानीहरूका लागि' : 'For Little Ones'`
   - `kidsSection`: `language === 'ne' ? 'केटाकेटीहरूका लागि' : 'Kids & Tweens'`
   - `parentsSection`: `language === 'ne' ? 'अभिभावकहरूका लागि (काम पछि)' : 'After Hours (Parents)'`
   - `teensSection`: `language === 'ne' ? 'युवाहरूका लागि' : 'Young Adults'`

2. **Carousels Layout with Favorites**:
   ```typescript
   {favoriteStories.length > 0 && (
     <StoryCarousel
       title={language === 'ne' ? 'मेरो मनपर्ने कथाहरू' : 'My Favorites'}
       stories={favoriteStories}
     />
   )}
   <StoryCarousel title={language === 'ne' ? 'साना नानीहरूका लागि' : 'For Little Ones'} stories={toddlers} />
   <StoryCarousel title={language === 'ne' ? 'केटाकेटीहरूका लागि' : 'Kids & Tweens'} stories={kids} />
   <StoryCarousel title={language === 'ne' ? 'अभिभावकहरूका लागि (काम पछि)' : 'After Hours (Parents)'} stories={parents} />
   <StoryCarousel title={language === 'ne' ? 'युवाहरूका लागि' : 'Young Adults'} stories={teens} />
   ```

3. **Card Navigation**:
   In `components/StoryCarousel.tsx`, update line 27:
   ```typescript
   onPress={() => router.push('/story-detail/' + story.id)}
   ```

---

### 4.4 Loading Skeletons and Retry States

1. **Skeleton Component (`components/StoryCardSkeleton.tsx`)**:
   - Renders 4 horizontal pulsing rounded cards (120x180) with shimmer background (`rgba(255,255,255,0.06)`).
2. **Catalog Fetch Error State**:
   - If network fails and `catalogError` is set, render a warm card:
     ```typescript
     <View style={styles.errorBanner}>
       <Ionicons name="cloud-offline-outline" size={20} color={colors.creamMuted} />
       <Text style={styles.errorBannerText}>
         {language === 'ne' ? 'अनलाइन कथाहरू लोड हुन सकेन' : 'Offline Mode: Showing Local Catalog'}
       </Text>
       <Pressable onPress={fetchRemoteCatalog} style={styles.retryBtn}>
         <Text style={styles.retryText}>{language === 'ne' ? 'पुनः प्रयास' : 'Retry'}</Text>
       </Pressable>
     </View>
     ```

---

### 4.5 Pillar R4: 3 New Bilingual Stories Specification

#### Story 1: `data/stories/little-pine-sleep.ts` (Ages 2–4, Nature & Comfort)
- **ID**: `little-pine-sleep`
- **Category**: `roots`, **Form**: `story`, **AgeBand**: `2-4`, **Runtime**: 4 min, **Accent**: `#2E5D4B`, **Stage**: `forest`
- **Beats (9 beats)**:
  1. `title`: Intro on the peaceful Himalayan ridge. (Music: `wind`, SFX: `chime`, Voice: `soft`)
  2. `breeze`: Evening breeze rustles the pine needles. (Music: `wind`)
  3. `birds`: Mountain sparrows tuck their wings to rest. (Music: `night`)
  4. `fog`: Soft white fog spreads across the valley like a blanket. (Music: `wind`)
  5. `stars`: Tiny silver stars blink above the snow peaks. (Music: `night`, SFX: `chime`)
  6. `owl`: A friendly night owl whispers a quiet goodnight. (Music: `night`, Voice: `soft`)
  7. `shadow`: Tree shadows turn deep violet and gentle. (Music: `night`)
  8. `breath`: The little pine takes a deep, calm breath. (Music: `night`)
  9. `close`: Closing benediction: Rest now, little tree. Sweet dreams. (Music: `night`, Voice: `soft`, SFX: `chime`)

#### Story 2: `data/stories/langtang-waterfall.ts` (Ages 6–8, Nepali Folklore & Adventure)
- **ID**: `langtang-waterfall`
- **Category**: `roots`, **Form**: `story`, **AgeBand**: `6-8`, **Runtime**: 6 min, **Accent**: `#3B7A57`, **Stage**: `river`
- **Beats (10 beats)**:
  1. `title`: Legend of the secret singing waterfall of Langtang. (Music: `river`, SFX: `chime`, Voice: `soft`)
  2. `boy`: Kiran the shepherd notices his bamboo flute is missing before sunset. (Music: `wind`)
  3. `deer`: A gentle musk deer appears on the mossy trail. (Music: `river`)
  4. `follow`: Kiran follows the deer into the quiet pine gorge. (Music: `river`)
  5. `bells`: The sound of water chiming like temple bells echoes ahead. (Music: `river`, SFX: `ripple`)
  6. `discover`: Kiran discovers the crystal waterfall glowing in moonlight. (Music: `river`, SFX: `chime`)
  7. `flute`: The flute sits safely on a dry river stone. (Music: `river`)
  8. `song`: Kiran plays a soft melody in gratitude to the mountain stream. (Music: `river`, Voice: `soft`)
  9. `peace`: Forest creatures gather in quiet wonder. (Music: `river`)
  10. `close`: The forest sleeps with the melody of the river. Sweet dreams. (Music: `river`, Voice: `soft`, SFX: `chime`)

#### Story 3: `data/stories/midnight-chiya.ts` (Parents Category, Short Literary Piece)
- **ID**: `midnight-chiya`
- **Category**: `roots`, **Form**: `novel`, **AgeBand**: `parents`, **Runtime**: 9 min, **Accent**: `#8B4513`, **Stage**: `courtyard`
- **Beats (11 beats)**:
  1. `title`: Midnight in the ancient courtyards of Patan. (Music: `courtyard`, SFX: `chime`, Voice: `soft`)
  2. `rain`: Rain tapping rhythmically on red clay tiles. (Music: `courtyard`)
  3. `stove`: The comforting hiss of the brass kettle with ginger and cloves. (Music: `courtyard`)
  4. `steam`: Sweet spiced steam warming the quiet kitchen. (Music: `courtyard`)
  5. `terrace`: Looking out from the balcony at the dark silhouettes of temple pagodas. (Music: `courtyard`)
  6. `stillness`: The hustle of the daytime market settling into stillness. (Music: `courtyard`)
  7. `memory`: Remembering old stories told around winter fires. (Music: `courtyard`)
  8. `cup`: Holding the warm clay cup in two hands. (Music: `courtyard`, SFX: `chime`)
  9. `breath`: Releasing the tension of the long day. (Music: `courtyard`)
  10. `whisper`: The gentle sound of rain slowly fading into dawn. (Music: `courtyard`)
  11. `close`: Rest well. The city sleeps, and tomorrow will wait. (Music: `courtyard`, Voice: `soft`, SFX: `chime`)

---

### 4.6 Ambient Sound & Cover Image Mapping

| Story ID | Stage | Music Bed | SFX Cues | Curated Public Domain / Unsplash Cover Image URL |
|---|---|---|---|---|
| `sleepy-cloud` | `stars` | `night` | `chime` | `https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=600&auto=format&fit=crop&q=80` |
| `moon-rabbit` | `moon` | `moon` | `chime` | `https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=600&auto=format&fit=crop&q=80` |
| `firefly-lights` | `moon` | `moon` | `chime` | `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80` |
| `sleepy-yak` | `hills` | `wind` | `chime` | `https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80` |
| `star-blanket` | `stars` | `night` | `chime` | `https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80` |
| `clever-rabbit` | `forest` | `night` | `roar`, `ripple`, `splash` | `https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?w=600&auto=format&fit=crop&q=80` |
| `koshi-crocodile`| `river` | `river` | `ripple`, `chime` | `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80` |
| `drum-hills` | `hills` | `wind` | `chime` | `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80` |
| `bhaktapur-well` | `courtyard` | `courtyard` | `ripple`, `wind`, `chime` | `https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=80` |
| `yeti-quiet` | `hills` | `wind` | `wind`, `chime` | `https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&auto=format&fit=crop&q=80` |
| `tea-shop-lamp` | `lamp` | `courtyard` | `wind`, `chime` | `https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80` |
| `dove-net` | `stars` | `night` | `chime` | `https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop&q=80` |
| `mountain-school`| `hills` | `wind` | `chime` | `https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80` |
| `bridge-light` | `river` | `river` | `ripple`, `chime` | `https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80` |
| `night-bus` | `hills` | `wind` | `wind`, `chime` | `https://images.unsplash.com/photo-1519074069444-1ba4eae16e61?w=600&auto=format&fit=crop&q=80` |
| `letters-river` | `river` | `river` | `ripple`, `chime` | `https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80` |
| `happy-prince` | `lamp` | `night` | `wind`, `chime` | `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80` |
| `selfish-giant` | `hills` | `wind` | `wind`, `chime` | `https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80` |
| `north-wind` | `hills` | `wind` | `wind`, `chime` | `https://images.unsplash.com/photo-1507499739999-097706ad8914?w=600&auto=format&fit=crop&q=80` |
| `last-lamp-thamel`| `lamp` | `courtyard` | `wind`, `chime` | `https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=80` |
| `old-man-koshi` | `river` | `river` | `river`, `ripple`, `chime` | `https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=600&auto=format&fit=crop&q=80` |
| `little-pine-sleep`| `forest`| `night` | `wind`, `chime` | `https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80` |
| `langtang-waterfall`| `river`| `river` | `ripple`, `chime` | `https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80` |
| `midnight-chiya` | `courtyard`| `courtyard`| `wind`, `chime` | `https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80` |

---

## 5. Verification Method

1. **TypeScript Typecheck**:
   - `npx tsc --noEmit` must complete with 0 errors across all routes, stores, types, and story files.
2. **Navigation Flow Verification**:
   - Verify tapping cards in `app/index.tsx`, `components/StoryCarousel.tsx`, and `app/library.tsx` routes to `/story-detail/[id]`.
   - Verify tapping the "Play" CTA inside `/story-detail/[id]` routes to `/story/[id]`.
3. **Favorites Store Verification**:
   - Favoriting a story on `/story-detail/[id]` reflects in `useFavoritesStore` and persists to AsyncStorage.
   - Returning to Home shows "My Favorites" carousel with the saved story.
4. **Devanagari Rendering Verification**:
   - Toggle language to `'ne'`. Verify home carousels and detail screen display legitimate Devanagari script without question marks.
5. **Catalog & Assets Verification**:
   - Verify `data/catalog.ts` registers 24 total stories with `coverImage` URLs and complete beats.
