import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, radii, spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { stories as allLocalStories, categoryLabel, ageBands } from '@/data/catalog';
import { Story } from '@/types/story';
import {
  searchCatalog,
  getTrendingStories,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  QUICK_FILTER_PILLS,
  SearchFilterPill,
} from '@/lib/searchEngine';

const { width } = Dimensions.get('window');

export interface SearchDiscoveryModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialPill?: SearchFilterPill;
}

export function SearchDiscoveryModal({
  visible,
  onClose,
  initialQuery = '',
  initialPill = 'all',
}: SearchDiscoveryModalProps) {
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const isNe = language === 'ne';

  const [query, setQuery] = useState(initialQuery);
  const [activePill, setActivePill] = useState<SearchFilterPill>(initialPill);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const remoteStories = useDownloadsStore((s) => s.remoteStories);

  // Full catalog: local 24+ stories merged with any remote Cloudflare stories
  const fullCatalog = useMemo(() => {
    const merged = allLocalStories.map((ls) => {
      const rs = remoteStories.find((r) => r.id === ls.id);
      return rs ? { ...ls, ...rs } : ls;
    });
    const purelyRemote = remoteStories.filter((rs) => !allLocalStories.some((ls) => ls.id === rs.id));
    return [...merged, ...purelyRemote];
  }, [remoteStories]);

  // Load recent searches on open
  useEffect(() => {
    if (visible) {
      getRecentSearches().then(setRecentSearches);
      if (initialQuery !== undefined) setQuery(initialQuery);
      if (initialPill !== undefined) setActivePill(initialPill);
    }
  }, [visible, initialQuery, initialPill]);

  // Filtered stories calculation
  const searchResults = useMemo(() => {
    return searchCatalog(fullCatalog, {
      query,
      pill: activePill,
    });
  }, [fullCatalog, query, activePill]);

  const trendingStories = useMemo(() => {
    return getTrendingStories(fullCatalog);
  }, [fullCatalog]);

  const isDiscoveryMode = !query.trim() && activePill === 'all';

  const handlePillPress = (pillId: SearchFilterPill) => {
    if (activePill === pillId && pillId !== 'all') {
      setActivePill('all');
    } else {
      setActivePill(pillId);
    }
  };

  const handleSelectStory = (story: Story) => {
    if (query.trim()) {
      addRecentSearch(query.trim()).then(setRecentSearches);
    }
    Keyboard.dismiss();
    onClose();
    router.push(`/story-detail/${story.id}`);
  };

  const handleSelectRecentQuery = (recent: string) => {
    setQuery(recent);
    setActivePill('all');
  };

  const handleRemoveRecentQuery = async (recent: string) => {
    const updated = await removeRecentSearch(recent);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleClearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleResetFilters = () => {
    setQuery('');
    setActivePill('all');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <LinearGradient
          colors={['#060913', '#0c1222', '#121A2F', '#0c1222']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* HEADER SEARCH BAR */}
          <View style={styles.header}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color={colors.amber} style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={[
                  styles.searchInput,
                  isNe && styles.neRegular,
                ]}
                placeholder={isNe ? 'कथा, जनावर वा शीर्षक खोज्नुहोस्...' : 'Search bedtime stories, morals, animals...'}
                placeholderTextColor="rgba(244, 230, 200, 0.4)"
                value={query}
                onChangeText={setQuery}
                autoFocus={true}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (query.trim()) {
                    addRecentSearch(query.trim()).then(setRecentSearches);
                  }
                }}
              />
              {query.length > 0 && (
                <Pressable onPress={handleClearQuery} hitSlop={10} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={colors.creamMuted} />
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={10}
              accessibilityLabel={isNe ? 'बन्द गर्नुहोस्' : 'Close search'}
            >
              <Ionicons name="close" size={24} color={colors.cream} />
            </Pressable>
          </View>

          {/* QUICK FILTER PILLS */}
          <View style={styles.pillsWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScroll}
            >
              {QUICK_FILTER_PILLS.map((pill) => {
                const isActive = activePill === pill.id;
                return (
                  <Pressable
                    key={pill.id}
                    onPress={() => handlePillPress(pill.id)}
                    style={[
                      styles.pillChip,
                      isActive ? styles.pillChipActive : styles.pillChipInactive,
                    ]}
                  >
                    <Ionicons
                      name={pill.icon as any}
                      size={14}
                      color={isActive ? '#060913' : colors.creamMuted}
                      style={styles.pillIcon}
                    />
                    <Text
                      style={[
                        styles.pillText,
                        isActive ? styles.pillTextActive : styles.pillTextInactive,
                        isNe && styles.neBold,
                      ]}
                    >
                      {pill.label[language] || pill.label.en}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* MAIN SCROLL CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contentScroll}
          >
            {isDiscoveryMode ? (
              /* DISCOVERY STATE (EMPTY QUERY & ALL PILL) */
              <View style={styles.discoveryContainer}>
                {/* RECENT SEARCHES */}
                {recentSearches.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.sectionTitleRow}>
                        <Ionicons name="time-outline" size={18} color={colors.amber} />
                        <Text style={[styles.sectionTitle, isNe && styles.neBold]}>
                          {isNe ? 'भर्खरै खोजिएका' : 'Recent Searches'}
                        </Text>
                      </View>
                      <Pressable onPress={handleClearAllRecent} hitSlop={8}>
                        <Text style={[styles.clearAllText, isNe && styles.neRegular]}>
                          {isNe ? 'सबै हटाउनुहोस्' : 'Clear'}
                        </Text>
                      </Pressable>
                    </View>

                    <View style={styles.recentChipsContainer}>
                      {recentSearches.map((item, idx) => (
                        <View key={`${item}-${idx}`} style={styles.recentChip}>
                          <Pressable
                            onPress={() => handleSelectRecentQuery(item)}
                            style={styles.recentChipTextContainer}
                          >
                            <Text style={[styles.recentChipText, isNe && styles.neRegular]}>
                              {item}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemoveRecentQuery(item)}
                            hitSlop={6}
                            style={styles.recentChipRemove}
                          >
                            <Ionicons name="close" size={14} color={colors.creamMuted} />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* TRENDING BEDTIME STORIES */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="flame" size={18} color={colors.amber} />
                      <Text style={[styles.sectionTitle, isNe && styles.neBold]}>
                        {isNe ? 'चर्चित सुत्ने बेलाका कथा' : 'Trending Bedtime Stories'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.trendingList}>
                    {trendingStories.map((story) => (
                      <Pressable
                        key={story.id}
                        style={styles.storyCard}
                        onPress={() => handleSelectStory(story)}
                      >
                        {story.coverImage ? (
                          <Image source={{ uri: story.coverImage }} style={styles.storyThumbnail} />
                        ) : (
                          <View
                            style={[
                              styles.storyThumbnail,
                              { backgroundColor: story.accent || colors.celestialBlue },
                            ]}
                          >
                            <Ionicons name="book" size={24} color={colors.cream} />
                          </View>
                        )}

                        <View style={styles.storyCardBody}>
                          <View style={styles.badgesRow}>
                            <View style={styles.categoryBadge}>
                              <Text style={[styles.categoryBadgeText, isNe && styles.neBold]}>
                                {categoryLabel(story, language)}
                              </Text>
                            </View>
                            <View style={styles.ageBandBadge}>
                              <Text style={styles.ageBandBadgeText}>
                                {story.ageBand}
                              </Text>
                            </View>
                            {story.runtimeMinutes ? (
                              <View style={styles.runtimeBadge}>
                                <Ionicons name="time-outline" size={11} color={colors.creamMuted} />
                                <Text style={styles.runtimeBadgeText}>
                                  {story.runtimeMinutes} {isNe ? 'मिनेट' : 'min'}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={[styles.storyCardTitle, isNe && styles.neBold]}
                            numberOfLines={1}
                          >
                            {story.title[language] || story.title.en}
                          </Text>

                          {story.subtitle?.[language] ? (
                            <Text
                              style={[styles.storyCardSub, isNe && styles.neRegular]}
                              numberOfLines={1}
                            >
                              {story.subtitle[language]}
                            </Text>
                          ) : (
                            <Text
                              style={[styles.storyCardSub, isNe && styles.neRegular]}
                              numberOfLines={1}
                            >
                              {story.title[isNe ? 'en' : 'ne']}
                            </Text>
                          )}
                        </View>

                        <View style={styles.cardArrow}>
                          <Ionicons name="chevron-forward" size={18} color={colors.amber} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* QUICK BROWSE CATEGORIES */}
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleRow}>
                      <Ionicons name="grid-outline" size={18} color={colors.amber} />
                      <Text style={[styles.sectionTitle, isNe && styles.neBold]}>
                        {isNe ? 'विधा अनुसार खोज्नुहोस्' : 'Explore by Category'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.categoriesGrid}>
                    <Pressable
                      style={styles.categoryTile}
                      onPress={() => setActivePill('toddlers')}
                    >
                      <Ionicons name="moon" size={24} color={colors.amber} />
                      <Text style={[styles.categoryTileTitle, isNe && styles.neBold]}>
                        {isNe ? 'साना बाबुनानी' : 'Toddlers (2-4)'}
                      </Text>
                      <Text style={[styles.categoryTileSub, isNe && styles.neRegular]}>
                        {isNe ? 'छोटो र नरम' : 'Gentle & soothing'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.categoryTile}
                      onPress={() => setActivePill('roots')}
                    >
                      <Ionicons name="trail-sign" size={24} color="#7BA37A" />
                      <Text style={[styles.categoryTileTitle, isNe && styles.neBold]}>
                        {isNe ? 'नेपाली लोककथा' : 'Folk Tales'}
                      </Text>
                      <Text style={[styles.categoryTileSub, isNe && styles.neRegular]}>
                        {isNe ? 'हिमाल र गाउँ' : 'Himalayan lore'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.categoryTile}
                      onPress={() => setActivePill('animals')}
                    >
                      <Ionicons name="paw" size={24} color="#E0893A" />
                      <Text style={[styles.categoryTileTitle, isNe && styles.neBold]}>
                        {isNe ? 'जनावरका कथा' : 'Animal Tales'}
                      </Text>
                      <Text style={[styles.categoryTileSub, isNe && styles.neRegular]}>
                        {isNe ? 'खरायो र गोही' : 'Rabbit & friends'}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.categoryTile}
                      onPress={() => setActivePill('novels_parents')}
                    >
                      <Ionicons name="cafe" size={24} color="#8395A7" />
                      <Text style={[styles.categoryTileTitle, isNe && styles.neBold]}>
                        {isNe ? 'उपन्यास र वयस्क' : 'Novels & Parents'}
                      </Text>
                      <Text style={[styles.categoryTileSub, isNe && styles.neRegular]}>
                        {isNe ? 'शान्त साँझ' : 'Longer reads'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              /* RESULTS STATE */
              <View style={styles.resultsContainer}>
                <View style={styles.resultsHeaderRow}>
                  <Text style={[styles.resultsCountText, isNe && styles.neBold]}>
                    {isNe
                      ? `${searchResults.length} कथाहरू भेटिए`
                      : `${searchResults.length} ${searchResults.length === 1 ? 'story' : 'stories'} found`}
                  </Text>

                  {(query.length > 0 || activePill !== 'all') && (
                    <Pressable onPress={handleResetFilters} hitSlop={8}>
                      <Text style={[styles.clearAllText, isNe && styles.neRegular]}>
                        {isNe ? 'फिल्टर हटाउनुहोस्' : 'Clear filters'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {searchResults.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={56} color="rgba(244, 230, 200, 0.3)" />
                    <Text style={[styles.emptyTitle, isNe && styles.neBold]}>
                      {isNe ? 'कुनै कथा भेटिएन' : 'No stories found'}
                    </Text>
                    <Text style={[styles.emptySubtitle, isNe && styles.neRegular]}>
                      {isNe
                        ? 'अन्य शब्द वा विधा छानेर पुनः खोज्नुहोस्।'
                        : 'Try searching with different keywords or clear your active filter.'}
                    </Text>
                    <Pressable style={styles.resetButton} onPress={handleResetFilters}>
                      <Text style={[styles.resetButtonText, isNe && styles.neBold]}>
                        {isNe ? 'सबै कथाहरू देखाउनुहोस्' : 'Show All Stories'}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.resultsList}>
                    {searchResults.map((story) => (
                      <Pressable
                        key={story.id}
                        style={styles.storyCard}
                        onPress={() => handleSelectStory(story)}
                      >
                        {story.coverImage ? (
                          <Image source={{ uri: story.coverImage }} style={styles.storyThumbnail} />
                        ) : (
                          <View
                            style={[
                              styles.storyThumbnail,
                              { backgroundColor: story.accent || colors.celestialBlue },
                            ]}
                          >
                            <Ionicons name="book" size={24} color={colors.cream} />
                          </View>
                        )}

                        <View style={styles.storyCardBody}>
                          <View style={styles.badgesRow}>
                            <View style={styles.categoryBadge}>
                              <Text style={[styles.categoryBadgeText, isNe && styles.neBold]}>
                                {categoryLabel(story, language)}
                              </Text>
                            </View>
                            <View style={styles.ageBandBadge}>
                              <Text style={styles.ageBandBadgeText}>
                                {story.ageBand}
                              </Text>
                            </View>
                            {story.runtimeMinutes ? (
                              <View style={styles.runtimeBadge}>
                                <Ionicons name="time-outline" size={11} color={colors.creamMuted} />
                                <Text style={styles.runtimeBadgeText}>
                                  {story.runtimeMinutes} {isNe ? 'मिनेट' : 'min'}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          <Text
                            style={[styles.storyCardTitle, isNe && styles.neBold]}
                            numberOfLines={1}
                          >
                            {story.title[language] || story.title.en}
                          </Text>

                          {story.subtitle?.[language] ? (
                            <Text
                              style={[styles.storyCardSub, isNe && styles.neRegular]}
                              numberOfLines={1}
                            >
                              {story.subtitle[language]}
                            </Text>
                          ) : (
                            <Text
                              style={[styles.storyCardSub, isNe && styles.neRegular]}
                              numberOfLines={1}
                            >
                              {story.title[isNe ? 'en' : 'ne']}
                            </Text>
                          )}

                          {story.theme?.[language] && (
                            <Text
                              style={[styles.storyCardTheme, isNe && styles.neRegular]}
                              numberOfLines={1}
                            >
                              ✨ {story.theme[language]}
                            </Text>
                          )}
                        </View>

                        <View style={styles.cardArrow}>
                          <Ionicons name="chevron-forward" size={18} color={colors.amber} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#060913',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 44, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(232, 160, 74, 0.35)',
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.cream,
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillsWrapper: {
    marginVertical: spacing.xs,
  },
  pillsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  pillChipActive: {
    backgroundColor: colors.amber,
    borderColor: '#FFFFFF',
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pillChipInactive: {
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderColor: 'rgba(232, 160, 74, 0.2)',
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  pillTextActive: {
    color: '#060913',
  },
  pillTextInactive: {
    color: colors.cream,
  },
  contentScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  discoveryContainer: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
    letterSpacing: 0.5,
  },
  clearAllText: {
    color: colors.amber,
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  recentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.15)',
    borderRadius: radii.chip,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  recentChipTextContainer: {
    marginRight: 4,
  },
  recentChipText: {
    color: colors.cream,
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  recentChipRemove: {
    padding: 2,
    borderRadius: 10,
  },
  trendingList: {
    gap: 10,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
    borderRadius: radii.card,
    padding: 12,
    gap: 12,
  },
  storyThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCardBody: {
    flex: 1,
    gap: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(232, 160, 74, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: colors.amber,
    fontSize: 10,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
  },
  ageBandBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ageBandBadgeText: {
    color: colors.creamMuted,
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
  },
  runtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  runtimeBadgeText: {
    color: colors.creamMuted,
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
  },
  storyCardTitle: {
    color: colors.cream,
    fontSize: 16,
    fontFamily: 'Nunito_800ExtraBold',
  },
  storyCardSub: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
  },
  storyCardTheme: {
    color: colors.amber,
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 2,
  },
  cardArrow: {
    paddingRight: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: (width - spacing.lg * 2 - 10) / 2,
    backgroundColor: 'rgba(18, 26, 44, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(232, 160, 74, 0.12)',
    borderRadius: radii.card,
    padding: 14,
    gap: 6,
  },
  categoryTileTitle: {
    color: colors.cream,
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
  categoryTileSub: {
    color: colors.creamMuted,
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
  },
  resultsContainer: {
    gap: spacing.md,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCountText: {
    color: colors.amber,
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultsList: {
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    color: colors.cream,
    fontSize: 18,
    fontFamily: 'Nunito_800ExtraBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.creamMuted,
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: colors.amber,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  resetButtonText: {
    color: '#060913',
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
  },
  neBold: {
    fontFamily: 'NotoSansDevanagari_700Bold',
  },
  neRegular: {
    fontFamily: 'NotoSansDevanagari_400Regular',
  },
});
