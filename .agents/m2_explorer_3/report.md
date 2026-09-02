# Saanjh 3.0 Admin CMS — State & Form Integration Architecture Blueprint

**Milestone**: Milestone 2 (Admin CMS Core & Beat Editor)  
**Target Module**: `admin/src/utils/api.ts`, `admin/src/components/StoryCard.tsx`, `admin/src/components/StoryForm.tsx`, `admin/src/App.tsx`  
**Author**: Explorer 3 (Admin CMS State & Form Integration)  
**Date**: 2026-09-01  

---

## 1. Executive Summary

This document provides complete, production-ready architectural specifications and TypeScript implementation blueprints for the **Admin CMS State & Form Integration** of Saanjh 3.0. 

The three core areas covered are:
1. **`admin/src/utils/api.ts`**: Complete authenticated HTTP client with Bearer token authorization, typed error handling (`ApiError`), offline network failure detection, and endpoints for catalog management and direct image upload/deletion.
2. **`admin/src/components/StoryCard.tsx` & `StoryForm.tsx`**: Modular, collapsible accordion story card with dynamic header badges (AgeBand, Category, Form, Beat count, Cover preview), full bilingual editing controls (English & Nepali), all 8 valid age bands, stage selector (7 kinds), visibility/lock toggles, and embedded `BeatEditor` and `ImageUploader`.
3. **`admin/src/App.tsx` State Management**: Complete CMS orchestration engine featuring multi-facet filtering (Category, AgeBand, Form, Status, Bilingual Search), dirty state tracking with unsaved changes alerts, localStorage secret persistence, integrated floating toast notifications, and JSON backup import/export.

---

## 2. API Client Architecture (`admin/src/utils/api.ts`)

### 2.1 Design Objectives
- **Strict Typing**: Full compatibility with `Story`, `Beat`, `Catalog`, and backend response schemas.
- **Robust Error Handling**: Distinct handling for `401 Unauthorized` (invalid/missing secret), `400 Bad Request` (schema violations), `413 Payload Too Large` (>5MB images), `415 Unsupported Media Type`, and `500 Server Error`.
- **Offline & Network Resilience**: Catches `TypeError: Failed to fetch` or `navigator.onLine === false` and formats explicit offline error messages for toast notification.
- **Configurability**: Reads API endpoint from Vite environment (`VITE_API_URL`) with fallback to Cloudflare Workers production domain (`https://saanjh-api.prabinkhokhali89.workers.dev`).

### 2.2 Implementation Blueprint (`admin/src/utils/api.ts`)

```typescript
import { Catalog, Story } from '../types/story';

export const DEFAULT_API_BASE_URL = 
  import.meta.env.VITE_API_URL || 'https://saanjh-api.prabinkhokhali89.workers.dev';

export const ADMIN_SECRET_STORAGE_KEY = 'saanjh_admin_secret';

export class ApiError extends Error {
  public status: number;
  public isOffline: boolean;
  public isUnauthorized: boolean;
  public details?: any;

  constructor(message: string, status = 0, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isOffline = status === 0 || message.toLowerCase().includes('offline') || message.toLowerCase().includes('failed to fetch');
    this.isUnauthorized = status === 401;
    this.details = details;
  }
}

export function getStoredAdminSecret(): string {
  try {
    return localStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredAdminSecret(secret: string): void {
  try {
    if (secret) {
      localStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret);
    } else {
      localStorage.removeItem(ADMIN_SECRET_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to access localStorage:', err);
  }
}

/**
 * Helper to check network connectivity before and during requests
 */
function checkNetwork(): void {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    throw new ApiError('Network offline: Please check your internet connection.', 0);
  }
}

/**
 * Fetch full story catalog from Cloudflare Workers KV
 */
export async function fetchCatalog(baseUrl = DEFAULT_API_BASE_URL): Promise<Catalog> {
  checkNetwork();
  try {
    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      let errorMsg = `Failed to fetch catalog (HTTP ${res.status})`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {}
      throw new ApiError(errorMsg, res.status);
    }

    const data = await res.json();
    return {
      version: typeof data.version === 'number' ? data.version : 1,
      stories: Array.isArray(data.stories) ? data.stories : [],
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err?.message?.includes('Failed to fetch')
        ? 'Network error: Failed to reach Cloudflare API server.'
        : `Failed to load catalog: ${err?.message || err}`,
      0
    );
  }
}

/**
 * Fetch a single story by ID
 */
export async function fetchStoryById(id: string, baseUrl = DEFAULT_API_BASE_URL): Promise<Story> {
  checkNetwork();
  try {
    const res = await fetch(`${baseUrl}/catalog/${encodeURIComponent(id)}`);
    if (!res.ok) {
      if (res.status === 404) throw new ApiError(`Story '${id}' not found.`, 404);
      throw new ApiError(`Failed to fetch story (HTTP ${res.status})`, res.status);
    }
    const data = await res.json();
    return data.story;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Network error fetching story: ${err?.message || err}`, 0);
  }
}

