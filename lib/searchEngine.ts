import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types/story';

export type SearchFilterPill =
  | 'all'
  | 'toddlers'
  | 'kids'
  | 'novels_parents'
  | 'roots'
  | 'animals'
  | 'audio_only';

export interface SearchFilterOptions {
  query?: string;
  pill?: SearchFilterPill;
}

export const RECENT_SEARCHES_KEY = 'saanjh.recent_searches.v1';
export const MAX_RECENT_SEARCHES = 8;

export const QUICK_FILTER_PILLS: {
  id: SearchFilterPill;
  label: { en: string; ne: string };
  icon: string;
}[] = [
  { id: 'all', label: { en: 'All Stories', ne: 'सबै कथाहरू' }, icon: 'sparkles' },
  { id: 'toddlers', label: { en: 'Toddlers (2-4)', ne: 'साना बाबुनानी (२-४)' }, icon: 'moon-outline' },
  { id: 'kids', label: { en: 'Kids (6-8)', ne: 'बालबालिका (६-८)' }, icon: 'sunny-outline' },
  { id: 'novels_parents', label: { en: 'Novels & Parents', ne: 'उपन्यास र वयस्क' }, icon: 'book-outline' },
  { id: 'roots', label: { en: 'Folk Tales', ne: 'नेपाली लोककथा' }, icon: 'trail-sign-outline' },
  { id: 'animals', label: { en: 'Animal Stories', ne: 'जनावरका कथा' }, icon: 'paw-outline' },
  { id: 'audio_only', label: { en: 'Audio Only', ne: 'अडियो मात्र' }, icon: 'volume-high-outline' },
];

const ANIMAL_STORY_IDS = new Set([
  'clever-rabbit',
  'moon-rabbit',
  'sleepy-yak',
  'koshi-crocodile',
  'dove-net',
  'yeti-quiet',
  'firefly-lights',
]);

const ANIMAL_KEYWORDS = [
  'rabbit',
  'crocodile',
  'yak',
  'tiger',
  'dove',
  'doves',
  'firefly',
  'fireflies',
  'yeti',
  'animal',
  'animals',
  'bird',
  'birds',
  'fish',
  'deer',
  'खरायो',
  'गोही',
  'चौंरी',
  'बाघ',
  'परेवा',
  'जुन्किरी',
  'यति',
  'जनावर',
  'पुतली',
  'माछा',
  'मृग',
];

const CURATED_TRENDING_IDS = [
  'clever-rabbit',
  'sleepy-yak',
  'moon-rabbit',
  'midnight-chiya',
  'sleepy-cloud',
  'koshi-crocodile',
];

/**
 * Returns 4 curated popular bedtime stories from the catalog.
 */
export function getTrendingStories(catalog: Story[]): Story[] {
  if (!catalog || catalog.length === 0) return [];

  const curated: Story[] = [];
  const addedIds = new Set<string>();

  for (const id of CURATED_TRENDING_IDS) {
    const found = catalog.find((s) => s.id === id);
    if (found && !addedIds.has(found.id)) {
      curated.push(found);
      addedIds.add(found.id);
      if (curated.length === 4) return curated;
    }
  }

  // Fallback to top items in catalog if curated not fully found
  for (const s of catalog) {
    if (!addedIds.has(s.id)) {
      curated.push(s);
      addedIds.add(s.id);
      if (curated.length === 4) break;
    }
  }

  return curated;
}

/**
 * Real-time bilingual search matching English and Nepali Devanagari text
 * across titles, subtitles, morals/themes, categories, and tags.
 */
export function searchCatalog(catalog: Story[], options: SearchFilterOptions = {}): Story[] {
  if (!catalog || !Array.isArray(catalog)) return [];

  const { query = '', pill = 'all' } = options;
  const trimmedQuery = query.trim().toLowerCase();

  let results = [...catalog];

  // 1. Filter by Quick Filter Pill
  if (pill && pill !== 'all') {
    switch (pill) {
      case 'toddlers':
        results = results.filter((s) => s.ageBand === '2-4' || s.ageBand === '4-6');
        break;
      case 'kids':
        results = results.filter((s) => s.ageBand === '6-8' || s.ageBand === '9-12');
        break;
      case 'novels_parents':
        results = results.filter(
          (s) =>
            s.form === 'novel' ||
            s.ageBand === 'parents' ||
            s.ageBand === '25+' ||
            s.ageBand === '18-25'
        );
        break;
      case 'roots':
        results = results.filter((s) => s.category === 'roots');
        break;
      case 'animals': {
        results = results.filter((s) => {
          if (ANIMAL_STORY_IDS.has(s.id) || s.cast === 'rabbit') return true;
          const hay = `${s.id} ${s.title?.en || ''} ${s.title?.ne || ''} ${s.subtitle?.en || ''} ${s.subtitle?.ne || ''} ${s.theme?.en || ''} ${s.theme?.ne || ''}`.toLowerCase();
          return ANIMAL_KEYWORDS.some((kw) => hay.includes(kw.toLowerCase()));
        });
        break;
      }
      case 'audio_only':
        results = results.filter(
          (s) =>
            s.mediaType === 'audio' ||
            Boolean(s.mediaUrl) ||
            Boolean(s.mediaUrl_ne) ||
            (Boolean(s.beats) && (s.beats?.length || 0) > 0)
        );
        break;
      default:
        break;
    }
  }

  // 2. Empty Query handling
  if (!trimmedQuery) {
    if (pill === 'all') {
      return getTrendingStories(catalog);
    }
    return results;
  }

  // 3. Bilingual Query Search Matching
  const queryTokens = trimmedQuery.split(/\s+/).filter(Boolean);

  return results.filter((story) => {
    const hayEn = [
      story.id,
      story.title?.en || '',
      story.subtitle?.en || '',
      story.theme?.en || '',
      story.category || '',
      story.form || '',
      story.stage || '',
      story.ageBand || '',
    ].join(' ').toLowerCase();

    const hayNe = [
      story.title?.ne || '',
      story.subtitle?.ne || '',
      story.theme?.ne || '',
    ].join(' ').toLowerCase();

    let beatsEn = '';
    let beatsNe = '';
    if (story.beats && Array.isArray(story.beats)) {
      beatsEn = story.beats.map((b) => b.text?.en || '').join(' ').toLowerCase();
      beatsNe = story.beats.map((b) => b.text?.ne || '').join(' ').toLowerCase();
    }

    const fullHaystack = `${hayEn} ${hayNe} ${beatsEn} ${beatsNe}`;

    // Match full query substring OR check all whitespace-separated tokens
    if (fullHaystack.includes(trimmedQuery)) return true;
    if (queryTokens.length > 1 && queryTokens.every((token) => fullHaystack.includes(token))) {
      return true;
    }

    return false;
  });
}

/**
 * AsyncStorage Helpers for Recent Searches
 */
export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<string[]> {
  const clean = query.trim();
  if (!clean) return getRecentSearches();

  try {
    const current = await getRecentSearches();
    const filtered = current.filter((item) => item.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [clean];
  }
}

export async function removeRecentSearch(query: string): Promise<string[]> {
  try {
    const current = await getRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
}
