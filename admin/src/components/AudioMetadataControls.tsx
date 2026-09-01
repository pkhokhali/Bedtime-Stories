import { useMemo } from 'react';
import {
  Volume2,
  Moon,
  Mic,
  Layers,
  Zap,
} from 'lucide-react';
import type {
  StageKind,
  SceneId,
  VoiceRole,
  SoundId,
  Pose,
  Beat,
} from '../types/story';
import {
  STAGE_KINDS,
  SCENE_IDS,
  VOICE_ROLES,
  POSES,
  STAGE_METADATA,
  SCENE_METADATA,
  VOICE_ROLE_METADATA,
  SOUND_METADATA,
  POSE_METADATA,
  resolveAmbientBedDetailed,
} from '../types/story';

// ============================================================================
// 1. UI SELECTOR OPTIONS & LABELS
// ============================================================================

export const STAGE_OPTIONS: Array<{ value: StageKind; label: string; icon: string }> = [
  { value: 'forest', label: '🌲 Forest (Deep Woods & Hill)', icon: '🌲' },
  { value: 'moon', label: '🌕 Moon (Ethereal Night Sky)', icon: '🌕' },
  { value: 'river', label: '🌊 River (Mountain Stream)', icon: '🌊' },
  { value: 'courtyard', label: '🏛️ Courtyard (Historic Brick Square)', icon: '🏛️' },
  { value: 'hills', label: '⛰️ Hills (Himalayan Wind Ridge)', icon: '⛰️' },
  { value: 'lamp', label: '🏮 Lamp (Warm Tea Shop Lantern)', icon: '🏮' },
  { value: 'stars', label: '✨ Stars (Deep Cosmic Canopy)', icon: '✨' },
];

export const SCENE_OPTIONS: Array<{ value: SceneId; label: string; icon: string }> = [
  { value: 'establishing', label: '🌌 Establishing (Night Intro)', icon: '🌌' },
  { value: 'meeting', label: '🤝 Meeting Characters', icon: '🤝' },
  { value: 'walk', label: '🚶 Gentle Walk / Journey', icon: '🚶' },
  { value: 'roar', label: '⚡ Dramatic Moment / Roar', icon: '⚡' },
  { value: 'well', label: '🪨 Ancient Stone Well', icon: '🪨' },
  { value: 'leap', label: '🌊 Dramatic Leap / Well Dive', icon: '🌊' },
  { value: 'peace', label: '🕊️ Peaceful Resolution', icon: '🕊️' },
  { value: 'moon', label: '🌕 Glowing Moon Sky', icon: '🌕' },
  { value: 'river', label: '🌊 Mountain Riverbank', icon: '🌊' },
  { value: 'courtyard', label: '🏛️ Ancient City Courtyard', icon: '🏛️' },
  { value: 'hills', label: '⛰️ Himalayan Mountain Ridge', icon: '⛰️' },
  { value: 'lamp', label: '🏮 Warm Tea Shop Lantern', icon: '🏮' },
  { value: 'stars', label: '✨ Starry Sky Contemplation', icon: '✨' },
];