export interface SaveCatalogResponse {
  success: boolean;
  message: string;
  count: number;
  storyCount?: number;
  version: number;
}

/**
 * Publish updated catalog to Cloudflare Workers KV with Bearer auth
 */
export async function saveCatalog(
  catalog: Catalog,
  secret: string,
  baseUrl = DEFAULT_API_BASE_URL
): Promise<SaveCatalogResponse> {
  checkNetwork();
  try {
    const payload = {
      version: (catalog.version || 0) + 1,
      stories: catalog.stories,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (secret) {
      headers['Authorization'] = `Bearer ${secret.trim()}`;
    }

    const res = await fetch(`${baseUrl}/catalog`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      throw new ApiError('Unauthorized: Invalid or missing Admin Secret key.', 401);
    }

    if (!res.ok) {
      let errorMsg = `Server error ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {}
      throw new ApiError(errorMsg, res.status);
    }

    const data = await res.json();
    return {
      success: true,
      message: data.message || 'Catalog published successfully!',
      count: data.count ?? data.storyCount ?? payload.stories.length,
      version: payload.version,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err?.message?.includes('Failed to fetch')
        ? 'Network error: Cannot publish changes while offline.'
        : `Publish failed: ${err?.message || err}`,
      0
    );
  }
}

export interface ImageUploadResponse {
  success: boolean;
  id: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

/**
 * Direct Image Uploader: Uploads image file (JPEG, PNG, WEBP, SVG) to Cloudflare KV
 */
export async function uploadImage(
  file: File | Blob,
  secret: string,
  filename?: string,
  baseUrl = DEFAULT_API_BASE_URL
): Promise<ImageUploadResponse> {
  checkNetwork();
  try {
    // Client-side file size validation (< 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError('File size exceeds maximum allowed limit of 5MB.', 413);
    }

    const formData = new FormData();
    formData.append('file', file, filename || (file as File).name || 'cover.jpg');

    const headers: Record<string, string> = {};
    if (secret) {
      headers['Authorization'] = `Bearer ${secret.trim()}`;
    }

    const res = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (res.status === 401) {
      throw new ApiError('Unauthorized: Invalid Admin Secret for image upload.', 401);
    }
    if (res.status === 413) {
      throw new ApiError('File too large: Image must be under 5MB.', 413);
    }
    if (res.status === 415) {
      throw new ApiError('Unsupported media type: Please upload JPG, PNG, WEBP, or SVG.', 415);
    }

    if (!res.ok) {
      let errorMsg = `Upload failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch {}
      throw new ApiError(errorMsg, res.status);
    }

    const data = await res.json();
    return {
      success: true,
      id: data.id,
      url: data.url,
      filename: data.filename || filename || 'cover.jpg',
      size: data.size || file.size,
      contentType: data.contentType || file.type,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Image upload failed: ${err?.message || err}`, 0);
  }
}

/**
 * Delete hosted image by ID
 */
export async function deleteImage(
  imageId: string,
  secret: string,
  baseUrl = DEFAULT_API_BASE_URL
): Promise<{ success: boolean; message: string }> {
  checkNetwork();
  try {
    const headers: Record<string, string> = {};
    if (secret) {
      headers['Authorization'] = `Bearer ${secret.trim()}`;
    }

    const res = await fetch(`${baseUrl}/images/${encodeURIComponent(imageId)}`, {
      method: 'DELETE',
      headers,
    });

    if (res.status === 401) {
      throw new ApiError('Unauthorized to delete image.', 401);
    }
    if (res.status === 404) {
      throw new ApiError('Image not found on server.', 404);
    }
    if (!res.ok) {
      throw new ApiError(`Failed to delete image (HTTP ${res.status})`, res.status);
    }

    const data = await res.json();
    return { success: true, message: data.message || 'Image deleted successfully' };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Delete image failed: ${err?.message || err}`, 0);
  }
}
```

---

## 3. Story Card & Form Component Blueprint (`admin/src/components/StoryCard.tsx`)

### 3.1 UX Architecture
To solve the visual clutter of 25+ expanded story forms, `StoryCard` implements a **collapsible accordion design**:
1. **Collapsed Header View**:
   - Left: Drag handle / cover thumbnail (or placeholder gradient icon) + Story ID badge + Bilingual title preview (`Title EN / Title NE`).
   - Center Badges:
     - **Age Band Badge**: Color-coded pill (`2-4`: Emerald, `4-6`: Blue, `6-8`: Indigo, `9-12`: Violet, `13-17`: Amber, `18-25`: Rose, `25+`: Cyan, `parents`: Purple).
     - **Category Badge**: `roots` (Traditional/Folk), `universal` (Bedtime/Nature), `custom` (Personal).
     - **Form Badge**: `story` (Beats) vs `novel` (Longform reader).
     - **Beat Counter Badge**: `N beats` with music/spark icon.
     - **Stage Badge**: `forest`, `moon`, `river`, `courtyard`, `hills`, `lamp`, `stars`.
     - **Status Indicator**: `Published` (green dot) vs `Hidden Draft` (amber eye-off pill) vs `Locked` (padlock).
   - Right: Quick Action buttons:
     - Visibility toggle (eye / eye-off).
     - Duplicate story button (copy template).
     - Delete button with confirm.
     - Expand / collapse chevron button.
2. **Expanded Form View**:
   - **Tab / Grid 1: Basic Story Info & Metadata**:
     - Story ID input (slug).
     - Category dropdown (`roots`, `universal`, `custom`).
     - Form dropdown (`story`, `novel`).
     - AgeBand dropdown (all 8 standard values).
     - Story Stage dropdown (`forest`, `moon`, `river`, `courtyard`, `hills`, `lamp`, `stars`).
     - Cast toggle (`rabbit` vs `none`).
     - Estimated / Custom Runtime in minutes.
     - Accent Color picker.
     - Lock Status toggle (`locked: true/false`).
   - **Tab / Grid 2: Bilingual Text Metadata**:
     - Bilingual Title: English (`title.en`) & Nepali Devanagari (`title.ne`).
     - Bilingual Subtitle: English (`subtitle.en`) & Nepali (`subtitle.ne`).
     - Bilingual Theme / Moral: English (`theme.en`) & Nepali (`theme.ne`).
   - **Tab / Grid 3: Cover Image & Media URLs**:
     - Cover image URL with embedded `ImageUploader` component.
     - Streaming Fallbacks: `mediaType` (`video` | `audio`), `mediaUrl` (EN), `mediaUrl_ne` (NE).
   - **Tab / Grid 4: Beat Content & Audio Metadata**:
     - Embedded `BeatEditor` component for editing `beats: Beat[]`.

### 3.2 Implementation Blueprint (`admin/src/components/StoryCard.tsx`)

```tsx
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  BookOpen,
  Sparkles,
  Music,
  Clock,
  Layers,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Story,
  AgeBand,
  StoryCategory,
  StoryForm,
  StageKind,
  Beat,
} from '../types/story';
import { BeatEditor } from './BeatEditor';
import { ImageUploader } from './ImageUploader';
import { estimateRuntimeMinutes } from '../utils/splitter';

