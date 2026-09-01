# Handoff Report — Explorer 1 (Saanjh 3.0 Survey Phase: Pillar R1 & Infrastructure)

**Author:** Explorer 1  
**Date:** 2026-09-01  
**Milestone:** Survey Phase — Pillar R1 (7 Confirmed Bugs) & Project Configuration / Infrastructure  
**Target Audience:** Orchestrator & Planner Agents for Saanjh 3.0 Implementation  

---

## 1. Observation

Direct code observations from inspecting the codebase at `d:\Antigravity Projects\Bedtime Stories`:

### Bug 1: Corrupted Nepali Text in `app/index.tsx`
- **File:** `app/index.tsx` (Lines 63–89)
- **Verbatim Code Observed:**
  ```tsx
  63:           <View style={styles.heroContent}>
  64:             <Text style={styles.heroKicker}>{language === 'ne' ? '?????? ??????' : 'Recently Added'}</Text>
  65:             <Text style={styles.heroTitle}>
  66:               {featuredStory?.title[language] || featuredStory?.title.en}
  67:             </Text>
  68:             
  69:             <View style={styles.heroButtons}>
  70:               <Pressable style={styles.playButton} onPress={() => router.push('/story/' + featuredStory.id)}>
  71:                 <Ionicons name="play" size={24} color="#000" />
  72:                 <Text style={styles.playButtonText}>{language === 'ne' ? '???? ?????????' : 'Play'}</Text>
  73:               </Pressable>
  74:               
  75:               <Pressable style={styles.infoButton} onPress={() => router.push('/library')}>
  76:                 <Ionicons name="albums-outline" size={24} color="#fff" />
  77:                 <Text style={styles.infoButtonText}>{language === 'ne' ? '?????????' : 'Library'}</Text>
  78:               </Pressable>
  79:             </View>
  80:           </View>
  81:         </View>
  82: 
  83:         {/* CAROUSELS */}
  84:         <View style={styles.carouselsContainer}>
  85:           <StoryCarousel title={language === 'ne' ? '???? ????????? ????' : 'For Little Ones'} stories={toddlers} />
  86:           <StoryCarousel title={language === 'ne' ? '?????????????? ????' : 'Kids & Tweens'} stories={kids} />
  87:           <StoryCarousel title={language === 'ne' ? '????????? ???? (???????)' : 'After Hours (Parents)'} stories={parents} />
  88:           <StoryCarousel title={language === 'ne' ? '????????? ????' : 'Young Adults'} stories={teens} />
  89:         </View>
  ```
- **Context in `constants/ui.ts`:**
  - `constants/ui.ts` contains dictionary entries satisfying `Record<string, Record<Language, string>>` with helper `t(copy, lang)`.
  - Existing relevant entries include `ui.begin: { en: 'Begin', ne: 'सुरु गरौं' }`, `ui.moreStories: { en: 'More stories', ne: 'अरू कथाहरू' }`, `ui.storiesFor: { en: 'Stories for', ne: 'कथाहरू' }`.

---

### Bug 2: `parseAgeBand` in `store/useSettingsStore.ts` Missing `'parents'`
- **File:** `store/useSettingsStore.ts` (Lines 42–54, 73–101)
- **Verbatim Code Observed:**
  ```ts
  42: function parseAgeBand(value: unknown): AgeBand {
  43:   if (value === 'teen') return '13-17';
  44:   if (value === 'adult' || value === '18+') return '18-25';
  45:   return value === '2-4' ||
  46:     value === '4-6' ||
  47:     value === '6-8' ||
  48:     value === '9-12' ||
  49:     value === '13-17' ||
  50:     value === '18-25' ||
  51:     value === '25+'
  52:     ? value
  53:     : '4-6';
  54: }
  ```
- **Type & Catalog Definition:**
  - `types/story.ts` (Line 5): `export type AgeBand = '2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents';`
  - `data/catalog.ts` (Lines 88–94):
    ```ts
    {
      id: 'parents',
      ages: { en: 'Parents', ne: 'अभिभावक' },
      label: { en: 'After Hours', ne: 'काम पछि' },
      hint: { en: 'Audiobooks and novels just for you.', ne: 'तपाईंको लागि अडियोबुक र उपन्यास।' },
      icon: 'cafe-outline',
      group: 'grown',
    }
    ```

