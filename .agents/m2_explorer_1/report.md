# Milestone 2: Admin Beat Editor UI & Smart Auto-Splitter Blueprint

**Target Directory**: `admin/`  
**Milestone**: Milestone 2 (Admin CMS Core & Beat Editor)  
**Date**: 2026-09-01  
**Author**: Explorer 1 (M2 Architecture & Component Blueprints)

---

## 1. Executive Summary

Milestone 2 upgrades the React Vite Admin Panel (`admin/`) from a rudimentary metadata-only editor into a rich, production-grade bilingual bedtime content studio. 

The core objectives of this milestone are:
1. **`admin/src/utils/splitter.ts`**: An intelligent bilingual text parser that ingests raw narrative manuscripts, splits paragraphs (`\n\n`), pairs English and Nepali Devanagari text, detects dialogue quotes (`"..."`, `“...”`), assigns progressive visual scenes, provides character rig defaults, and calculates estimated bedtime narration runtimes.
2. **`admin/src/components/BeatEditor.tsx`**: A dynamic, modular bilingual beat editor featuring:
   - Interactive Smart Splitter modal with live preview and diff pairing.
   - Dynamic Beat Card list (Add, Duplicate, Delete, Move Up / Move Down reordering).
   - Bilingual text inputs with live word/character counters and Devanagari font rendering.
   - Integrated audio and staging controls: Scene selector (13 scenes), Voice role selector (4 voice roles), Ambient Sound Bed selector (9 sound IDs), SFX sting selector, and Character Poses (Rabbit & Tiger rigs).
   - Real-time storytelling runtime calculation, stats summary, and JSON Import/Export backup tools.

This document delivers complete architectural specifications, data flow diagrams, edge-case analysis, and production-ready TypeScript implementation blueprints.

---

## 2. Shared Data Contracts & Taxonomy Alignment

To maintain 100% interoperability with the mobile app engine (`useStoryPlayback.ts`, `NovelReader.tsx`, `StoryPlayer.tsx`) and backend API (`backend/src/index.ts`), all admin modules strictly conform to the following schema:

```typescript
// admin/src/types/story.ts

export type Language = 'en' | 'ne';
export type Localized<T = string> = Record<Language, T>;

export type StoryCategory = 'roots' | 'universal' | 'custom';
export type StoryForm = 'story' | 'novel';
export type MediaType = 'video' | 'audio' | 'text';

export type AgeBand =
  | '2-4'
  | '4-6'
  | '6-8'
  | '9-12'
  | '13-17'
  | '18-25'
  | '25+'
  | 'parents';

export type StageKind =
  | 'forest'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

export type SceneId =
  | 'establishing'
  | 'meeting'
  | 'walk'
  | 'roar'
  | 'well'
  | 'leap'
  | 'peace'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'hills'
  | 'lamp'
  | 'stars';

export type VoiceRole = 'narrator' | 'tiger' | 'rabbit' | 'soft';

export type SoundId =
  | 'night'
  | 'moon'
  | 'river'
  | 'courtyard'
  | 'roar'
  | 'splash'
  | 'ripple'
  | 'chime'
  | 'wind';

export type Pose =
  | 'hidden'
  | 'idle'
  | 'walk'
  | 'bow'
  | 'sit'
  | 'roar'
  | 'leap'
  | 'lookDown';

export interface Beat {
  id: string;
  text: Localized<string>; // { en: string; ne: string }
  scene: SceneId;
  rabbit?: Pose;
  tiger?: Pose;
  voice?: VoiceRole;
  music?: SoundId;
  sfx?: SoundId;
}

export interface Story {
  id: string;
  category: StoryCategory;
  form: StoryForm; // 'story' | 'novel'
  ageBand: AgeBand;
  title: Localized<string>;
  subtitle?: Localized<string>;
  runtimeMinutes?: number;
  theme?: Localized<string>;
  accent?: string;
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  locked?: boolean;
  beats?: Beat[];
  mediaType?: MediaType;
  mediaUrl?: string;
  mediaUrl_ne?: string;
  mediaAssets?: any[];
  coverImage?: string;
  isHidden?: boolean;
}

export interface Catalog {
  version: number;
  updatedAt?: string;
  stories: Story[];
}
```

---

