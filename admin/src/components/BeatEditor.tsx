import { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Code,
  Check,
  Maximize2,
  Minimize2,
  Clock,
  Layers,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';
import type { Beat, SceneId, VoiceRole, StageKind } from '../types/story';
import { SmartSplitter, estimateRuntimeMinutes } from '../utils/splitter';
import { BeatAudioControls } from './AudioMetadataControls';

// ============================================================================
// 1. BULK AUTO-SPLITTER MODAL
// ============================================================================

interface BulkSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (beats: Beat[], mode: 'replace' | 'append') => void;
  defaultStage?: StageKind;
}

export const BulkSplitterModal: React.FC<BulkSplitterModalProps> = ({
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
    return estimateRuntimeMinutes(previewBeats);
  }, [previewBeats]);

  if (!isOpen) return null;

  const countMismatch =
    parasEn.length > 0 && parasNe.length > 0 && parasEn.length !== parasNe.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
                Paste raw story manuscripts separated by double newlines (\n\n) to auto-generate timed beats.
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
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-700">Defaults:</span>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value as VoiceRole)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-amber-500"
            >
              <option value="narrator">Default Voice: Narrator</option>
              <option value="soft">Default Voice: Soft (Whispered)</option>
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
              type="button"
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
              type="button"
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
                  placeholder={`Paste raw English story text here...\n\nSeparate paragraphs with double newlines (\\n\\n).\n\n"Use quotation marks for dialogue to auto-assign soft or character voices."`}
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
                  placeholder={`नेपाली कथाको पाठ यहाँ टाँस्नुहोस्...\n\nअनुच्छेदहरूलाई खाली लाइनले (\\n\\n) छुट्याउनुहोस्।\n\n“सम्वादहरूलाई उद्धरण चिन्हभित्र राख्नुहोस्।”`}
                  className="flex-1 w-full min-h-[300px] p-3 text-sm font-sans bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            /* Live Preview */
            <div className="space-y-3">
              {previewBeats.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Sparkles size={36} className="mx-auto mb-2 opacity-40" />
                  <p>Paste text in the Editor tab to preview generated beats.</p>
                </div>
              ) : (
                previewBeats.map((beat, idx) => (
                  <div
                    key={beat.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3 items-start"
                  >
                    <div className="flex md:flex-col items-center gap-1.5 shrink-0 w-24">
                      <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {beat.scene}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                          beat.voice === 'soft'
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
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
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(previewBeats, 'append');
                onClose();
              }}
              disabled={previewBeats.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} /> Append to Existing
            </button>
            <button
              type="button"
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

// ============================================================================
// 2. MAIN BEAT EDITOR COMPONENT
// ============================================================================

export interface BeatEditorProps {
  beats?: Beat[];
  onChange: (beats: Beat[]) => void;
  defaultStage?: StageKind;
  storyCast?: 'rabbit' | 'none';
}

export const BeatEditor: React.FC<BeatEditorProps> = ({
  beats = [],
  onChange,
  defaultStage = 'forest',
  storyCast = 'rabbit',
}) => {
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [expandedBeats, setExpandedBeats] = useState<Record<string, boolean>>({});

  // Real-time runtime calculation
  const runtimeMinutes = useMemo(() => estimateRuntimeMinutes(beats), [beats]);

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
    const nextBeats = [...beats];
    nextBeats.splice(index + 1, 0, clonedBeat);
    onChange(nextBeats);
  };

  // Reorder beats: Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const nextBeats = [...beats];
    const temp = nextBeats[index - 1];
    nextBeats[index - 1] = nextBeats[index];
    nextBeats[index] = temp;
    onChange(nextBeats);
  };

  // Reorder beats: Move Down
  const handleMoveDown = (index: number) => {
    if (index >= beats.length - 1) return;
    const nextBeats = [...beats];
    const temp = nextBeats[index + 1];
    nextBeats[index + 1] = nextBeats[index];
    nextBeats[index] = temp;
    onChange(nextBeats);
  };

  // Delete beat
  const handleDeleteBeat = (index: number) => {
    const nextBeats = [...beats];
    nextBeats.splice(index, 1);
    onChange(nextBeats);
  };

  // Update beat field
  const handleUpdateBeat = (index: number, updates: Partial<Beat>) => {
    const nextBeats = [...beats];
    nextBeats[index] = {
      ...nextBeats[index],
      ...updates,
      text: updates.text
        ? { ...nextBeats[index].text, ...updates.text }
        : nextBeats[index].text,
    };
    onChange(nextBeats);
  };

  // Update localized text
  const handleUpdateText = (
    index: number,
    lang: 'en' | 'ne',
    val: string
  ) => {
    const nextBeats = [...beats];
    const currentText = nextBeats[index].text || { en: '', ne: '' };
    nextBeats[index] = {
      ...nextBeats[index],
      text: {
        ...currentText,
        [lang]: val,
      },
    };
    onChange(nextBeats);
  };

  // Handle Splitter Apply
  const handleSplitterApply = (newBeats: Beat[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      onChange(newBeats);
    } else {
      onChange([...beats, ...newBeats]);
    }
  };

  // Open JSON modal
  const handleOpenJsonModal = () => {
    setJsonText(JSON.stringify(beats, null, 2));
    setJsonError('');
    setIsJsonModalOpen(true);
  };

  // Apply JSON changes
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Beat list must be a JSON array of Beat objects.');
      }
      onChange(parsed);
      setIsJsonModalOpen(false);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Layers size={14} className="text-amber-400" />
            <span>{beats.length} Beats</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Clock size={14} className="text-emerald-400" />
            <span>~{runtimeMinutes} mins Runtime</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsSplitterOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles size={14} /> Auto-Splitter
          </button>

          <button
            type="button"
            onClick={handleAddBeat}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Add Beat
          </button>

          <button
            type="button"
            onClick={handleOpenJsonModal}
            title="Import or Export Beats JSON"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg border border-slate-700 transition-colors"
          >
            <Code size={15} />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={expandAll}
            title="Expand All Beats"
            className="p-1.5 text-slate-400 hover:text-white text-xs"
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            onClick={collapseAll}
            title="Collapse All Beats"
            className="p-1.5 text-slate-400 hover:text-white text-xs"
          >
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* Dynamic Beat Card List */}
      <div className="space-y-3">
        {beats.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <FileText size={36} className="mx-auto text-slate-400 mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-slate-700">No Beats Configured</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Use the <strong>Auto-Splitter</strong> to parse raw narrative text, or click <strong>Add Beat</strong> to construct beats manually.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsSplitterOpen(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} /> Open Auto-Splitter
              </button>
              <button
                type="button"
                onClick={handleAddBeat}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Blank Beat
              </button>
            </div>
          </div>
        ) : (
          beats.map((beat, idx) => {
            const isExpanded = expandedBeats[beat.id] !== false; // Default true
            const enWords = (beat.text?.en || '').trim().split(/\s+/).filter(Boolean).length;
            const enChars = (beat.text?.en || '').length;
            const neWords = (beat.text?.ne || '').trim().split(/\s+/).filter(Boolean).length;
            const neChars = (beat.text?.ne || '').length;

            return (
              <div
                key={beat.id || idx}
                className={`bg-white border rounded-xl shadow-xs transition-all overflow-hidden ${
                  isExpanded ? 'border-slate-300 ring-1 ring-slate-200' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Beat Header Bar */}
                <div
                  onClick={() => toggleExpand(beat.id)}
                  className="p-3 bg-slate-50 flex items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800 truncate max-w-xs md:max-w-md">
                      {beat.text?.en || beat.text?.ne || <em className="text-slate-400 font-normal">Empty beat</em>}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Scene tag */}
                    <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {beat.scene || 'establishing'}
                    </span>

                    {/* Voice tag */}
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        beat.voice === 'soft'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : beat.voice === 'tiger'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : beat.voice === 'rabbit'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {beat.voice || 'narrator'}
                    </span>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveUp(idx)}
                      title="Move Up"
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                    >
                      <ChevronUp size={15} />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === beats.length - 1}
                      onClick={() => handleMoveDown(idx)}
                      title="Move Down"
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded hover:bg-slate-200 transition-colors"
                    >
                      <ChevronDown size={15} />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicateBeat(idx)}
                      title="Duplicate Beat"
                      className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors"
                    >
                      <Copy size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteBeat(idx)}
                      title="Delete Beat"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Beat Body */}
                {isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Bilingual Text Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* English Text Input */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            English Beat Text
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {enWords} words • {enChars} chars
                          </span>
                        </div>
                        <textarea
                          value={beat.text?.en || ''}
                          onChange={(e) => handleUpdateText(idx, 'en', e.target.value)}
                          placeholder="Enter English beat narration or dialogue..."
                          rows={3}
                          className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Nepali Text Input */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            नेपाली पाठ (Devanagari)
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {neWords} शब्द • {neChars} वर्ण
                          </span>
                        </div>
                        <textarea
                          value={beat.text?.ne || ''}
                          onChange={(e) => handleUpdateText(idx, 'ne', e.target.value)}
                          placeholder="नेपाली कथाको अंश यहाँ प्रविष्ट गर्नुहोस्..."
                          rows={3}
                          className="w-full p-2.5 text-sm font-sans bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {/* Staging, Audio & Character Pose Controls */}
                    <BeatAudioControls
                      beat={beat}
                      storyStage={defaultStage}
                      storyCast={storyCast}
                      onChangeBeat={(updates) => handleUpdateBeat(idx, updates)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action Footer */}
      {beats.length > 0 && (
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleAddBeat}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus size={15} /> Add Another Beat
          </button>
          <span className="text-xs text-slate-500">
            Total {beats.length} beats ready • Estimated runtime: ~{runtimeMinutes} mins
          </span>
        </div>
      )}

      {/* Bulk Splitter Modal */}
      <BulkSplitterModal
        isOpen={isSplitterOpen}
        onClose={() => setIsSplitterOpen(false)}
        onApply={handleSplitterApply}
        defaultStage={defaultStage}
      />

      {/* JSON Import/Export Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Code size={16} className="text-amber-400" />
                <span>Beat List JSON Import / Export</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              <p className="text-xs text-slate-600 mb-2">
                Inspect, copy, or paste an array of <code>Beat</code> objects:
              </p>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError('');
                }}
                className="flex-1 font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 resize-none focus:outline-none"
              />
              {jsonError && (
                <div className="mt-2 p-2 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {jsonError}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyJson}
                className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg"
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