---

### Bug 3: Dead Code in `components/SplashRitual.tsx`
- **File:** `components/SplashRitual.tsx` (70 lines, 1505 bytes)
- **Search Result:** `grep_search` across entire repository for `SplashRitual` returned only the declaration itself in `components/SplashRitual.tsx` and mentions in `.agents` markdown logs.
- **Actual Splash Screen Usage:** In `app/_layout.tsx` (Lines 14, 42), the application uses `expo-splash-screen` (`SplashScreen.hideAsync()`). `SplashRitual` is never imported, mounted, or exported in any app route.

---

### Bug 4: Unused Imports in `app/index.tsx`
- **File:** `app/index.tsx` (Lines 9, 12)
- **Verbatim Code Observed:**
  ```tsx
  9:  import { brand, colors, radii, spacing } from '@/constants/theme';
  ...
  12: import { storiesForAge, ageBands, stories as allLocalStories } from '@/data/catalog';
  ```
- **Symbols Checked in `app/index.tsx`:**
  - `radii` — unused anywhere in file
  - `spacing` — unused anywhere in file
  - `storiesForAge` — unused anywhere in file
  - `ageBands` — unused anywhere in file

---

### Bug 5: Admin Panel Age Band Mismatch in `admin/src/App.tsx`
- **File:** `admin/src/App.tsx` (Lines 189–196)
- **Verbatim Code Observed:**
  ```tsx
  189:                   <div>
  190:                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Audience</label>
  191:                     <select value={story.ageBand} onChange={e => updateStory(i, 'ageBand', e.target.value)} className="w-full border rounded-lg p-2">
  192:                       <option value="2-4">Ages 2-4 (Toddlers)</option>
  193:                       <option value="4-6">Ages 4-6 (Kids)</option>
  194:                       <option value="7-9">Ages 7-9 (Older Kids)</option>
  195:                       <option value="parents">Parents (Novels / Audiobooks)</option>
  196:                     </select>
  197:                   </div>
  ```
- **Mismatch:** `option value="7-9"` does not exist in mobile `AgeBand` (`'2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+' | 'parents'`).

---

### Bug 6: Backend Authentication in `backend/src/index.ts`
- **File:** `backend/src/index.ts` (Lines 4–45)
- **Verbatim Code Observed:**
  ```ts
  4: type Env = {
  5:   SAANJH_DB: KVNamespace;
  6: };
  ...
  34: // POST to update the catalog (Called by your Admin Panel)
  35: app.post('/catalog', async (c) => {
  36:   try {
  37:     const body = await c.req.json();
  38:     
  39:     // Save the new JSON tree to the KV Database
  40:     await c.env.SAANJH_DB.put('catalog', JSON.stringify(body));
  41:     
  42:     return c.json({ success: true, message: 'Catalog updated successfully!' });
  43:   } catch (err) {
  44:     return c.json({ success: false, error: 'Failed to update catalog' }, 500);
  45:   }
  46: });
  ```
- **File:** `admin/src/App.tsx` (Lines 60–64)
  ```ts
  60:       const res = await fetch(API_URL, {
  61:         method: 'POST',
  62:         headers: { 'Content-Type': 'application/json' },
  63:         body: JSON.stringify(newCatalog)
  64:       });
  ```
- **Status:** Unauthenticated open write endpoint. No `ADMIN_SECRET` environment binding in `Env` or header check on incoming requests.

---

### Bug 7: AdMob Dummy Unit ID Handling in `components/AdBanner.tsx`
- **File:** `components/AdBanner.tsx` (Lines 7–23)
- **Verbatim Code Observed:**
  ```tsx
  7: const adUnitId = __DEV__ 
  8:   ? TestIds.BANNER 
  9:   : (Platform.OS === 'ios' ? 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy' : 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz');
  10: 
  11: export function AdBanner() {
  12:   return (
  13:     <View style={styles.container}>
  14:       <BannerAd
  15:         unitId={adUnitId}
  16:         size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  17:         requestOptions={{
  18:           requestNonPersonalizedAdsOnly: true,
  19:         }}
  20:       />
  21:     </View>
  22:   );
  23: }
  ```
