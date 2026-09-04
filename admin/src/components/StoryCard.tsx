import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  BookOpen,
  Sparkles,
  Clock,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import type {
  Story,
  AgeBand,
  StoryCategory,
  StoryForm,
  StageKind,
  Beat,
} from '../types/story';
import { BeatEditor } from './BeatEditor';
import { StoryStageControl } from './AudioMetadataControls';
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
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
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

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDuplicate,
  onDelete,
  adminSecret,
  onNotify,
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
      className={`bg-white rounded-xl shadow-xs border transition-all duration-200 overflow-hidden ${
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
          story.isHidden
            ? 'bg-slate-100/90'
            : isExpanded
            ? 'bg-amber-50/50'
            : 'bg-slate-50 hover:bg-slate-100/60'
        }`}
      >
        {/* Left Side: Thumbnail & Title & ID */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Cover Thumbnail */}
          <div className="w-12 h-12 rounded-lg bg-slate-200 shrink-0 overflow-hidden border border-slate-300 flex items-center justify-center">
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
              <ImageIcon size={16} /> Cover Artwork & Streams
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

              {/* Row 2: Bilingual Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Story Title (English)
                  </label>
                  <input
                    type="text"
                    value={story.title?.en || ''}
                    onChange={(e) => handleLocalizedChange('title', 'en', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="The Clever Rabbit and the Tiger"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    कथा शीर्षक (Nepali Devanagari)
                  </label>
                  <input
                    type="text"
                    value={story.title?.ne || ''}
                    onChange={(e) => handleLocalizedChange('title', 'ne', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-sans focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="जङ्गी बाघ र चतुर खरायो"
                  />
                </div>
              </div>

              {/* Row 3: Bilingual Subtitles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Subtitle / Summary (English)
                  </label>
                  <input
                    type="text"
                    value={story.subtitle?.en || ''}
                    onChange={(e) => handleLocalizedChange('subtitle', 'en', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="A small rabbit. A loud tiger."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    उपशीर्षक (Nepali)
                  </label>
                  <input
                    type="text"
                    value={story.subtitle?.ne || ''}
                    onChange={(e) => handleLocalizedChange('subtitle', 'ne', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-sans focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="सानो खरायो। चर्को बाघ।"
                  />
                </div>
              </div>

              {/* Row 4: Bilingual Moral / Theme */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Theme / Moral Takeaway (English)
                  </label>
                  <input
                    type="text"
                    value={story.theme?.en || ''}
                    onChange={(e) => handleLocalizedChange('theme', 'en', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="Intelligence overcomes brute force."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    नैतिक सन्देश (Nepali)
                  </label>
                  <input
                    type="text"
                    value={story.theme?.ne || ''}
                    onChange={(e) => handleLocalizedChange('theme', 'ne', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-sans focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="बुद्धिले बललाई जित्छ।"
                  />
                </div>
              </div>

              {/* Row 5: Stage & Visual Theme Control */}
              <StoryStageControl
                stage={story.stage || 'forest'}
                cast={story.cast || 'rabbit'}
                onChangeStage={(stage: StageKind) => onUpdate({ stage })}
                onChangeCast={(cast: 'rabbit' | 'none') => onUpdate({ cast })}
              />

              {/* Row 6: Runtime, Accent, Lock, Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Runtime (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={runtime}
                    onChange={(e) =>
                      onUpdate({ runtimeMinutes: parseInt(e.target.value, 10) || 1 })
                    }
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

                <div className="flex items-center gap-4 pt-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer" title="Hide story from the main app">
                    <input
                      type="checkbox"
                      checked={!story.isHidden}
                      onChange={(e) => onUpdate({ isHidden: !e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Publish Live</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer" title="Lock the story completely">
                    <input
                      type="checkbox"
                      checked={Boolean(story.locked)}
                      onChange={(e) => onUpdate({ locked: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Legacy Lock</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer" title="Requires subscription to read fully">
                    <input
                      type="checkbox"
                      checked={Boolean(story.isPremium)}
                      onChange={(e) => onUpdate({ isPremium: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Is Premium</span>
                  </label>
                </div>
              </div>

              {/* Row 7: Freemium Settings */}
              {story.isPremium && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Lock size={18} />
                    <span className="text-sm font-bold">Premium Story Limits</span>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <label className="text-xs font-semibold text-purple-800">
                      Free Beats Allowed:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={story.freeBeatsCount ?? 0}
                      onChange={(e) => onUpdate({ freeBeatsCount: parseInt(e.target.value, 10) || 0 })}
                      className="w-24 border border-purple-200 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <span className="text-xs text-purple-600">
                      (Set to 0 to lock entirely. Currently {story.beats?.length || 0} total beats)
                    </span>
                  </div>
              </div>
            )}

          {/* TAB 2: BEATS & AUDIO */}
          {activeTab === 'beats' && (
            <BeatEditor
              beats={story.beats || []}
              onChange={handleBeatsChange}
              defaultStage={story.stage || 'forest'}
              storyCast={story.cast || 'rabbit'}
            />
          )}

          {/* TAB 3: COVER & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Standalone Direct Cover Image Uploader Component */}
              <ImageUploader
                currentUrl={story.coverImage}
                onUploadSuccess={(url) => {
                  onUpdate({ coverImage: url });
                  if (onNotify) {
                    onNotify('success', 'Cover image uploaded and updated successfully!');
                  }
                }}
                onUrlChange={(url) => onUpdate({ coverImage: url })}
                onRemove={() => onUpdate({ coverImage: '' })}
                adminSecret={adminSecret}
                onError={(err) => {
                  if (onNotify) {
                    onNotify('error', err);
                  }
                }}
              />

              {/* Streaming Media URLs */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Legacy / Streaming Media URLs (Optional)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Media Type
                    </label>
                    <select
                      value={story.mediaType || 'audio'}
                      onChange={(e) =>
                        onUpdate({ mediaType: e.target.value as 'video' | 'audio' | 'text' | 'youtube' })
                      }
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="audio">Audio Stream</option>
                      <option value="video">Video Stream</option>
                      <option value="youtube">YouTube Video</option>
                      <option value="text">Text Only</option>
                    </select>
                  </div>

                  {story.mediaType === 'youtube' ? (
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        YouTube Video ID
                      </label>
                      <input
                        type="text"
                        value={story.youtubeId || ''}
                        onChange={(e) => onUpdate({ youtubeId: e.target.value })}
                        placeholder="e.g. dQw4w9WgXcQ"
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono text-red-600"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          English Audio/Video URL
                        </label>
                        <input
                          type="url"
                          value={story.mediaUrl || ''}
                          onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
                          placeholder="https://cdn.example.com/story.mp3"
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono text-blue-700"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Nepali Audio/Video URL
                        </label>
                        <input
                          type="url"
                          value={story.mediaUrl_ne || ''}
                          onChange={(e) => onUpdate({ mediaUrl_ne: e.target.value })}
                          placeholder="https://cdn.example.com/story_ne.mp3"
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono text-amber-700"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryCard;