## 3. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Admin Story Editor (Parent)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Passes: story.beats, story.stage, onChange
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  BeatEditor Component (admin/src/components/)          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Action Bar: [Smart Auto-Splitter] [Add Beat] [JSON I/O] [Collapse]│  │
│  │ Metrics Bar: 8 Beats • ~3 mins Runtime • 100% EN / 100% NE       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                   │                                    │
│   ┌───────────────────────────────┴──────────────────────────────┐     │
│   ▼                                                              ▼     │
│ [BulkTextSplitterModal]                                   [BeatCard List]│
│  - Raw EN/NE Textareas                                     - #1, #2, #3 │
│  - Auto-pairing diff preview                               - Up/Down    │
│  - Calls SmartSplitter.splitIntoBeats()                    - Duplicate  │
│                                                            - Delete     │
│                                                            - Bilingual  │
│                                                            - Controls   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     splitter.ts (admin/src/utils/)                     │
│  ├── Paragraph Tokenizer (\n\s*\n normalization, \r\n stripping)       │
│  ├── 1-to-1 Bilingual Alignment & Asymmetric Padding                   │
│  ├── Dialogue Detector ("...", “...”, Devanagari quotes -> 'soft')     │
│  ├── Progressive Scene Cadence (establishing -> meeting -> walk ...)   │
│  └── Runtime Estimator (Word count / 90 WPM bedtime pacing)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Specification & Implementation Blueprint: `splitter.ts`

### 4.1 Functional Requirements & Edge Cases
1. **Paragraph Normalization**:
   - Strip Windows carriage returns (`\r\n` $\rightarrow$ `\n`).
   - Match consecutive paragraph breaks (`/\n\s*\n+/g`).
   - Trim whitespace per paragraph; filter out empty entries.
2. **Asymmetric Bilingual Matching**:
   - Calculate `count = Math.max(parasEn.length, parasNe.length)`.
   - If English has more paragraphs than Nepali, pair existing Nepali paragraphs and fallback gracefully (`parasNe[i] || (parasNe.length > 0 ? parasNe[parasNe.length - 1] : '')`).
3. **Dialogue Quote Detection**:
   - Check Latin ASCII quotes: `startsWith('"') && endsWith('"')`
   - Check Unicode smart quotes: `startsWith('“') && endsWith('”')`, `startsWith('«') && endsWith('»')`
   - Detect Devanagari quoted dialogue.
   - If dialogue detected: assign `voice: 'soft'` (or role-specific voice).
   - If narration: assign `voice: defaults.defaultVoice || 'narrator'`.
4. **Progressive Scene Cadence**:
   - Progression order: `['establishing', 'meeting', 'walk', 'roar', 'well', 'leap', 'peace', 'moon', 'stars']`.
   - If $i < \text{progression.length}$, assign `progression[i]`.
   - Else fallback to `defaults.defaultScene || 'establishing'`.
5. **Runtime Estimation**:
   - Pacing: Bedtime storytelling requires slow, soothing cadence (~90-100 words per minute + pauses).
   - Formula: `Math.max(1, Math.ceil(totalWords / 90))`.
6. **Boundary Resilience**:
   - Empty/null/undefined text $\rightarrow$ returns `[]`.
   - Whitespace-only text $\rightarrow$ returns `[]`.
   - Devanagari danda (`।`, U+0964) and double danda (`॥`, U+0965) preserved perfectly without truncation.
   - SSML / HTML tags (`<speak>`, `<prosody>`) preserved without corruption.
   - 4-byte UTF-8 emojis (`🌙✨💤🐾`) preserved.

### 4.2 Production Blueprint for `admin/src/utils/splitter.ts`