export const VOICE_OPTIONS: Array<{
  value: VoiceRole;
  label: string;
  badge: string;
  color: string;
}> = [
  {
    value: 'narrator',
    label: '🎙️ Narrator (Balanced Storyteller)',
    badge: '🎙️ Narrator',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    value: 'soft',
    label: '🤫 Soft (Whispered / Bedtime)',
    badge: '🤫 Soft',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    value: 'rabbit',
    label: '🐰 Rabbit (Bright & Lively)',
    badge: '🐰 Rabbit',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    value: 'tiger',
    label: '🐯 Tiger (Deep & Resonant)',
    badge: '🐯 Tiger',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
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
  { value: '', label: '🚫 None (No Sound Effect)' },
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

// ============================================================================
// 2. STORY-LEVEL STAGE & VISUAL THEME CONTROL
// ============================================================================

export interface StoryStageControlProps {
  stage?: StageKind;
  cast?: 'rabbit' | 'none';
  onChangeStage: (stage: StageKind) => void;
  onChangeCast?: (cast: 'rabbit' | 'none') => void;
  disabled?: boolean;
  className?: string;
}

export const StoryStageControl: React.FC<StoryStageControlProps> = ({
  stage = 'forest',
  cast = 'rabbit',
  onChangeStage,
  onChangeCast,
  disabled = false,
  className = '',
}) => {
  const currentStageMeta = STAGE_METADATA[stage] || STAGE_METADATA.forest;

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Layers size={16} className="text-amber-600" />
          <span>Story Stage & Visual Theme</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">Sky Gradient:</span>
          <div
            className="w-16 h-4 rounded border border-slate-300 shadow-inner"
            style={{
              background: `linear-gradient(to right, ${currentStageMeta.colors[0]}, ${currentStageMeta.colors[1]}, ${currentStageMeta.colors[2]})`,
            }}
            title={`Stage Gradient: ${currentStageMeta.colors.join(' → ')}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stage Kind Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Default Stage Background
          </label>
          <select
            value={stage}
            onChange={(e) => onChangeStage(e.target.value as StageKind)}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
          >
            {STAGE_KINDS.map((sk) => {
              const meta = STAGE_METADATA[sk];
              return (
                <option key={sk} value={sk}>
                  {meta.label} (Default Bed: {meta.defaultBed})
                </option>
              );
            })}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {currentStageMeta.description}
          </p>
        </div>

        {/* Character Cast Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Character Rig Animation Cast
          </label>
          {onChangeCast ? (
            <select
              value={cast}
              onChange={(e) => onChangeCast(e.target.value as 'rabbit' | 'none')}
              disabled={disabled}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:opacity-60"
            >
              <option value="rabbit">🐇 Enable Rabbit & Tiger SVG Rigs</option>
              <option value="none">🚫 No Character Rigs (Atmospheric / Novel)</option>
            </select>
          ) : (
            <div className="text-sm font-medium text-slate-700 py-2">
              {cast === 'rabbit' ? '🐇 Rabbit & Tiger Rigs Active' : '🚫 No Rigs'}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Enables procedural SVG character poses during narration.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. 4-TIER AMBIENT SOUND BED CASCADE PREVIEW BADGE
// ============================================================================

export interface AmbientBedPreviewProps {
  music?: SoundId;
  scene?: SceneId;
  stage?: StageKind;
  compact?: boolean;
  className?: string;
}

export const AmbientBedPreview: React.FC<AmbientBedPreviewProps> = ({
  music,
  scene,
  stage = 'forest',
  compact = false,
  className = '',
}) => {
  const resolution = useMemo(
    () => resolveAmbientBedDetailed(music, scene, stage),
    [music, scene, stage]
  );

  const badgeColor = useMemo(() => {
    switch (resolution.source) {
      case 'explicit':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scene':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'stage':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'fallback':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }, [resolution.source]);

  const soundMeta = SOUND_METADATA[resolution.bed] || SOUND_METADATA.night;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} ${className}`}
        title={`${resolution.sourceDescription} (${soundMeta.description})`}
      >
        <Volume2 size={12} />
        <span>
          Bed: <strong>{soundMeta.label}</strong>
        </span>
        <span className="text-[10px] opacity-75 font-normal">
          ({resolution.sourceLabel})
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${badgeColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Active Bedtime Sound Bed: </span>
            <span className="font-bold underline">{soundMeta.label}</span>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/80 shadow-xs border border-current">
          {resolution.sourceLabel}
        </span>
      </div>
      <p className="text-[11px] mt-1.5 opacity-90 leading-relaxed">
        {resolution.sourceDescription} {soundMeta.description}.
      </p>
    </div>
  );
};

// ============================================================================
// 4. BEAT-LEVEL AUDIO & SCENE METADATA CONTROLS
// ============================================================================

export interface BeatAudioControlsProps {
  beat: Beat;
  storyStage?: StageKind;
  storyCast?: 'rabbit' | 'none';
  onChangeBeat: (updatedFields: Partial<Beat>) => void;
  disabled?: boolean;
  className?: string;
}

export const BeatAudioControls: React.FC<BeatAudioControlsProps> = ({
  beat,
  storyStage = 'forest',
  storyCast = 'rabbit',
  onChangeBeat,
  disabled = false,
  className = '',
}) => {
  const showRigControls = storyCast !== 'none';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Row 1: Scene Framing & Voice Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Scene Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Moon size={13} className="text-indigo-500" />
            <span>Scene Framing (`sceneId`)</span>
          </label>
          <select
            value={beat.scene || 'establishing'}
            onChange={(e) => onChangeBeat({ scene: e.target.value as SceneId })}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
          >
            {SCENE_IDS.map((sc) => {
              const meta = SCENE_METADATA[sc];
              return (
                <option key={sc} value={sc}>
                  {meta.label} (Default: {meta.defaultBed})
                </option>
              );
            })}
          </select>
        </div>

        {/* Spoken Voice Profile */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Mic size={13} className="text-blue-500" />
            <span>Voice Profile (`voiceRole`)</span>
          </label>
          <select
            value={beat.voice || 'narrator'}
            onChange={(e) => onChangeBeat({ voice: e.target.value as VoiceRole })}
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
          >
            {VOICE_ROLES.map((vr) => {
              const meta = VOICE_ROLE_METADATA[vr];
              return (
                <option key={vr} value={vr}>
                  {meta.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Row 2: Ambient Sound Bed Override & SFX Sound Sting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ambient Bed Override */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Volume2 size={13} className="text-emerald-500" />
            <span>Ambient Bed Override (`music`)</span>
          </label>
          <select
            value={beat.music || ''}
            onChange={(e) =>
              onChangeBeat({
                music: e.target.value ? (e.target.value as SoundId) : undefined,
              })
            }
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
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
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Zap size={13} className="text-amber-500" />
            <span>SFX Cue Sting (`sfx`)</span>
          </label>
          <select
            value={beat.sfx || ''}
            onChange={(e) =>
              onChangeBeat({
                sfx: e.target.value ? (e.target.value as SoundId) : undefined,
              })
            }
            disabled={disabled}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
          >
            {SFX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Character Rig Poses (if cast !== 'none') */}
      {showRigControls && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              🐇 Rabbit Pose (`rabbit`)
            </label>
            <select
              value={beat.rabbit || 'hidden'}
              onChange={(e) => onChangeBeat({ rabbit: e.target.value as Pose })}
              disabled={disabled}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
            >
              {POSES.map((pose) => {
                const meta = POSE_METADATA[pose];
                return (
                  <option key={pose} value={pose}>
                    {meta.label} - {meta.description}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              🐯 Tiger Pose (`tiger`)
            </label>
            <select
              value={beat.tiger || 'hidden'}
              onChange={(e) => onChangeBeat({ tiger: e.target.value as Pose })}
              disabled={disabled}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
            >
              {POSES.map((pose) => {
                const meta = POSE_METADATA[pose];
                return (
                  <option key={pose} value={pose}>
                    {meta.label} - {meta.description}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}

      {/* Row 4: 4-Tier Ambient Sound Cascade Resolution Preview */}
      <AmbientBedPreview
        music={beat.music}
        scene={beat.scene}
        stage={storyStage}
      />
    </div>
  );
};
