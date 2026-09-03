import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Save,
  Key,
  Search,
  Download,
  AlertCircle,
  X,
  RefreshCw,
  FileText,
  SlidersHorizontal,
  WifiOff,
  Wifi,
  ShieldAlert,
} from 'lucide-react';
import type {
  Catalog,
  Story,
  StoryForm as StoryFormType,
} from './types/story';
import { AGE_BANDS } from './types/story';
import {
  fetchCatalog,
  saveCatalog,
  getStoredAdminSecret,
  setStoredAdminSecret,
  ApiError,
} from './utils/api';
import { StoryCard } from './components/StoryCard';
import { ToastContainer } from './components/ToastContainer';
import type { ToastItem, ToastType } from './components/Toast';
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // Main catalog state
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [originalCatalogJson, setOriginalCatalogJson] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Authentication & Secrets
  const [adminSecret, setAdminSecret] = useState<string>(() => getStoredAdminSecret());
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [tempSecret, setTempSecret] = useState('');

  // Expanded stories state
  const [expandedStoryIds, setExpandedStoryIds] = useState<Record<string, boolean>>({});

  // Search and Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ageBandFilter, setAgeBandFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Network Offline State
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false;
  });

  // Backup Modal
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupJsonText, setBackupJsonText] = useState('');
  const [backupError, setBackupError] = useState('');

  // Centralized Toast Helper
  const addToast = useCallback((type: ToastType, message: string, durationMs = 4500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = { id, type, message, timestamp: Date.now(), durationMs };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Online / Offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast('success', 'Internet connection restored. You can now publish changes.');
    };

    const handleOffline = () => {
      setIsOffline(true);
      addToast('error', 'Network connection lost. You are currently offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Load catalog on mount
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
        throw new ApiError('Network offline: Failed to fetch catalog from server.', 0);
      }
      const data = await fetchCatalog();
      setCatalog(data);
      setOriginalCatalogJson(JSON.stringify(data));
      addToast('info', `Loaded ${data.stories.length} stories (Version ${data.version || 1})`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load catalog from server');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Dirty state computation
  const isDirty = useMemo(() => {
    if (!catalog) return false;
    return JSON.stringify(catalog) !== originalCatalogJson;
  }, [catalog, originalCatalogJson]);

  // Save changes to Cloudflare Workers KV
  const handleSaveCatalog = async () => {
    if (!catalog) return;

    if (isOffline || (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine)) {
      addToast('error', 'Network error: Cannot publish changes while offline.');
      return;
    }

    setSaving(true);
    try {
      const res = await saveCatalog(catalog, adminSecret);
      if (res.success) {
        const updated: Catalog = {
          ...catalog,
          version: res.version,
        };
        setCatalog(updated);
        setOriginalCatalogJson(JSON.stringify(updated));
        addToast('success', `Successfully published ${res.count} stories (v${res.version}) live!`);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized) {
          addToast('error', 'Unauthorized: Invalid or missing Admin Secret key.');
          setTempSecret(adminSecret);
          setIsSecretModalOpen(true);
        } else if (err.isOffline) {
          addToast('error', 'Network error: Cannot publish changes while offline.');
        } else {
          addToast('error', err.message);
        }
      } else {
        addToast('error', `Save failed: ${err.message || err}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Secret persistence
  const handleSecretChange = (val: string) => {
    setAdminSecret(val);
    setStoredAdminSecret(val);
  };

  const handleSaveSecretModal = () => {
    handleSecretChange(tempSecret.trim());
    setIsSecretModalOpen(false);
    addToast('success', 'Admin Secret key updated.');
  };

  // Story Management Actions
  const handleAddStory = (form: StoryFormType = 'story') => {
    if (!catalog) return;
    const newId = `story-${Date.now().toString(36)}`;
    const newStory: Story = {
      id: newId,
      category: 'universal',
      form,
      ageBand: form === 'novel' ? 'parents' : '4-6',
      title: {
        en: form === 'novel' ? 'New Bedtime Novel' : 'New Bedtime Story',
        ne: form === 'novel' ? 'नयाँ सुत्ने बेलाको उपन्यास' : 'नयाँ सुत्ने बेलाको कथा',
      },
      subtitle: { en: '', ne: '' },
      theme: { en: '', ne: '' },
      accent: '#f59e0b',
      stage: 'forest',
      cast: form === 'novel' ? 'none' : 'rabbit',
      beats: [],
      runtimeMinutes: 1,
      isHidden: true, // Draft by default
    };

    setCatalog({
      ...catalog,
      stories: [newStory, ...catalog.stories],
    });
    setExpandedStoryIds((prev) => ({ ...prev, [newId]: true }));
    addToast('info', `Created new ${form}: "${newStory.title.en}"`);
  };

  const handleUpdateStory = (storyId: string, updates: Partial<Story>) => {
    if (!catalog) return;
    const updated = catalog.stories.map((s) => (s.id === storyId ? { ...s, ...updates } : s));
    setCatalog({ ...catalog, stories: updated });
  };

  const handleDuplicateStory = (storyId: string) => {
    if (!catalog) return;
    const target = catalog.stories.find((s) => s.id === storyId);
    if (!target) return;

    const clonedId = `${target.id}-copy-${Math.random().toString(36).slice(2, 6)}`;
    const clonedStory: Story = {
      ...target,
      id: clonedId,
      title: {
        en: `${target.title?.en || 'Story'} (Copy)`,
        ne: `${target.title?.ne || 'कथा'} (प्रतिलिपि)`,
      },
      isHidden: true,
      beats: target.beats ? target.beats.map((b) => ({ ...b, id: `${b.id}-copy` })) : [],
    };

    const targetIdx = catalog.stories.findIndex((s) => s.id === storyId);
    const nextStories = [...catalog.stories];
    nextStories.splice(targetIdx + 1, 0, clonedStory);

    setCatalog({ ...catalog, stories: nextStories });
    setExpandedStoryIds((prev) => ({ ...prev, [clonedId]: true }));
    addToast('info', `Duplicated story into "${clonedId}"`);
  };

  const handleDeleteStory = (storyId: string) => {
    if (!catalog) return;
    const updated = catalog.stories.filter((s) => s.id !== storyId);
    setCatalog({ ...catalog, stories: updated });
    addToast('info', `Deleted story "${storyId}"`);
  };

  // Toggle expand single story
  const toggleExpandStory = (storyId: string) => {
    setExpandedStoryIds((prev) => ({
      ...prev,
      [storyId]: !prev[storyId],
    }));
  };

  // Expand / Collapse all
  const expandAllStories = () => {
    if (!catalog) return;
    const all: Record<string, boolean> = {};
    catalog.stories.forEach((s) => (all[s.id] = true));
    setExpandedStoryIds(all);
  };

  const collapseAllStories = () => {
    setExpandedStoryIds({});
  };

  // Filtered stories calculation
  const filteredStories = useMemo(() => {
    if (!catalog?.stories) return [];

    return catalog.stories.filter((story) => {
      // Category filter
      if (categoryFilter !== 'all' && story.category !== categoryFilter) {
        return false;
      }

      // AgeBand filter
      if (ageBandFilter !== 'all' && story.ageBand !== ageBandFilter) {
        return false;
      }

      // Form filter
      if (formFilter !== 'all' && story.form !== formFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'published' && story.isHidden) {
        return false;
      }
      if (statusFilter === 'hidden' && !story.isHidden) {
        return false;
      }

      // Search Query filter (matches EN title, NE title, story ID, or theme)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const idMatch = (story.id || '').toLowerCase().includes(query);
        const titleEnMatch = (story.title?.en || '').toLowerCase().includes(query);
        const titleNeMatch = (story.title?.ne || '').includes(query);
        const themeEnMatch = (story.theme?.en || '').toLowerCase().includes(query);
        const themeNeMatch = (story.theme?.ne || '').includes(query);

        if (!idMatch && !titleEnMatch && !titleNeMatch && !themeEnMatch && !themeNeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [catalog, categoryFilter, ageBandFilter, formFilter, statusFilter, searchQuery]);

  // Open Backup Modal
  const handleOpenBackupModal = () => {
    if (!catalog) return;
    setBackupJsonText(JSON.stringify(catalog, null, 2));
    setBackupError('');
    setIsBackupModalOpen(true);
  };

  // Import Backup JSON
  const handleApplyBackupJson = () => {
    try {
      const parsed = JSON.parse(backupJsonText);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.stories)) {
        throw new Error('Invalid catalog format: JSON must contain a "stories" array.');
      }
      setCatalog({
        version: typeof parsed.version === 'number' ? parsed.version : (catalog?.version || 1),
        stories: parsed.stories,
      });
      setIsBackupModalOpen(false);
      addToast('success', `Imported ${parsed.stories.length} stories from backup JSON.`);
    } catch (err: any) {
      setBackupError(err.message || 'Malformed JSON');
    }
  };

  // Download Catalog JSON
  const handleDownloadBackup = () => {
    if (!catalog) return;
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saanjh_catalog_v${catalog.version || 1}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Downloaded local catalog backup file.');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw size={32} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-28 font-sans">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={15} />
          <span>You are currently offline. Local changes will not be saved to Cloudflare Workers until reconnected.</span>
        </div>
      )}

      {/* 1. TOP STICKY APP HEADER */}
      <header className="bg-slate-950 text-white shadow-lg sticky top-0 z-30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-md text-slate-950 font-bold">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight">Saanjh Admin CMS</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                  v{catalog?.version || 1}
                </span>
                {isDirty && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-500 text-white rounded-full animate-pulse shadow-sm">
                    Unsaved Changes
                  </span>
                )}
                {isOffline ? (
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-rose-900/60 text-rose-300 border border-rose-700/50 rounded-full flex items-center gap-1">
                    <WifiOff size={11} /> Offline
                  </span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 rounded-full flex items-center gap-1">
                    <Wifi size={11} /> Online
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Bilingual Content Studio • {catalog?.stories.length || 0} Stories Configured
              </p>
            </div>
          </div>

          {/* Right Actions: Secret, New Story, Save Live */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Secret Toggle / Input */}
            <div className="relative flex items-center">
              <Key size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                value={adminSecret}
                onChange={(e) => handleSecretChange(e.target.value)}
                placeholder="Admin Secret Key"
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-44 transition-all"
                title="Bearer Token for Cloudflare Workers API authorization"
              />
            </div>

            {/* Refresh from server */}
            <button
              type="button"
              onClick={loadCatalog}
              disabled={loading}
              title="Reload catalog from Cloudflare Workers KV"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Backup / Restore */}
            <button
              type="button"
              onClick={handleOpenBackupModal}
              title="Backup & Restore Catalog JSON"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
            >
              <SlidersHorizontal size={15} />
            </button>

            {/* New Story Button */}
            <button
              type="button"
              onClick={() => handleAddStory('story')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} /> Story
            </button>

            {/* New Novel Button */}
            <button
              type="button"
              onClick={() => handleAddStory('novel')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} /> Novel
            </button>

            {/* Save All Live Button */}
            <button
              type="button"
              onClick={handleSaveCatalog}
              disabled={saving || !catalog}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                isDirty
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/30 ring-2 ring-amber-400/40'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white'
              } disabled:opacity-50`}
            >
              <Save size={15} /> {saving ? 'Publishing...' : isDirty ? 'Publish All Changes' : 'Published Live'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <section className="bg-white border-b border-slate-200 shadow-2xs sticky top-[57px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title (EN / NE), story ID, or theme..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">Category: All</option>
              <option value="roots">Roots (Folklore)</option>
              <option value="universal">Universal</option>
              <option value="custom">Custom</option>
            </select>

            {/* AgeBand Filter (Matching all 8 mobile bands) */}
            <select
              value={ageBandFilter}
              onChange={(e) => setAgeBandFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">Age: All Bands</option>
              {AGE_BANDS.map((band) => (
                <option key={band} value={band}>
                  {band === 'parents' ? 'Parents (Novel)' : `Ages ${band}`}
                </option>
              ))}
            </select>

            {/* Form Filter */}
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">Format: All</option>
              <option value="story">Bedtime Stories</option>
              <option value="novel">Bedtime Novels</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">Status: All</option>
              <option value="published">Live Published</option>
              <option value="hidden">Hidden Drafts</option>
            </select>

            {/* Expand / Collapse All */}
            <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={expandAllStories}
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAllStories}
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
            >
              Collapse All
            </button>
          </div>
        </div>
      </section>

      {/* 3. MAIN STORY LIST */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <RefreshCw size={36} className="mx-auto text-amber-600 animate-spin mb-3" />
            <h3 className="text-base font-bold text-slate-800">Loading Story Database...</h3>
            <p className="text-xs text-slate-500 mt-1">Connecting to Cloudflare Workers KV API</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-6">
            <FileText size={42} className="mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-700">No Stories Match Current Filters</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or reset the category/age filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setAgeBandFilter('all');
                setFormFilter('all');
                setStatusFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>
                Showing <strong>{filteredStories.length}</strong> of{' '}
                <strong>{catalog?.stories.length || 0}</strong> stories
              </span>
              {isDirty && (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle size={14} /> You have unsaved changes
                </span>
              )}
            </div>

            {filteredStories.map((story, i) => (
              <StoryCard
                key={story.id}
                story={story}
                index={i}
                isExpanded={Boolean(expandedStoryIds[story.id])}
                onToggleExpand={() => toggleExpandStory(story.id)}
                onUpdate={(updates) => handleUpdateStory(story.id, updates)}
                onDuplicate={() => handleDuplicateStory(story.id)}
                onDelete={() => handleDeleteStory(story.id)}
                adminSecret={adminSecret}
                onNotify={addToast}
              />
            ))}
          </div>
        )}
      </main>

      {/* 4. ADMIN SECRET MODAL */}
      {isSecretModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-rose-950 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-rose-400" />
                <h3 className="text-sm font-bold">Admin Authentication Required</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSecretModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                The Cloudflare Workers API returned <strong>401 Unauthorized</strong>. Please enter the valid <code>ADMIN_SECRET</code> key configured for this environment:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admin Secret Key (Bearer Token)
                </label>
                <input
                  type="password"
                  value={tempSecret}
                  onChange={(e) => setTempSecret(e.target.value)}
                  placeholder="Enter secret key..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSecretModalOpen(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSecretModal}
                className="px-4 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
              >
                Save & Authenticate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. BACKUP & RESTORE MODAL */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold">Catalog JSON Backup & Restore</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-600">
                  Export complete database JSON for offline backup or paste external catalog data:
                </p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-300"
                >
                  <Download size={13} /> Download .json
                </button>
              </div>

              <textarea
                value={backupJsonText}
                onChange={(e) => {
                  setBackupJsonText(e.target.value);
                  setBackupError('');
                }}
                className="flex-1 font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 resize-none focus:outline-none min-h-[300px]"
              />

              {backupError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{backupError}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Catalog Version {catalog?.version || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(false)}
                  className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBackupJson}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm"
                >
                  Restore / Apply JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FLOATING TOAST NOTIFICATION CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} position="bottom-right" />
    </div>
  );
}