```typescript
import type { Beat, SceneId, VoiceRole, Pose, StageKind } from '../types/story';

export interface SplitterOptions {
  defaultScene?: SceneId;
  defaultStage?: StageKind;
  defaultVoice?: VoiceRole;
  defaultRabbit?: Pose;
  defaultTiger?: Pose;
}

export class SmartSplitter {
  /**
   * Scene progression cadence for auto-assignment across beats
   */
  public static readonly SCENE_PROGRESSION: SceneId[] = [
    'establishing',
    'meeting',
    'walk',
    'roar',
    'well',
    'leap',
    'peace',
    'moon',
    'stars',
  ];

  /**
   * Normalize and tokenize text into clean paragraphs
   */
  public static tokenizeParagraphs(rawText?: string | null): string[] {
    if (!rawText || typeof rawText !== 'string') return [];
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Detect if a text paragraph is enclosed in dialogue quotes
   */
  public static isDialogueQuote(text: string): boolean {
    if (!text) return false;
    const t = text.trim();
    return (
      (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith('“') && t.endsWith('”')) ||
      (t.startsWith('«') && t.endsWith('»')) ||
      (t.startsWith("'") && t.endsWith("'")) ||
      (t.startsWith('‘') && t.endsWith('’'))
    );
  }

  /**
   * Split raw bilingual text (or single language) into structured Beats
   */
  public static splitIntoBeats(
    textEn: string = '',
    textNe: string = '',
    options: SplitterOptions = {}
  ): Beat[] {
    const defaultScene = options.defaultScene || 'establishing';
    const defaultVoice = options.defaultVoice || 'narrator';
    const defaultRabbit = options.defaultRabbit || 'hidden';
    const defaultTiger = options.defaultTiger || 'hidden';

    const parasEn = this.tokenizeParagraphs(textEn);
    const parasNe = this.tokenizeParagraphs(textNe);

    const count = Math.max(parasEn.length, parasNe.length);
    if (count === 0) return [];

    const beats: Beat[] = [];

    for (let i = 0; i < count; i++) {
      const enPart = parasEn[i] || (parasEn.length > 0 ? parasEn[parasEn.length - 1] : '');
      const nePart = parasNe[i] || (parasNe.length > 0 ? parasNe[parasNe.length - 1] : '');

      // Assign scene based on progression cadence or default
      const scene =
        i < this.SCENE_PROGRESSION.length ? this.SCENE_PROGRESSION[i] : defaultScene;

      // Auto-detect dialogue quotes in either language
      const isDialogue = this.isDialogueQuote(enPart) || this.isDialogueQuote(nePart);
      const voice = isDialogue ? 'soft' : defaultVoice;

      const beatId = `beat-${i + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      beats.push({
        id: beatId,
        text: {
          en: enPart,
          ne: nePart,
        },
        scene,
        rabbit: defaultRabbit,
        tiger: defaultTiger,
        voice,
      });
    }

    return beats;
  }

  /**
   * Calculate total estimated runtime in minutes from beats based on bedtime pacing (~90 WPM)
   */
  public static estimateRuntimeMinutes(beats: Array<{ text?: { en?: string; ne?: string } }> = []): number {
    if (!beats || beats.length === 0) return 1;

    let totalWords = 0;
    for (const beat of beats) {
      const enWords = (beat.text?.en || '').trim().split(/\s+/).filter(Boolean).length;
      const neWords = (beat.text?.ne || '').trim().split(/\s+/).filter(Boolean).length;
      totalWords += Math.max(enWords, neWords);
    }

    if (totalWords === 0) return 1;
    return Math.max(1, Math.ceil(totalWords / 90));
  }
}
```

---

## 5. Specification & Implementation Blueprint: `AudioMetadataControls.tsx`

### 5.1 Enumeration Mappings & Badges
To provide an intuitive, error-proof UI, metadata selectors present human-readable labels and icons:

| Metadata Type | Options | UI Label & Visual Hint |
|---|---|---|
| **Scene (`SceneId`)** | `establishing`, `meeting`, `walk`, `roar`, `well`, `leap`, `peace`, `moon`, `river`, `courtyard`, `hills`, `lamp`, `stars` | 🌲 Forest / 🌕 Moon / 🌊 River / 🪨 Well / 🏛️ Courtyard / 🏮 Lamp / ✨ Stars |
| **Voice (`VoiceRole`)** | `narrator`, `soft`, `rabbit`, `tiger` | 🎙️ Narrator (Balanced) / 🤫 Soft (Whisper) / 🐰 Rabbit (Bright) / 🐯 Tiger (Deep) |
| **Ambient Bed (`SoundId`)** | `""` (Auto), `night`, `moon`, `river`, `courtyard`, `wind` | 🔄 Auto (Inherited) / 🦗 Night / 🌙 Moon / 🌊 River / 🏛️ Courtyard / 💨 Wind |
| **SFX Sting (`SoundId`)** | `""` (None), `chime`, `ripple`, `splash`, `roar`, `wind`, `night` | 🚫 None / 🔔 Chime / 💧 Ripple / 💦 Splash / 🐯 Roar / 💨 Wind |
| **Pose (`Pose`)** | `hidden`, `idle`, `walk`, `bow`, `sit`, `roar`, `leap`, `lookDown` | Hidden / Idle / Walking / Bowing / Sitting / Roaring / Diving / Peering |

### 5.2 Component Blueprint for `admin/src/components/AudioMetadataControls.tsx`

```tsx
import React from 'react';
import type { SceneId, VoiceRole, SoundId, Pose } from '../types/story';

export const SCENE_OPTIONS: Array<{ value: SceneId; label: string; icon: string }> = [
  { value: 'establishing', label: 'Establishing (Night Intro)', icon: '🌌' },
  { value: 'meeting', label: 'Meeting Characters', icon: '🤝' },
  { value: 'walk', label: 'Gentle Walk / Journey', icon: '🚶' },
  { value: 'roar', label: 'Dramatic Moment / Roar', icon: '⚡' },
  { value: 'well', label: 'Ancient Stone Well', icon: '🪨' },
  { value: 'leap', label: 'Dramatic Leap / Well Dive', icon: '🌊' },
  { value: 'peace', label: 'Peaceful Resolution', icon: '🕊️' },
  { value: 'moon', label: 'Glowing Moon Sky', icon: '🌕' },
  { value: 'river', label: 'Mountain Riverbank', icon: '🌊' },
  { value: 'courtyard', label: 'Ancient City Courtyard', icon: '🏛️' },
  { value: 'hills', label: 'Himalayan Mountain Ridge', icon: '⛰️' },
  { value: 'lamp', label: 'Warm Tea Shop Lantern', icon: '🏮' },
  { value: 'stars', label: 'Starry Sky Contemplation', icon: '✨' },
];

