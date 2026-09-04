import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Save,
  Search,
  Download,
  X,
  RefreshCw,
  FileText,
  WifiOff,
  Wifi,
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
  const { isAuthenticated, login, loading: authLoading, error: authError } = useAuth();
  
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
    return <LoginScreen login={login} loading={authLoading} error={authError} />;
  }

  return (
    <div className="admin-container font-sans flex text-slate-800 min-h-screen w-full bg-[#F8FAFC]">
      {/* Offline Banner Overlay */}
      {isOffline && (
        <div className="fixed top-0 left-0 w-full z-50 bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={15} />
          <span>You are currently offline. Local changes will not be saved to Cloudflare Workers until reconnected.</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#F8FAFC] border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
        {/* App Identity */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm text-white">
            <BookOpen size={16} />
          </div>
          <h1 className="font-bold text-slate-800 tracking-tight text-lg">Saanjh <span className="text-xs font-normal text-slate-400">Admin</span></h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Overview</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm">
             Dashboard
          </a>
          
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Content</p>
          <a href="#" onClick={(e) => {e.preventDefault(); setFormFilter('story'); setCategoryFilter('all');}} className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
             Stories & Novels
          </a>
          <a href="#" onClick={(e) => {e.preventDefault(); setFormFilter('all');}} className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
             Categories
          </a>

          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">System</p>
          <a href="#" onClick={(e) => {e.preventDefault(); handleOpenBackupModal();}} className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
             Backup / Restore
          </a>
        </nav>

        {/* User Profile / Status */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-3">
             {isOffline ? (
                <span className="text-[11px] font-medium px-2 py-0.5 bg-rose-100 text-rose-600 border border-rose-200 rounded-full flex items-center gap-1">
                  <WifiOff size={11} /> Offline
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full flex items-center gap-1">
                  <Wifi size={11} /> Online
                </span>
              )}
              {isDirty && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-500 text-white rounded-full shadow-sm">
                  Unsaved
                </span>
              )}
          </div>
          <div className="flex items-center gap-3">
            <img src="https://ui-avatars.com/api/?name=SA&background=475569&color=fff" className="w-9 h-9 rounded-full shadow-sm" alt="Admin" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Super Admin</p>
              <p className="text-[11px] text-slate-500 truncate">v{catalog?.version || 1}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden min-w-0">
        
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md shrink-0">
          <h2 className="font-semibold text-lg hidden sm:block">Dashboard</h2>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content..." 
                className="pl-9 pr-8 py-1.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-40 sm:w-64 transition-all" 
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X size={13} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={loadCatalog} disabled={loading} title="Refresh" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={handleSaveCatalog} 
                disabled={saving || !catalog}
                className={`${isDirty ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 shadow-md' : 'bg-slate-200 text-slate-500 opacity-80 cursor-not-allowed'} px-4 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2`}
              >
                <Save size={14} /> <span className="hidden sm:inline">{saving ? 'Publishing...' : 'Publish'}</span>
              </button>
              <button onClick={() => handleAddStory('story')} className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5">
                <Plus size={14} /> <span className="hidden sm:inline">Story</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          
          {/* Metric Cards (Clean, macOS style) */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Total Stories</p>
                <span className="text-indigo-500 bg-indigo-50 p-1.5 rounded-lg"><BookOpen size={16} /></span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{catalog?.stories?.length || 0}</h3>
              <p className="text-xs text-emerald-600 mt-2 font-medium">+2 this week</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Published Live</p>
                <span className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg"><FileText size={16} /></span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{catalog?.stories?.filter(s => !s.isHidden).length || 0}</h3>
              <p className="text-xs text-emerald-600 mt-2 font-medium">Active in app</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Drafts</p>
                <span className="text-amber-500 bg-amber-50 p-1.5 rounded-lg"><Save size={16} /></span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{catalog?.stories?.filter(s => s.isHidden).length || 0}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Needs review</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500">Active Listeners</p>
                <span className="text-pink-500 bg-pink-50 p-1.5 rounded-lg"><Wifi size={16} /></span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800">8,592</h3>
              <p className="text-xs text-emerald-600 mt-2 font-medium">Coming soon</p>
            </div>
          </div>

          {/* Filters Bar below metrics */}
          <div className="bg-white rounded-t-xl border border-slate-200 border-b-0 shadow-sm px-6 py-4 flex flex-wrap items-center gap-3">
             <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none">
                <option value="all">Category: All</option>
                <option value="roots">Roots (Folklore)</option>
                <option value="universal">Universal</option>
                <option value="custom">Custom</option>
             </select>
             <select value={ageBandFilter} onChange={(e) => setAgeBandFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none">
                <option value="all">Age: All</option>
                {AGE_BANDS.map(band => <option key={band} value={band}>{band === 'parents' ? 'Parents' : 'Ages '+band}</option>)}
             </select>
             <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none">
                <option value="all">Format: All</option>
                <option value="story">Stories</option>
                <option value="novel">Novels</option>
             </select>
             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none">
                <option value="all">Status: All</option>
                <option value="published">Published</option>
                <option value="hidden">Drafts</option>
             </select>
             <div className="flex-1 min-w-[20px]"></div>
             <button onClick={expandAllStories} className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 px-2 py-1 rounded">Expand All</button>
             <button onClick={collapseAllStories} className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 px-2 py-1 rounded">Collapse All</button>
          </div>

          {/* Story List */}
          <div className="bg-white rounded-b-xl border border-slate-200 shadow-sm min-h-[400px]">
             {loading ? (
                <div className="text-center py-24">
                  <RefreshCw size={36} className="mx-auto text-indigo-500 animate-spin mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">Loading Stories...</h3>
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="text-center py-24">
                  <FileText size={42} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-sm font-bold text-slate-600">No Stories Found</h3>
                  <p className="text-xs text-slate-400 mt-1">Try resetting your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
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
          </div>
        </div>
      </main>

      {/* Modals & Toasts */}
      {isSecretModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-white flex justify-between items-center border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Admin Secret Required</h3>
              <button onClick={() => setIsSecretModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-3">Please enter your Cloudflare Workers Admin Secret to publish changes.</p>
              <input
                type="password"
                value={tempSecret}
                onChange={(e) => setTempSecret(e.target.value)}
                placeholder="Secret Key..."
                className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                autoFocus
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsSecretModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Cancel</button>
              <button onClick={handleSaveSecretModal} className="px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 flex justify-between items-center border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Backup & Restore</h3>
              <button onClick={() => setIsBackupModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-4 flex-1 flex flex-col overflow-hidden space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">Edit JSON or download backup.</p>
                <button onClick={handleDownloadBackup} className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 shadow-sm">
                  <Download size={13} /> Download .json
                </button>
              </div>
              <textarea
                value={backupJsonText}
                onChange={(e) => { setBackupJsonText(e.target.value); setBackupError(''); }}
                className="flex-1 font-mono text-[11px] p-3 bg-slate-900 text-green-400 rounded-xl border border-slate-700 resize-none outline-none min-h-[300px]"
              />
              {backupError && <p className="text-xs text-rose-600 mt-1">{backupError}</p>}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">Version {catalog?.version || 1}</span>
              <div className="flex gap-2">
                <button onClick={() => setIsBackupModalOpen(false)} className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                <button onClick={handleApplyBackupJson} className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm">Apply Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} position="bottom-right" />
    </div>
  );
}
