const fs = require('fs');
let code = fs.readFileSync('admin/src/App.tsx', 'utf-8');

// 1. Update imports
const importsToAdd = 'LayoutGrid, Folder, Mic, Users, Settings, ArrowUp, PlayCircle, Star, Edit, Moon';
code = code.replace('ShieldAlert,', 'ShieldAlert,\n  ' + importsToAdd + ',');

// 2. Replace the return block layout
const marker = 'return (\n    <div className="min-h-screen bg-slate-100 text-slate-900 pb-28 font-sans">';
const returnStart = code.indexOf(marker);
if (returnStart === -1) {
  console.log("Could not find marker");
  process.exit(1);
}

const returnContent = `return (
    <div className="min-h-screen font-sans flex text-slate-800 bg-slate-100">
      {/* Offline Banner */}
      {isOffline && (
        <div className="absolute top-0 w-full z-50 bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={15} />
          <span>You are currently offline. Local changes will not be saved to Cloudflare Workers until reconnected.</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#F8FAFC] border-r border-slate-200 flex flex-col fixed h-screen z-40">
        {/* App Identity */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm text-white">
            <Moon size={16} />
          </div>
          <h1 className="font-bold text-slate-800 tracking-tight text-lg flex items-center gap-2">
            Saanjh <span className="text-xs font-normal text-slate-400">Admin</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Overview</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm">
            <LayoutGrid size={18} className="text-indigo-600" /> Dashboard
          </a>
          
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Content</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
            <BookOpen size={18} className="text-slate-400" /> Stories & Novels
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
            <Folder size={18} className="text-slate-400" /> Categories
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
            <Mic size={18} className="text-slate-400" /> Audio Files
          </a>

          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">System</p>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
            <Users size={18} className="text-slate-400" /> Users
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
            <Settings size={18} className="text-slate-400" /> Settings
          </a>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">SA</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">Super Admin</p>
              <p className="text-[11px] text-slate-500 truncate">admin@saanjh.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden ml-64 min-h-screen">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg">Dashboard</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
              v{catalog?.version || 1}
            </span>
            {isDirty && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full animate-pulse">
                Unsaved Changes
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search content..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenBackupModal}
              title="Backup & Restore Catalog JSON"
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <SlidersHorizontal size={16} />
            </button>

            <button
              type="button"
              onClick={loadCatalog}
              disabled={loading}
              title="Reload catalog"
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            
            <button
              type="button"
              onClick={() => handleAddStory('story')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg font-medium text-sm shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> New Story
            </button>

            <button
              type="button"
              onClick={handleSaveCatalog}
              disabled={saving || !catalog}
              className={\`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm \${
                isDirty
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-50\`}
            >
              <Save size={14} /> {saving ? 'Publishing...' : isDirty ? 'Publish' : 'Published'}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-slate-500">Total Stories</p>
                      <span className="text-indigo-500 bg-indigo-50 p-1.5 rounded-lg"><BookOpen size={16} /></span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{catalog?.stories?.length || 0}</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1"><ArrowUp size={12} />+12 this week</p>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-slate-500">Active Listeners</p>
                      <span className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg"><Users size={16} /></span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">8,592</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1"><ArrowUp size={12} />+5.2% vs last mo</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-slate-500">Audio Playback</p>
                      <span className="text-amber-500 bg-amber-50 p-1.5 rounded-lg"><PlayCircle size={16} /></span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">45.2k <span className="text-sm font-normal text-slate-400">hrs</span></h3>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Across all platforms</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium text-slate-500">Avg. Rating</p>
                      <span className="text-pink-500 bg-pink-50 p-1.5 rounded-lg"><Star size={16} /></span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">4.8 <span className="text-sm font-normal text-slate-400">/5</span></h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Based on 1.2k reviews</p>
              </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="all">Category: All</option>
              <option value="roots">Roots (Folklore)</option>
              <option value="universal">Universal</option>
              <option value="custom">Custom</option>
            </select>
            <select value={ageBandFilter} onChange={(e) => setAgeBandFilter(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="all">Age: All Bands</option>
              {AGE_BANDS.map((band) => (
                <option key={band} value={band}>{band === 'parents' ? 'Parents (Novel)' : \`Ages \${band}\`}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="all">Status: All</option>
              <option value="published">Live Published</option>
              <option value="hidden">Hidden Drafts</option>
            </select>
            <div className="flex-1"></div>
            <button type="button" onClick={expandAllStories} className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 bg-white border border-slate-200 rounded-lg">Expand All</button>
            <button type="button" onClick={collapseAllStories} className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-2 bg-white border border-slate-200 rounded-lg">Collapse All</button>
          </div>

          {/* Data Grid / Stories List */}
          {loading ? (
            <div className="text-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm">
              <RefreshCw size={36} className="mx-auto text-indigo-500 animate-spin mb-3" />
              <h3 className="text-base font-bold text-slate-800">Loading Content...</h3>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm border-dashed">
              <FileText size={42} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Content Found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-4">
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
      </main>
`;

const remainingModals = code.substring(code.indexOf('{/* 4. ADMIN SECRET MODAL */}'));
const finalCode = code.substring(0, returnStart) + returnContent + '\n      ' + remainingModals;

fs.writeFileSync('admin/src/App.tsx', finalCode);
console.log('App.tsx updated successfully');