- **Context in `app.json` (Lines 52–57):**
  ```json
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "ca-app-pub-3940256099942544~3347511713",
      "iosAppId": "ca-app-pub-3940256099942544~1458002511"
    }
  ]
  ```
- **Issue:** In release builds (`__DEV__ === false`), dummy unit ID `'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz'` is passed to Google Mobile Ads `BannerAd`, with zero error boundary or load failure fallback, rendering broken views or causing initialization errors.

---

### Infrastructure & Build Configuration
- **Root `package.json`**: Expo `~57.0.12`, React Native `0.86.2`, React `19.2.3`, TypeScript `~6.0.3`.
- **Root `tsconfig.json`**: Extends `expo/tsconfig.base`, strict mode enabled, path alias `@/*` pointing to `./*`.
- **Admin `admin/package.json`**: Vite 8.2, React 19.2, TailwindCSS 4.3, Lucide React 1.33. Scripts: `dev`, `build`, `lint`.
- **Backend `backend/package.json` & `wrangler.toml`**: Hono 4.13, Wrangler 4.125, KV binding `SAANJH_DB` (id: `97f579307cd347ee8f0904b6c7230813`).
- **Build Automation**: `build-apk.js` and `build-aab.js` automate Expo clean prebuild, inject release keystore signing configuration (`release.keystore`, alias `saanjh-key`), generate `android/local.properties`, bypass Kotlin metadata version checks, and build release APK/AAB via Gradle.

---

## 2. Logic Chain

1. **Bug 1 (Corrupted Strings):**
   - *Observation:* `app/index.tsx` lines 64, 72, 77, 85, 86, 87, 88 display raw question mark literals `'?????? ??????'`, `'???? ?????????'`, etc.
   - *Reasoning:* These were corrupted during file encoding/transcoding operations.
   - *Resolution:* Add structured keys to `constants/ui.ts` (`recentlyAdded`, `play`, `library`, `forLittleOnes`, `kidsAndTweens`, `afterHoursParents`, `youngAdults`) with proper Devanagari Unicode characters, and call `t(ui.<key>, language)` in `app/index.tsx`.

2. **Bug 2 (`parseAgeBand`):**
   - *Observation:* `parseAgeBand` validates against `'2-4' | '4-6' | '6-8' | '9-12' | '13-17' | '18-25' | '25+'` and returns `'4-6'` otherwise.
   - *Reasoning:* When a user selects `'parents'`, it persists as `'parents'`. On app launch, `hydrate()` calls `parseAgeBand('parents')`, which fails the ternary and resets state to `'4-6'`.
   - *Resolution:* Add `value === 'parents'` (and alias `value === 'parent'`) to `parseAgeBand` in `store/useSettingsStore.ts`.

3. **Bug 3 (`SplashRitual.tsx`):**
   - *Observation:* `components/SplashRitual.tsx` is completely unreferenced in the codebase; app startup is orchestrated via `expo-splash-screen` in `app/_layout.tsx`.
   - *Reasoning:* `SplashRitual.tsx` is leftover legacy code.
   - *Resolution:* Delete `components/SplashRitual.tsx`.

4. **Bug 4 (Unused Imports):**
   - *Observation:* `radii`, `spacing` in line 9 and `storiesForAge`, `ageBands` in line 12 of `app/index.tsx` are unused in the file.
   - *Reasoning:* Causes ESLint/TypeScript warnings and bloats module namespace.
   - *Resolution:* Remove unused identifiers from import statements.