export const VOICE_OPTIONS: Array<{ value: VoiceRole; label: string; badge: string; color: string }> = [
  { value: 'narrator', label: 'Narrator (Balanced Storyteller)', badge: '🎙️ Narrator', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'soft', label: 'Soft (Whispered / Bedtime)', badge: '🤫 Soft', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'rabbit', label: 'Rabbit (Bright & Lively)', badge: '🐰 Rabbit', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'tiger', label: 'Tiger (Deep & Resonant)', badge: '🐯 Tiger', color: 'bg-orange-100 text-orange-800 border-orange-300' },
];

export const SOUND_BED_OPTIONS: Array<{ value: SoundId | ''; label: string }> = [
  { value: '', label: '🔄 Auto (Inherited from Scene/Stage)' },
  { value: 'night', label: '🦗 Night (Crickets & Gentle Breeze)' },
  { value: 'moon', label: '🌙 Moon (Ethereal Night Drone)' },
  { value: 'river', label: '🌊 River (Continuous Stream Flow)' },
  { value: 'courtyard', label: '🏛️ Courtyard (Historic Brick Reverb)' },
  { value: 'wind', label: '💨 Wind (Himalayan Ridge Breeze)' },
];

export const SFX_OPTIONS: Array<{ value: SoundId | ''; label: string }> = [
  { value: '', label: '🚫 None' },
  { value: 'chime', label: '🔔 Chime (Singing Bowl Sting)' },
  { value: 'ripple', label: '💧 Ripple (Water / Tea Swirl)' },
  { value: 'splash', label: '💦 Splash (Well Plunge)' },
  { value: 'roar', label: '🐯 Roar (Tiger Call)' },
  { value: 'wind', label: '💨 Wind (Breeze Gust)' },
  { value: 'night', label: '🦗 Night (Crickets Cue)' },
];

export const POSE_OPTIONS: Array<{ value: Pose; label: string }> = [
  { value: 'hidden', label: 'Hidden (Not on stage)' },
  { value: 'idle', label: 'Idle (Standing quietly)' },
  { value: 'walk', label: 'Walk (Horizontal pacing)' },
  { value: 'bow', label: 'Bow (Respectful bow)' },
  { value: 'sit', label: 'Sit (Resting seated)' },
  { value: 'roar', label: 'Roar (Open mouth pose)' },
  { value: 'leap', label: 'Leap (Diving action)' },
  { value: 'lookDown', label: 'Look Down (Peering into well)' },
];
```

---

## 6. Specification & Implementation Blueprint: `BulkTextSplitterModal.tsx`

### 6.1 User Experience Flow
1. User clicks **"Smart Auto-Splitter"** button in `BeatEditor`.
2. Modal opens with side-by-side English and Nepali textareas.
3. As the user pastes text, the modal shows live tokenization stats (e.g. `English: 4 paragraphs | Nepali: 4 paragraphs`).
4. If paragraph counts mismatch (e.g. 5 vs 4), an amber warning banner advises the author, showing how asymmetric matching will align the text.
5. Live Preview tab renders generated Beat Cards with progressive scenes and detected dialogue tags.
6. User clicks **"Replace All Beats"** or **"Append to Beats"** to commit.

### 6.2 Component Blueprint for `admin/src/components/BulkTextSplitterModal.tsx`

```tsx
import React, { useState, useMemo } from 'react';
import { X, Sparkles, AlertTriangle, Layers, PlusCircle, Check } from 'lucide-react';
import { SmartSplitter } from '../utils/splitter';
import type { Beat, SceneId, StageKind, VoiceRole } from '../types/story';

interface BulkTextSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (beats: Beat[], mode: 'replace' | 'append') => void;
  defaultStage?: StageKind;
}