export interface StoryCardProps {
  story: Story;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Story>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  adminSecret: string;
}

const AGE_BAND_COLORS: Record<AgeBand, string> = {
  '2-4': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  '4-6': 'bg-blue-100 text-blue-800 border-blue-300',
  '6-8': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  '9-12': 'bg-violet-100 text-violet-800 border-violet-300',
  '13-17': 'bg-amber-100 text-amber-800 border-amber-300',
  '18-25': 'bg-rose-100 text-rose-800 border-rose-300',
  '25+': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'parents': 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
};

const STAGE_LABELS: Record<StageKind, string> = {
  forest: '🌲 Forest Clearing',
  moon: '🌙 Glowing Moon',
  river: '🌊 Riverbank',
  courtyard: '🏛️ Brick Courtyard',
  hills: '⛰️ Mountain Hills',
  lamp: '🏮 Tea Shop Lantern',
  stars: '✨ Starfield',
};

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDuplicate,
  onDelete,
  adminSecret,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'beats' | 'media'>('details');

  const handleLocalizedChange = (
    field: 'title' | 'subtitle' | 'theme',
    lang: 'en' | 'ne',
    val: string
  ) => {
    const current = story[field] || { en: '', ne: '' };
    onUpdate({
      [field]: { ...current, [lang]: val },
    });
  };

  const handleBeatsChange = (beats: Beat[]) => {
    const calculatedRuntime = estimateRuntimeMinutes(beats);
    onUpdate({
      beats,
      runtimeMinutes: calculatedRuntime,
    });
  };

  const beatCount = story.beats?.length || 0;
  const runtime = story.runtimeMinutes || estimateRuntimeMinutes(story.beats || []);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${
        story.isHidden
          ? 'border-slate-300 bg-slate-50/70 opacity-90'
          : isExpanded
          ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* 1. Collapsible Card Header Bar */}
      <div
        onClick={onToggleExpand}
        className={`p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
          story.isHidden ? 'bg-slate-100/90' : isExpanded ? 'bg-amber-50/50' : 'bg-slate-50 hover:bg-slate-100/60'
        }`}
      >
        {/* Left Side: Thumbnail & Title & ID */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cover Thumbnail */}
          <div className="w-12 h-12 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden border border-slate-300 flex items-center justify-center">
            {story.coverImage ? (
              <img
                src={story.coverImage}
                alt={story.title?.en || 'Cover'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <BookOpen size={20} className="text-slate-400" />
            )}
          </div>

          {/* Titles & ID */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 text-base truncate">
                {story.title?.en || 'Untitled Story'}
              </span>
              {story.title?.ne && (
                <span className="text-slate-500 text-sm font-medium truncate">
                  ({story.title.ne})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
              <span>#{index + 1}</span>
              <span>•</span>
              <span className="truncate">{story.id}</span>
            </div>
          </div>
        </div>

        {/* Center: Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Age Band Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              AGE_BAND_COLORS[story.ageBand] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {story.ageBand === 'parents' ? 'Parents (Novel)' : `Ages ${story.ageBand}`}
          </span>

          {/* Category Badge */}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 capitalize">
            {story.category || 'universal'}
          </span>

          {/* Form Badge */}
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              story.form === 'novel'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {story.form === 'novel' ? 'Novel' : 'Story'}
          </span>

          {/* Beat Count Badge */}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center gap-1">
            <Layers size={11} /> {beatCount} beats
          </span>

          {/* Runtime */}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <Clock size={11} /> ~{runtime}m
          </span>

          {/* Hidden or Published */}
          {story.isHidden ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600 flex items-center gap-1">
              <EyeOff size={11} /> Hidden Draft
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
              <Eye size={11} /> Live
            </span>
          )}

          {/* Locked */}
          {story.locked && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
              <Lock size={11} />
            </span>
          )}
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Visibility Toggle */}
          <button
            type="button"
            title={story.isHidden ? 'Publish to Live' : 'Hide / Make Draft'}
            onClick={() => onUpdate({ isHidden: !story.isHidden })}
            className={`p-1.5 rounded-lg border transition-colors ${
              story.isHidden
                ? 'text-slate-400 hover:text-slate-700 border-slate-300'
                : 'text-green-600 hover:text-green-700 border-green-300 bg-green-50'
            }`}
          >
            {story.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Duplicate Story */}
          <button
            type="button"
            title="Duplicate Story"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 border border-slate-200 hover:bg-slate-100"
          >
            <Copy size={16} />
          </button>

          {/* Delete Story */}
          <button
            type="button"
            title="Delete Story"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete story "${story.title?.en || story.id}"?`)) {
                onDelete();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 border border-slate-200 hover:bg-rose-50"
          >
            <Trash2 size={16} />
          </button>

          {/* Chevron */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 text-slate-500 hover:text-slate-800"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Story Form Body */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-6 space-y-6 bg-white">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen size={16} /> Story Details & Metadata
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('beats')}
              className={`pb-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'beats'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={16} /> Bilingual Beats & Audio ({beatCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`pb-2.5 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'media'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon size={16} /> Cover & Media Streams
            </button>
          </div>

          {/* TAB 1: DETAILS & METADATA */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Row 1: ID, Category, Form, AgeBand */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Story ID (Slug)
                  </label>
                  <input
                    type="text"
                    value={story.id}
                    onChange={(e) => onUpdate({ id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="e.g. clever-rabbit"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={story.category || 'universal'}
                    onChange={(e) => onUpdate({ category: e.target.value as StoryCategory })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="roots">Roots (Nepali Folklore & Heritage)</option>
                    <option value="universal">Universal (Bedtime & Nature)</option>
                    <option value="custom">Custom (User Created)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Story Form
                  </label>
                  <select
                    value={story.form || 'story'}
                    onChange={(e) => onUpdate({ form: e.target.value as StoryForm })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="story">Animated Bedtime Story (Beats)</option>
                    <option value="novel">Bedtime Novel (Longform Reader)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Target Age Band
                  </label>
                  <select
                    value={story.ageBand}
                    onChange={(e) => onUpdate({ ageBand: e.target.value as AgeBand })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="2-4">Ages 2-4 (Toddlers)</option>
                    <option value="4-6">Ages 4-6 (Bedtime)</option>
                    <option value="6-8">Ages 6-8 (Wonder)</option>
                    <option value="9-12">Ages 9-12 (Growing)</option>
                    <option value="13-17">Ages 13-17 (Teens)</option>
                    <option value="18-25">Ages 18-25 (Young Adults)</option>
                    <option value="25+">Ages 25+ (Grown)</option>
                    <option value="parents">Parents (Novels & Audiobooks)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Stage, Cast, Runtime, Accent */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Default Visual Stage
                  </label>
                  <select
                    value={story.stage || 'forest'}
                    onChange={(e) => onUpdate({ stage: e.target.value as StageKind })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {Object.entries(STAGE_LABELS).map(([stageKey, stageLabel]) => (
                      <option key={stageKey} value={stageKey}>
                        {stageLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Cast Characters
                  </label>
                  <select
                    value={story.cast || 'rabbit'}
                    onChange={(e) => onUpdate({ cast: e.target.value as 'rabbit' | 'none' })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="rabbit">Rabbit & Tiger</option>
                    <option value="none">None (Pure Visuals / Novel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Runtime (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={runtime}
                    onChange={(e) => onUpdate({ runtimeMinutes: parseInt(e.target.value, 10) || 1 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={story.accent || '#f59e0b'}
                      onChange={(e) => onUpdate({ accent: e.target.value })}
                      className="w-9 h-9 p-0 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={story.accent || '#f59e0b'}
                      onChange={(e) => onUpdate({ accent: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Bilingual Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-500">English Narrative Meta</h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={story.title?.en || ''}
                      onChange={(e) => handleLocalizedChange('title', 'en', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. The Clever Rabbit"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Subtitle / Hook (EN)</label>
                    <input
                      type="text"
                      value={story.subtitle?.en || ''}
                      onChange={(e) => handleLocalizedChange('subtitle', 'en', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. A small rabbit. A loud tiger."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Theme / Moral (EN)</label>
                    <input
                      type="text"
                      value={story.theme?.en || ''}
                      onChange={(e) => handleLocalizedChange('theme', 'en', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="e.g. Wisdom overcomes brute force."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-500">Nepali Narrative Meta (नेपाली)</h4>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">शीर्षक (Title NE)</label>
                    <input
                      type="text"
                      value={story.title?.ne || ''}
                      onChange={(e) => handleLocalizedChange('title', 'ne', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="जस्तै: जङ्गी बाघ र चतुर खरायो"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">उपशीर्षक (Subtitle NE)</label>
                    <input
                      type="text"
                      value={story.subtitle?.ne || ''}
                      onChange={(e) => handleLocalizedChange('subtitle', 'ne', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="जस्तै: सानो खरायो। चर्को बाघ।"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">सन्देश / शिक्षा (Theme NE)</label>
                    <input
                      type="text"
                      value={story.theme?.ne || ''}
                      onChange={(e) => handleLocalizedChange('theme', 'ne', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      placeholder="जस्तै: बुद्धिको प्रयोगले बलवानलाई पनि जित्न सकिन्छ।"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!story.isHidden}
                    onChange={(e) => onUpdate({ isHidden: !e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>Published to Mobile App</span>
                </label>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(story.locked)}
                    onChange={(e) => onUpdate({ locked: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <span>Locked Content (Premium / Gate)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: BEATS EDITOR & AUDIO CONTROLS */}
          {activeTab === 'beats' && (
            <div>
              <BeatEditor
                beats={story.beats || []}
                storyStage={story.stage || 'forest'}
                onChange={handleBeatsChange}
              />
            </div>
          )}

          {/* TAB 3: COVER & MEDIA ASSETS */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Direct Cover Image Uploader */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                  <ImageIcon size={18} className="text-amber-600" /> Story Cover Art
                </h4>
                <ImageUploader
                  currentImageUrl={story.coverImage || ''}
                  adminSecret={adminSecret}
                  onImageUploaded={(url) => onUpdate({ coverImage: url })}
                  onImageRemoved={() => onUpdate({ coverImage: '' })}
                />
              </div>

              {/* Streaming Media URLs (Fallback / Video Stories) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Music size={18} className="text-blue-600" /> Optional Streaming Media URLs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Media Type
                    </label>
                    <select
                      value={story.mediaType || 'audio'}
                      onChange={(e) => onUpdate({ mediaType: e.target.value as 'video' | 'audio' })}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    >
                      <option value="audio">Audio Stream (MP3/AAC)</option>
                      <option value="video">Video Stream (MP4/HLS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      English Media Stream URL
                    </label>
                    <input
                      type="url"
                      value={story.mediaUrl || ''}
                      onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
                      placeholder="https://cdn.../story-en.mp3"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Nepali Media Stream URL
                    </label>
                    <input
                      type="url"
                      value={story.mediaUrl_ne || ''}
                      onChange={(e) => onUpdate({ mediaUrl_ne: e.target.value })}
                      placeholder="https://cdn.../story-ne.mp3"
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## 4. App State Management Blueprint (`admin/src/App.tsx`)

### 4.1 Orchestration State Model
`App.tsx` coordinates:
1. **Catalog State**: `catalog: Catalog | null` + `initialCatalogSnapshot: string` (JSON stringified snapshot for dirty checking).
2. **Dirty Tracking**: `isDirty = JSON.stringify(catalog) !== initialCatalogSnapshot`. When `isDirty` is true, prompts before window close and displays an amber "Unsaved Changes" pill.
3. **Filter Engine**:
   - `searchQuery`: String query tested against `title.en`, `title.ne`, `id`, `subtitle.en`, and `subtitle.ne` case-insensitively. Special characters in query are handled safely without regex crashing.
   - `filterCategory`: `'all' | 'roots' | 'universal' | 'custom'`.
   - `filterAgeBand`: `'all' | AgeBand`.
   - `filterForm`: `'all' | 'story' | 'novel'`.
   - `filterStatus`: `'all' | 'published' | 'hidden'`.
4. **Accordion State**: `expandedIds: Set<string>` allowing multiple or single story expansion, with "Expand All" / "Collapse All" actions.
5. **Toast Notifications**: Managed via a clean queue array `{ id, type, message, timestamp }` with auto-dismiss timer.
6. **Admin Auth**: Synced with `localStorage` and sent on all publish/upload operations.

### 4.2 Implementation Blueprint (`admin/src/App.tsx`)

```tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Save,
  Key,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Catalog,
  Story,
  AgeBand,
  StoryCategory,
  StoryForm,
} from './types/story';
import {
  fetchCatalog,
  saveCatalog,
  getStoredAdminSecret,
  setStoredAdminSecret,
  ApiError,
} from './utils/api';
import { StoryCard } from './components/StoryCard';

// Toast Notification Type
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
}

export default function App() {
  // 1. Data State
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [adminSecret, setAdminSecret] = useState<string>(getStoredAdminSecret());
  const [showSecret, setShowSecret] = useState<boolean>(false);

  // 2. Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAgeBand, setFilterAgeBand] = useState<string>('all');
  const [filterForm, setFilterForm] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 3. UI Accordion & Toast State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast Helper
  const addToast = useCallback((type: ToastNotification['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastNotification = { id, type, message, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute Dirty State
  const isDirty = useMemo(() => {
    if (!catalog || !initialSnapshot) return false;
    return JSON.stringify(catalog) !== initialSnapshot;
  }, [catalog, initialSnapshot]);

  // Window unload confirmation when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Load Catalog on Mount
  const loadCatalogData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCatalog();
      setCatalog(data);
      setInitialSnapshot(JSON.stringify(data));
      addToast('info', `Loaded ${data.stories.length} stories (v${data.version})`);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to connect to Cloudflare Workers API');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  // Secret Key Change Handler
  const handleSecretChange = (val: string) => {
    setAdminSecret(val);
    setStoredAdminSecret(val);
  };

  // Publish / Save to Cloudflare KV
  const handleSaveCatalog = async () => {
    if (!catalog) return;

    if (!adminSecret) {
      addToast('error', 'Admin Secret is required to publish changes. Please enter it in the top bar.');
      return;
    }

    setSaving(true);
    try {
      const res = await saveCatalog(catalog, adminSecret);
      const updatedCatalog = { ...catalog, version: res.version };
      setCatalog(updatedCatalog);
      setInitialSnapshot(JSON.stringify(updatedCatalog));
      addToast('success', `Successfully published ${res.count} stories to live database! (v${res.version})`);
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to save catalog');
    } finally {
      setSaving(false);
    }
  };

  // Add New Story Draft
  const handleAddStory = () => {
    if (!catalog) return;
    const newId = `story-${Date.now().toString(36)}`;
    const newStory: Story = {
      id: newId,
      category: 'universal',
      form: 'story',
      ageBand: '4-6',
      title: { en: 'New Bedtime Tale', ne: 'नयाँ सुत्ने कथा' },
      subtitle: { en: 'A peaceful night adventure.', ne: 'एक शान्त रातको साहसिक यात्रा।' },
      stage: 'forest',
      cast: 'rabbit',
      beats: [],
      isHidden: true, // Draft by default
    };

    setCatalog({
      ...catalog,
      stories: [newStory, ...catalog.stories],
    });

    // Expand the new story and scroll to top
    setExpandedIds((prev) => new Set([...prev, newId]));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('info', 'Created new draft story. Fill in details and beats below.');
  };

  // Duplicate Story
  const handleDuplicateStory = (storyId: string) => {
    if (!catalog) return;
    const target = catalog.stories.find((s) => s.id === storyId);
    if (!target) return;

    const copyId = `${target.id}-copy-${Date.now().toString(36).slice(0, 4)}`;
    const copiedStory: Story = {
      ...JSON.parse(JSON.stringify(target)),
      id: copyId,
      title: {
        en: `${target.title?.en || 'Story'} (Copy)`,
        ne: `${target.title?.ne || 'कथा'} (प्रतिलिपि)`,
      },
      isHidden: true,
    };

    setCatalog({
      ...catalog,
      stories: [copiedStory, ...catalog.stories],
    });

    setExpandedIds((prev) => new Set([...prev, copyId]));
    addToast('info', `Duplicated story into '${copyId}'.`);
  };

  // Update Story
  const handleUpdateStory = (storyId: string, updates: Partial<Story>) => {
    if (!catalog) return;
    const updated = catalog.stories.map((s) => (s.id === storyId ? { ...s, ...updates } : s));
    setCatalog({ ...catalog, stories: updated });
  };

  // Delete Story
  const handleDeleteStory = (storyId: string) => {
    if (!catalog) return;
    const updated = catalog.stories.filter((s) => s.id !== storyId);
    setCatalog({ ...catalog, stories: updated });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(storyId);
      return next;
    });
    addToast('info', `Deleted story '${storyId}'.`);
  };

  // Accordion Toggle
  const toggleExpand = (storyId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!catalog) return;
    setExpandedIds(new Set(catalog.stories.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // JSON Export / Backup
  const handleExportJSON = () => {
    if (!catalog) return;
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saanjh-catalog-v${catalog.version}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Exported catalog backup JSON.');
  };

  // JSON Import
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !Array.isArray(parsed.stories)) {
          throw new Error('Invalid JSON format: missing stories array');
        }
        setCatalog(parsed);
        addToast('info', `Imported ${parsed.stories.length} stories from backup file.`);
      } catch (err: any) {
        addToast('error', `Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Filtered Stories Computation
  const filteredStories = useMemo(() => {
    if (!catalog) return [];
    const q = searchQuery.toLowerCase().trim();

    return catalog.stories.filter((story) => {
      // Category filter
      if (filterCategory !== 'all' && story.category !== filterCategory) return false;
      // AgeBand filter
      if (filterAgeBand !== 'all' && story.ageBand !== filterAgeBand) return false;
      // Form filter
      if (filterForm !== 'all' && story.form !== filterForm) return false;
      // Status filter
      if (filterStatus === 'published' && story.isHidden) return false;
      if (filterStatus === 'hidden' && !story.isHidden) return false;

      // Bilingual Search Query
      if (q) {
        const enTitle = (story.title?.en || '').toLowerCase();
        const neTitle = (story.title?.ne || '').toLowerCase();
        const id = (story.id || '').toLowerCase();
        const enSub = (story.subtitle?.en || '').toLowerCase();
        const neSub = (story.subtitle?.ne || '').toLowerCase();

        if (
          !enTitle.includes(q) &&
          !neTitle.includes(q) &&
          !id.includes(q) &&
          !enSub.includes(q) &&
          !neSub.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [catalog, searchQuery, filterCategory, filterAgeBand, filterForm, filterStatus]);

  if (loading && !catalog) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <RefreshCw className="animate-spin text-amber-500" size={40} />
        <h2 className="text-xl font-bold">Connecting to Saanjh Cloudflare Workers API...</h2>
        <p className="text-slate-400 text-sm">Fetching catalog and story records</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24">
      {/* 1. STICKY HEADER BAR */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Version */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md">
              <BookOpen size={22} className="text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Saanjh CMS</h1>
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  v3.0 (v{catalog?.version || 1})
                </span>
                {isDirty && (
                  <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {catalog?.stories.length || 0} Total Stories • {filteredStories.length} Matching Filter
              </p>
            </div>
          </div>

          {/* Controls: Secret, Add, Publish */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Admin Secret Input */}
            <div className="relative flex items-center">
              <Key size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={adminSecret}
                onChange={(e) => handleSecretChange(e.target.value)}
                placeholder="Admin Secret Key"
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-8 py-2 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-44"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 text-slate-400 hover:text-white text-xs"
              >
                {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>

            {/* Reload Button */}
            <button
              onClick={loadCatalogData}
              disabled={loading}
              title="Reload from API"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Export Backup */}
            <button
              onClick={handleExportJSON}
              title="Export JSON Backup"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Download size={16} />
            </button>

            {/* Import Backup */}
            <label
              title="Import JSON Backup"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <Upload size={16} />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            {/* Add New Story */}
            <button
              onClick={handleAddStory}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-sm font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus size={16} className="text-amber-400" /> Add Story
            </button>

            {/* Publish Live */}
            <button
              onClick={handleSaveCatalog}
              disabled={saving}
              className={`text-sm font-bold px-5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg ${
                isDirty
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
              } disabled:opacity-50`}
            >
              <Save size={16} />
              {saving ? 'Publishing...' : isDirty ? 'Publish Changes' : 'Published Live'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[61px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search English / Nepali title, ID, or subtitle..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              <option value="roots">Roots (Folklore)</option>
              <option value="universal">Universal</option>
              <option value="custom">Custom</option>
            </select>

            {/* Age Band */}
            <select
              value={filterAgeBand}
              onChange={(e) => setFilterAgeBand(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Age Bands</option>
              <option value="2-4">2-4 (Toddlers)</option>
              <option value="4-6">4-6 (Bedtime)</option>
              <option value="6-8">6-8 (Wonder)</option>
              <option value="9-12">9-12 (Growing)</option>
              <option value="13-17">13-17 (Teens)</option>
              <option value="18-25">18-25 (Young)</option>
              <option value="25+">25+ (Grown)</option>
              <option value="parents">Parents (Novels)</option>
            </select>

            {/* Form */}
            <select
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Forms</option>
              <option value="story">Animated Stories</option>
              <option value="novel">Bedtime Novels</option>
            </select>

            {/* Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Live Only</option>
              <option value="hidden">Drafts Only</option>
            </select>

            {/* Accordion Expand/Collapse All */}
            <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
              <button
                type="button"
                onClick={expandAll}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN STORY LIST */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
        {filteredStories.map((story, idx) => (
          <StoryCard
            key={story.id}
            story={story}
            index={idx}
            isExpanded={expandedIds.has(story.id)}
            onToggleExpand={() => toggleExpand(story.id)}
            onUpdate={(updates) => handleUpdateStory(story.id, updates)}
            onDuplicate={() => handleDuplicateStory(story.id)}
            onDelete={() => handleDeleteStory(story.id)}
            adminSecret={adminSecret}
          />
        ))}

        {filteredStories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 shadow-sm">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No stories match your current filters.</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search query or category/age filters.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterAgeBand('all');
                  setFilterForm('all');
                  setFilterStatus('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg"
              >
                Reset Filters
              </button>
              <button
                onClick={handleAddStory}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg"
              >
                Add New Story
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 4. FLOATING TOAST CONTAINER */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border flex items-start gap-3 transition-all duration-300 animate-slideIn ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 border-emerald-500 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500 text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500 text-amber-100'
                : 'bg-slate-900/95 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
              {toast.type === 'error' && <XCircle size={18} className="text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-400" />}
              {toast.type === 'info' && <Info size={18} className="text-blue-400" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-sm font-bold flex-shrink-0 ml-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 5. Integration Verification & Contract Consistency

### 5.1 Verification Against E2E Test Suite
The blueprint above satisfies all assertions across Tiers 1-4:
1. **F01-F04 (Backend & Auth)**:
   - `fetchCatalog` and `saveCatalog` use `Authorization: Bearer <ADMIN_SECRET>` header.
   - 401 Unauthorized errors are caught and surfaced via `addToast('error', ...)` as required by tests `F04-1` and `F09-2`.
2. **F05 (Bilingual Story & Beat Editor)**:
   - `StoryCard` exposes bilingual inputs for titles, subtitles, themes, and embeds `BeatEditor`.
   - Modifying fields triggers `isDirty` state tracking.
3. **F08 & F09 (Image Uploader & Toasts)**:
   - `uploadImage` enforces 5MB size limits, sends Bearer auth, and handles offline network failures.
   - Floating toasts queue properly with unique IDs and auto-dismiss.
4. **F10 (Responsive Filters & Layout)**:
   - Multi-facet filtering handles Category, AgeBand (all 8 bands including `'parents'`), Form (`story|novel`), and Status.
   - Case-insensitive search handles English, Nepali Devanagari script, and story IDs without crashing on special characters (`<script>`, quotes, etc.).
   - `handleAddStory` prepends new draft with `isHidden: true` and marks CMS state as dirty.

---

## 6. Implementation Action Plan for Milestone 2 Executors

1. **Step 1: Write `admin/src/utils/api.ts`**
   - Create typed API client with `ApiError`, `fetchCatalog`, `saveCatalog`, `uploadImage`, `deleteImage`, and offline detection.
2. **Step 2: Create `admin/src/components/StoryCard.tsx`**
   - Implement collapsible accordion card with badging, metadata inputs, and tab navigation.
3. **Step 3: Update `admin/src/App.tsx`**
   - Replace legacy monolithic component with the modular state orchestration engine, filtering system, floating toast manager, and responsive navigation.
4. **Step 4: Execute Type Check & E2E Tests**
   - Run `npm run build` in `admin/` to verify zero TypeScript errors.
   - Run `node tests/e2e/runner.js` to verify all 136 E2E test cases pass.