5. **Bug 5 (Admin Age Band):**
   - *Observation:* `admin/src/App.tsx` `<select>` offers `'7-9'`, whereas mobile age bands are `'6-8'` and `'9-12'`.
   - *Reasoning:* Stories saved with `'7-9'` in admin will be unrecognized by mobile filtering and reset to `'4-6'`.
   - *Resolution:* Update `<option>` elements in `admin/src/App.tsx` to match mobile `AgeBand` (`'2-4'`, `'4-6'`, `'6-8'`, `'9-12'`, `'13-17'`, `'18-25'`, `'25+'`, `'parents'`).

6. **Bug 6 (Backend Auth):**
   - *Observation:* `backend/src/index.ts` `POST /catalog` allows unauthorized writes.
   - *Reasoning:* Anyone with the Cloudflare Worker URL can alter/delete the story catalog.
   - *Resolution:*
     - Add `ADMIN_SECRET?: string;` to `Env` in `backend/src/index.ts`.
     - In `POST /catalog`, verify `Authorization: Bearer <secret>`. Return `401 Unauthorized` if mismatched.
     - In `admin/src/App.tsx`, provide an admin secret header in `fetch(API_URL, { headers: { 'Authorization': `Bearer ${secret}` } })`.

7. **Bug 7 (AdBanner Fallback):**
   - *Observation:* In production (`!__DEV__`), `adUnitId` contains `ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz`.
   - *Reasoning:* Initializing `BannerAd` with placeholder or invalid IDs causes AdMob errors, empty blank spaces, or potential crashes.
   - *Resolution:* In `components/AdBanner.tsx`, validate that `adUnitId` is non-empty and does not contain `'xxxx'`. If invalid or if `onAdFailedToLoad` triggers, return `null` so the banner hides cleanly.

---

## 3. Caveats

- **Network Mode & Remote Backend:** The live Cloudflare worker endpoint is currently `https://saanjh-api.prabinkhokhali89.workers.dev/catalog`. When updating `backend/src/index.ts`, local test mock and Wrangler configuration must be aligned before deployment.
- **AdMob Production vs Test Unit IDs:** In testing and local dev builds, Google standard test IDs (`TestIds.BANNER` or `ca-app-pub-3940256099942544/6300978111`) should be used. When publishing to Play Store, real production unit IDs must be configured via environment or config, or fallback gracefully.
- **Unified Home Screen Overhaul (R3):** Note that while Bug 1 & Bug 4 address `app/index.tsx`, Pillar R3 also plans a redesign of `app/index.tsx` (Hero + Carousels + Favorites + Detail navigation). Fixing Bug 1 and Bug 4 directly prepares the codebase for clean R3 development.

---

## 4. Conclusion & Proposed Code Changes

### Proposed Snippets for Implementation:

#### 1. `constants/ui.ts` & `app/index.tsx` (Bug 1 & Bug 4)
In `constants/ui.ts`, add:
```ts
recentlyAdded: { en: 'Recently Added', ne: 'भर्खरै थपिएका' },
play: { en: 'Play', ne: 'कथा सुरु गरौं' },
library: { en: 'Library', ne: 'पुस्तकालय' },
forLittleOnes: { en: 'For Little Ones', ne: 'साना बाबुनानीका लागि' },
kidsAndTweens: { en: 'Kids & Tweens', ne: 'बालबालिकाका लागि' },
afterHoursParents: { en: 'After Hours (Parents)', ne: 'अभिभावकका लागि' },
youngAdults: { en: 'Young Adults', ne: 'किशोरकिशोरीका लागि' },
```
In `app/index.tsx`:
- Clean imports:
  ```tsx
  import { brand, colors } from '@/constants/theme';
  import { stories as allLocalStories } from '@/data/catalog';
  import { t, ui } from '@/constants/ui';
  ```
- Replace hardcoded `????` strings with `t(ui.recentlyAdded, language)`, `t(ui.play, language)`, `t(ui.library, language)`, `t(ui.forLittleOnes, language)`, `t(ui.kidsAndTweens, language)`, `t(ui.afterHoursParents, language)`, `t(ui.youngAdults, language)`.