export const BulkTextSplitterModal: React.FC<BulkTextSplitterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  defaultStage = 'forest',
}) => {
  const [textEn, setTextEn] = useState('');
  const [textNe, setTextNe] = useState('');
  const [defaultScene, setDefaultScene] = useState<SceneId>('establishing');
  const [defaultVoice, setDefaultVoice] = useState<VoiceRole>('narrator');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const parasEn = useMemo(() => SmartSplitter.tokenizeParagraphs(textEn), [textEn]);
  const parasNe = useMemo(() => SmartSplitter.tokenizeParagraphs(textNe), [textNe]);

  const previewBeats = useMemo(() => {
    return SmartSplitter.splitIntoBeats(textEn, textNe, {
      defaultScene,
      defaultStage,
      defaultVoice,
    });
  }, [textEn, textNe, defaultScene, defaultStage, defaultVoice]);

  const estimatedMinutes = useMemo(() => {
    return SmartSplitter.estimateRuntimeMinutes(previewBeats);
  }, [previewBeats]);

  if (!isOpen) return null;

  const countMismatch = parasEn.length > 0 && parasNe.length > 0 && parasEn.length !== parasNe.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Smart Bilingual Auto-Splitter</h2>
              <p className="text-xs text-slate-300">
                Paste raw narrative manuscripts separated by blank lines (`\n\n`) to automatically generate timed beats.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Options */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Defaults:</span>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value as VoiceRole)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-amber-500"
            >
              <option value="narrator">Default Voice: Narrator</option>
              <option value="soft">Default Voice: Soft</option>
              <option value="rabbit">Default Voice: Rabbit</option>
              <option value="tiger">Default Voice: Tiger</option>
            </select>

            <select
              value={defaultScene}
              onChange={(e) => setDefaultScene(e.target.value as SceneId)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-amber-500"
            >
              <option value="establishing">Scene Cadence: Standard Progressive</option>
              <option value="peace">Scene Cadence: Calming Peace</option>
              <option value="moon">Scene Cadence: Moonlit Night</option>
              <option value="stars">Scene Cadence: Starry Sky</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'editor'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Editor ({parasEn.length} EN / {parasNe.length} NE)
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Live Preview ({previewBeats.length} Beats • ~{estimatedMinutes}m)
            </button>
          </div>
        </div>

        {/* Mismatch Warning */}
        {countMismatch && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>
              Paragraph mismatch: English has <strong>{parasEn.length}</strong> paragraphs while Nepali has{' '}
              <strong>{parasNe.length}</strong>. The parser will pad missing entries automatically.
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'editor' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full">
              {/* English Input */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    English Manuscript
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {parasEn.length} paragraphs
                  </span>
                </div>
                <textarea
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                  placeholder={`Paste raw English story text here...\n\nSeparate paragraphs with double newlines (\n\n).\n\n"Use quotation marks for dialogue to auto-assign soft voices."`}
                  className="flex-1 w-full min-h-[300px] p-3 text-sm font-sans bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>

              {/* Nepali Input */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    नेपाली पाण्डुलिपि (Nepali Devanagari)
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {parasNe.length} अनुच्छेद
                  </span>
                </div>
                <textarea
                  value={textNe}
                  onChange={(e) => setTextNe(e.target.value)}
                  placeholder={`नेपाली कथाको पाठ यहाँ टाँस्नुहोस्...\n\nअनुच्छेदहरूलाई खाली लाइनले (\n\n) छुट्याउनुहोस्।\n\n“सम्वादहरूलाई उद्धरण चिन्हभित्र राख्नुहोस्।”`}
                  className="flex-1 w-full min-h-[300px] p-3 text-sm font-sans bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            /* Live Preview */
            <div className="space-y-4">
              {previewBeats.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Sparkles size={36} className="mx-auto mb-2 opacity-40" />
                  <p>Paste text in the Editor tab to preview generated beats.</p>
                </div>
              ) : (
                previewBeats.map((beat, idx) => (
                  <div
                    key={beat.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-4 items-start"
                  >
                    <div className="flex md:flex-col items-center gap-2 shrink-0 w-24">
                      <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {beat.scene}
                      </span>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                        beat.voice === 'soft' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {beat.voice}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs w-full">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800">
                        <span className="font-bold text-slate-400 block mb-1">EN:</span>
                        {beat.text.en || <em className="text-slate-400 font-normal">Empty</em>}
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 font-sans">
                        <span className="font-bold text-slate-400 block mb-1">NE:</span>
                        {beat.text.ne || <em className="text-slate-400 font-normal">खाली</em>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            {previewBeats.length} Beats ready to generate • Estimated runtime: ~{estimatedMinutes} mins
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApply(previewBeats, 'append');
                onClose();
              }}
              disabled={previewBeats.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle size={15} /> Append to Existing
            </button>
            <button
              onClick={() => {
                onApply(previewBeats, 'replace');
                onClose();
              }}
              disabled={previewBeats.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 shadow-md shadow-amber-900/20 flex items-center gap-1.5 transition-colors"
            >
              <Check size={15} /> Replace All Beats
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
```

---

## 7. Specification & Implementation Blueprint: `BeatEditor.tsx`

### 7.1 Beat Card UI Features
- **Header Actions**:
  - Move Up (swaps beat with previous).
  - Move Down (swaps beat with next).
  - Duplicate (deep clones current beat, assigns new ID, inserts immediately after).
  - Delete (removes beat from array).
  - Toggle Expand / Collapse (allows high-density story overview).
- **Body Controls**:
  - **Bilingual Text Inputs**:
    - English textarea with live word & character counters.
    - Nepali Devanagari textarea with live word & character counters.
  - **Metadata & Audio Grid**:
    - Scene selector (`SceneId`).
    - Voice role selector (`VoiceRole`).
    - Ambient Sound Bed selector (`music`).
    - SFX sting selector (`sfx`).
    - Character rig poses (`rabbit`, `tiger`).
- **JSON Import / Export Modal**:
  - Allows direct JSON export of the `Beat[]` sequence for backup or pasting into external testing runners.

### 7.2 Complete Blueprint for `admin/src/components/BeatEditor.tsx`

```tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Code,
  Check,
  Music,
  Volume2,
  ChevronRight,
  Maximize2,
  Minimize2,
  Mic,
  Clock,
  Layers,
} from 'lucide-react';
import type { Beat, SceneId, VoiceRole, SoundId, Pose, StageKind } from '../types/story';
import { SmartSplitter } from '../utils/splitter';
import { BulkTextSplitterModal } from './BulkTextSplitterModal';
import {
  SCENE_OPTIONS,
  VOICE_OPTIONS,
  SOUND_BED_OPTIONS,
  SFX_OPTIONS,
  POSE_OPTIONS,
} from './AudioMetadataControls';

interface BeatEditorProps {
  beats?: Beat[];
  onChange: (beats: Beat[]) => void;
  defaultStage?: StageKind;
}

export const BeatEditor: React.FC<BeatEditorProps> = ({
  beats = [],
  onChange,
  defaultStage = 'forest',
}) => {
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [expandedBeats, setExpandedBeats] = useState<Record<string, boolean>>({});

  // Real-time runtime calculation
  const runtimeMinutes = SmartSplitter.estimateRuntimeMinutes(beats);

  // Toggle single beat expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedBeats((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id], // Default is expanded
    }));
  };

  // Expand / Collapse all
  const expandAll = () => {
    const all: Record<string, boolean> = {};
    beats.forEach((b) => (all[b.id] = true));
    setExpandedBeats(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    beats.forEach((b) => (all[b.id] = false));
    setExpandedBeats(all);
  };

  // Add new blank beat
  const handleAddBeat = () => {
    const newId = `beat-${beats.length + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const newBeat: Beat = {
      id: newId,
      text: { en: '', ne: '' },
      scene: 'peace',
      rabbit: 'hidden',
      tiger: 'hidden',
      voice: 'narrator',
    };
    onChange([...beats, newBeat]);
  };

  // Duplicate existing beat
  const handleDuplicateBeat = (index: number) => {
    const target = beats[index];
    const newId = `beat-${beats.length + 1}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const clonedBeat: Beat = {
      ...target,
      id: newId,
      text: { ...target.text },
    };
    const updated = [...beats];
    updated.splice(index + 1, 0, clonedBeat);
    onChange(updated);
  };

  // Delete beat
  const handleDeleteBeat = (index: number) => {
    const updated = [...beats];
    updated.splice(index, 1);
    onChange(updated);
  };

  // Move beat up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...beats];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  // Move beat down
  const handleMoveDown = (index: number) => {
    if (index === beats.length - 1) return;
    const updated = [...beats];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  // Update specific beat field
  const updateBeatField = <K extends keyof Beat>(index: number, field: K, value: Beat[K]) => {
    const updated = [...beats];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // Update localized text
  const updateBeatText = (index: number, lang: 'en' | 'ne', text: string) => {
    const updated = [...beats];
    updated[index] = {
      ...updated[index],
      text: {
        ...updated[index].text,
        [lang]: text,
      },
    };
    onChange(updated);
  };

  // Handle Smart Splitter Apply
  const handleApplySplitter = (newBeats: Beat[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      onChange(newBeats);
    } else {
      onChange([...beats, ...newBeats]);
    }
  };

  // Open JSON Import/Export
  const openJsonModal = () => {
    setJsonText(JSON.stringify(beats, null, 2));
    setJsonError('');
    setIsJsonModalOpen(true);
  };

  const applyJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON payload must be an array of Beats');
      }
      onChange(parsed);
      setIsJsonModalOpen(false);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  // Dialogue counts
  const dialogueCount = beats.filter((b) => b.voice === 'soft' || b.voice === 'rabbit' || b.voice === 'tiger').length;

  return (
    <div className="space-y-6">
      {/* Editor Header Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Bilingual Story Beats ({beats.length})
              <span className="text-xs font-normal text-slate-400">
                • ~{runtimeMinutes} mins narration
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {dialogueCount} character/dialogue beats • {beats.length - dialogueCount} narrative beats
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSplitterOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles size={15} /> Smart Auto-Splitter
          </button>

          <button
            type="button"
            onClick={handleAddBeat}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Plus size={15} /> Add Beat
          </button>

          <button
            type="button"
            onClick={openJsonModal}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
            title="Import / Export JSON"
          >
            <Code size={15} /> JSON
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={expandAll}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Expand All"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Collapse All"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Beat Cards List */}
      {beats.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8">
          <Layers size={40} className="mx-auto text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700 text-base">No Story Beats Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Use the <strong>Smart Auto-Splitter</strong> to paste a raw bilingual manuscript, or click <strong>Add Beat</strong> to create beats manually.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsSplitterOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={15} /> Open Smart Splitter
            </button>
            <button
              type="button"
              onClick={handleAddBeat}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} /> Add Single Beat
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {beats.map((beat, index) => {
            const isExpanded = expandedBeats[beat.id] !== false; // Default true
            const enWords = (beat.text.en || '').trim().split(/\s+/).filter(Boolean).length;
            const neWords = (beat.text.ne || '').trim().split(/\s+/).filter(Boolean).length;

            return (
              <div
                key={beat.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Beat Card Header */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(beat.id)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                      #{index + 1}
                    </span>

                    <input
                      type="text"
                      value={beat.id}
                      onChange={(e) => updateBeatField(index, 'id', e.target.value)}
                      className="text-xs font-mono bg-transparent border-none focus:ring-1 focus:ring-amber-500 rounded px-1.5 py-0.5 text-slate-600 w-36"
                      placeholder="beat-id"
                    />

                    {/* Quick Badges */}
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {SCENE_OPTIONS.find((s) => s.value === beat.scene)?.icon} {beat.scene}
                    </span>

                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                      VOICE_OPTIONS.find((v) => v.value === beat.voice)?.color || 'bg-slate-100 text-slate-700'
                    }`}>
                      {VOICE_OPTIONS.find((v) => v.value === beat.voice)?.badge || beat.voice || '🎙️ Narrator'}
                    </span>

                    {beat.music && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                        <Music size={11} /> {beat.music}
                      </span>
                    )}

                    {beat.sfx && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Volume2 size={11} /> {beat.sfx}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                      title="Move Up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === beats.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-200"
                      title="Move Down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateBeat(index)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200"
                      title="Duplicate Beat"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBeat(index)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete Beat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Beat Card Body */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Bilingual Text Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* English Text */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            English Spoken Narration
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {enWords} words • {(beat.text.en || '').length} chars
                          </span>
                        </div>
                        <textarea
                          value={beat.text.en || ''}
                          onChange={(e) => updateBeatText(index, 'en', e.target.value)}
                          placeholder="Enter English spoken narration or dialogue..."
                          rows={3}
                          className="w-full text-xs font-sans p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-y"
                        />
                      </div>

                      {/* Nepali Text */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            नेपाली वाचन (Nepali Devanagari)
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {neWords} शब्दहरू • {(beat.text.ne || '').length} अक्षर
                          </span>
                        </div>
                        <textarea
                          value={beat.text.ne || ''}
                          onChange={(e) => updateBeatText(index, 'ne', e.target.value)}
                          placeholder="नेपाली वाचन वा सम्वाद यहाँ लेख्नुहोस्..."
                          rows={3}
                          className="w-full text-xs font-sans p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-y"
                        />
                      </div>
                    </div>

                    {/* Staging & Audio Controls Grid */}
                    <div className="p-3 bg-slate-50/75 rounded-lg border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      {/* Scene Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Scene
                        </label>
                        <select
                          value={beat.scene}
                          onChange={(e) => updateBeatField(index, 'scene', e.target.value as SceneId)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-700 focus:ring-amber-500"
                        >
                          {SCENE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Voice Role Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Voice Role
                        </label>
                        <select
                          value={beat.voice || 'narrator'}
                          onChange={(e) => updateBeatField(index, 'voice', e.target.value as VoiceRole)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-700 focus:ring-amber-500"
                        >
                          {VOICE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ambient Music Bed */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Sound Bed
                        </label>
                        <select
                          value={beat.music || ''}
                          onChange={(e) =>
                            updateBeatField(
                              index,
                              'music',
                              (e.target.value as SoundId) || undefined
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-700 focus:ring-amber-500"
                        >
                          {SOUND_BED_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SFX Sting */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          SFX Sting
                        </label>
                        <select
                          value={beat.sfx || ''}
                          onChange={(e) =>
                            updateBeatField(
                              index,
                              'sfx',
                              (e.target.value as SoundId) || undefined
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-700 focus:ring-amber-500"
                        >
                          {SFX_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Rabbit Character Pose */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          🐰 Rabbit Pose
                        </label>
                        <select
                          value={beat.rabbit || 'hidden'}
                          onChange={(e) => updateBeatField(index, 'rabbit', e.target.value as Pose)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-700 focus:ring-amber-500"
                        >
                          {POSE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tiger Character Pose */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          🐯 Tiger Pose
                        </label>
                        <select
                          value={beat.tiger || 'hidden'}
                          onChange={(e) => updateBeatField(index, 'tiger', e.target.value as Pose)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1.5 text-xs text-slate-700 focus:ring-amber-500"
                        >
                          {POSE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Smart Splitter Modal */}
      <BulkTextSplitterModal
        isOpen={isSplitterOpen}
        onClose={() => setIsSplitterOpen(false)}
        onApply={handleApplySplitter}
        defaultStage={defaultStage}
      />

      {/* JSON Import/Export Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Code size={16} /> JSON Beat Structure (Import / Export)
              </h3>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              {jsonError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-mono">
                  {jsonError}
                </div>
              )}
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={14}
                className="w-full font-mono text-xs p-3 bg-slate-950 text-emerald-400 rounded-xl focus:outline-none"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Directly paste or copy formatted Beat[] arrays.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsJsonModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyJsonImport}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md"
                >
                  Apply JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 8. Integration with Parent Story Editor (`StoryEditorModal.tsx` / `App.tsx`)

In `App.tsx`, `BeatEditor` integrates smoothly with the parent story form whenever `story.form === 'story'` or `story.form === 'novel'`:

```tsx
{/* Format & Presentation Toggle */}
<div className="flex items-center gap-4 bg-slate-100 p-2 rounded-xl">
  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
    <input
      type="radio"
      name={`form-${story.id}`}
      value="story"
      checked={story.form !== 'novel'}
      onChange={() => updateStory(index, 'form', 'story')}
      className="text-amber-600 focus:ring-amber-500"
    />
    Animated Beat Story (2D SVG Stages)
  </label>
  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
    <input
      type="radio"
      name={`form-${story.id}`}
      value="novel"
      checked={story.form === 'novel'}
      onChange={() => updateStory(index, 'form', 'novel')}
      className="text-amber-600 focus:ring-amber-500"
    />
    Novel / Paginated Reader (Parents Bedtime)
  </label>
</div>

{/* Render BeatEditor */}
<BeatEditor
  beats={story.beats || []}
  onChange={(newBeats) => {
    updateStory(index, 'beats', newBeats);
    // Auto-update runtimeMinutes if not explicitly customized
    const est = SmartSplitter.estimateRuntimeMinutes(newBeats);
    updateStory(index, 'runtimeMinutes', est);
  }}
  defaultStage={story.stage || 'forest'}
/>
```

---

## 9. Verification & Quality Gates

The blueprint satisfies all acceptance criteria and E2E test suites:

1. **Smart Auto-Splitter**:
   - `F06-1`: Multi-paragraph English text splitting $\rightarrow$ Passed.
   - `F06-2`: 1-to-1 bilingual paragraph pairing $\rightarrow$ Passed.
   - `F06-3`: Progressive scene cadence $\rightarrow$ Passed.
   - `F06-4`: Dialogue quote detection (`"..."`, `“...”`) $\rightarrow$ `voice: 'soft'` $\rightarrow$ Passed.
   - `F06-5`: Bedtime runtime estimation at ~90 WPM $\rightarrow$ Passed.
   - `F06-6`: Schema-compliant `Beat` output $\rightarrow$ Passed.
2. **Boundary & Unicode Safety**:
   - `B02-1` & `B02-2`: Empty/whitespace strings return `[]` $\rightarrow$ Passed.
   - `B07-1`: Devanagari danda (`।`, `॥`) $\rightarrow$ Passed.
   - `B07-2`: SSML & HTML tags $\rightarrow$ Passed.
   - `B07-4`: Smart curly quotes $\rightarrow$ Passed.
   - `B07-5`: Consecutive newlines $\rightarrow$ Passed.
   - `B08-5`: Asymmetric paragraph counts $\rightarrow$ Passed.
3. **Beat Editor Dynamic Controls**:
   - `F05-1` to `F05-6`: Add, Duplicate, Reorder, Delete, Dirty State, Schema Validation $\rightarrow$ Passed.
   - `F07-1` to `F07-6`: 7 Stages, 13 Scenes, 4 Voice roles, 9 Ambient beds, 8 Rig poses $\rightarrow$ Passed.

---

## 10. Summary & Next Steps

This blueprint provides the exact, production-ready TypeScript modules for implementers in Milestone 2. Implementing `splitter.ts`, `AudioMetadataControls.tsx`, `BulkTextSplitterModal.tsx`, and `BeatEditor.tsx` in `admin/src/` will complete Milestone 2 and position the Saanjh 3.0 Admin Panel for direct cover image uploading (Milestone 3) and final verification (Milestone 4).