#### 2. `store/useSettingsStore.ts` (Bug 2)
```ts
function parseAgeBand(value: unknown): AgeBand {
  if (value === 'teen') return '13-17';
  if (value === 'adult' || value === '18+') return '18-25';
  if (value === 'parent') return 'parents';
  return value === '2-4' ||
    value === '4-6' ||
    value === '6-8' ||
    value === '9-12' ||
    value === '13-17' ||
    value === '18-25' ||
    value === '25+' ||
    value === 'parents'
    ? value
    : '4-6';
}
```

#### 3. Delete `components/SplashRitual.tsx` (Bug 3)
Remove file `components/SplashRitual.tsx`.

#### 4. `admin/src/App.tsx` (Bug 5 & Bug 6)
- Update `<select>` for `ageBand`:
  ```tsx
  <select value={story.ageBand} onChange={e => updateStory(i, 'ageBand', e.target.value)} className="w-full border rounded-lg p-2">
    <option value="2-4">Ages 2-4 (Toddlers)</option>
    <option value="4-6">Ages 4-6 (Bedtime)</option>
    <option value="6-8">Ages 6-8 (Wonder)</option>
    <option value="9-12">Ages 9-12 (Growing)</option>
    <option value="13-17">Ages 13-17 (Teens)</option>
    <option value="18-25">Ages 18-25 (Young Adults)</option>
    <option value="25+">Ages 25+ (Grown)</option>
    <option value="parents">Parents (Novels / Audiobooks)</option>
  </select>
  ```
- Add Admin Secret state & header:
  ```tsx
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('saanjh_admin_secret') || '');
  // Inside saveCatalog:
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminSecret}`
    },
    body: JSON.stringify(newCatalog)
  });
  if (res.status === 401) throw new Error('Unauthorized: Invalid Admin Secret');
  ```

#### 5. `backend/src/index.ts` (Bug 6)
```ts
type Env = {
  SAANJH_DB: KVNamespace;
  ADMIN_SECRET?: string;
};

// POST /catalog
app.post('/catalog', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const expectedSecret = c.env.ADMIN_SECRET;

  if (expectedSecret && token !== expectedSecret) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    await c.env.SAANJH_DB.put('catalog', JSON.stringify(body));
    return c.json({ success: true, message: 'Catalog updated successfully!' });
  } catch (err) {
    return c.json({ success: false, error: 'Failed to update catalog' }, 500);
  }
});
```

#### 6. `components/AdBanner.tsx` (Bug 7)
```tsx
import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const rawUnitId = Platform.OS === 'ios'
  ? 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy'
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz';

const isValidUnitId = (id?: string) => !!id && !id.includes('xxxxxxxx') && !id.includes('zzzzzzzz');

const adUnitId = __DEV__ 
  ? TestIds.BANNER 
  : (isValidUnitId(rawUnitId) ? rawUnitId : null);

export function AdBanner() {
  const [hasError, setHasError] = useState(false);

  if (!adUnitId || hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={() => setHasError(true)}
      />
    </View>
  );
}
```

---

## 5. Verification Method

1. **TypeScript Static Verification:**
   - Root project: `npx tsc --noEmit` -> verify 0 errors, no unused imports in `app/index.tsx`.
   - Admin panel: `cd admin && npm run build` (`tsc -b && vite build`) -> verify clean compilation.
2. **Settings Store Persistence Verification:**
   - Set `useSettingsStore.getState().setAgeBand('parents')`.
   - Re-run `useSettingsStore.getState().hydrate()` -> assert `useSettingsStore.getState().ageBand === 'parents'`.
3. **Dead Code Elimination Verification:**
   - Run `fd SplashRitual` or search filesystem -> verify `SplashRitual.tsx` does not exist.
4. **Backend Auth Verification:**
   - Execute `curl -X POST http://localhost:8787/catalog -H "Content-Type: application/json" -d '{"stories":[]}'` -> Expect `401 Unauthorized`.
   - Execute `curl -X POST http://localhost:8787/catalog -H "Content-Type: application/json" -H "Authorization: Bearer <ADMIN_SECRET>" -d '{"stories":[]}'` -> Expect `200 OK`.
5. **AdBanner Verification:**
   - Test in release mode without valid AdMob credentials -> verify component returns `null` and renders no layout artifacts.
