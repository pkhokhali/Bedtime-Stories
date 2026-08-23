import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Video, Headphones, EyeOff, BookOpen, AlertCircle } from 'lucide-react';

const API_URL = 'https://saanjh-api.prabinkhokhali89.workers.dev/catalog';

type LocalizedString = { en: string; ne: string };

interface Story {
  id: string;
  title: LocalizedString;
  subtitle?: LocalizedString;
  category: string;
  ageBand: string;
  mediaType?: 'video' | 'audio' | 'text';
  mediaUrl?: string; // English / Default
  mediaUrl_ne?: string; // Nepali specific url
  coverImage?: string;
  isHidden?: boolean;
}

interface Catalog {
  version: number;
  stories: Story[];
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const data = await res.json();
      
      // Ensure structure exists
      if (!data.stories) data.stories = [];
      setCatalog(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCatalog = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const newCatalog = { ...catalog, version: (catalog?.version || 0) + 1 };
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCatalog)
      });
      
      if (!res.ok) throw new Error('Failed to save to database');
      
      setCatalog(newCatalog as Catalog);
      setSuccess('Successfully published to all devices!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addStory = () => {
    if (!catalog) return;
    const newStory: Story = {
      id: `new-story-${Date.now()}`,
      title: { en: 'New Story', ne: 'नयाँ कथा' },
      category: 'universal',
      ageBand: '4-6',
      mediaType: 'video',
      isHidden: true // Hidden by default until ready
    };
    setCatalog({ ...catalog, stories: [newStory, ...catalog.stories] });
  };

  const updateStory = (index: number, field: keyof Story, value: any) => {
    if (!catalog) return;
    const updatedStories = [...catalog.stories];
    updatedStories[index] = { ...updatedStories[index], [field]: value };
    setCatalog({ ...catalog, stories: updatedStories });
  };

  const updateLocalized = (index: number, field: 'title' | 'subtitle', lang: 'en' | 'ne', value: string) => {
    if (!catalog) return;
    const updatedStories = [...catalog.stories];
    const currentVal = updatedStories[index][field] || { en: '', ne: '' };
    updatedStories[index] = { 
      ...updatedStories[index], 
      [field]: { ...currentVal, [lang]: value } 
    };
    setCatalog({ ...catalog, stories: updatedStories });
  };

  const deleteStory = (index: number) => {
    if (!catalog) return;
    if (!confirm('Are you sure you want to delete this story?')) return;
    const updatedStories = [...catalog.stories];
    updatedStories.splice(index, 1);
    setCatalog({ ...catalog, stories: updatedStories });
  };

  if (loading) return <div className="p-10 text-center text-xl text-gray-600">Loading Database...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-amber-500" /> 
              Saanjh Admin Panel
            </h1>
            <p className="text-sm text-slate-400">Manage Content for {catalog?.stories.length || 0} stories • Version {catalog?.version}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={addStory} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
              <Plus size={18} /> Add New
            </button>
            <button 
              onClick={saveCatalog} 
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-900/20"
            >
              <Save size={18} /> {saving ? 'Publishing...' : 'Publish Live'}
            </button>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      <div className="max-w-5xl mx-auto mt-4 px-4">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg flex items-center gap-2"><AlertCircle size={20} /> {error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-lg font-medium">{success}</div>}
      </div>

      {/* Editor List */}
      <main className="max-w-5xl mx-auto mt-6 px-4 space-y-6">
        {catalog?.stories.map((story, i) => (
          <div key={story.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${story.isHidden ? 'border-gray-200 opacity-75' : 'border-slate-200'}`}>
            <div className={`p-4 flex justify-between items-center border-b ${story.isHidden ? 'bg-gray-100' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                {story.mediaType === 'video' ? <Video className="text-blue-500" /> : <Headphones className="text-amber-500" />}
                <input 
                  value={story.id} 
                  onChange={e => updateStory(i, 'id', e.target.value)}
                  className="font-mono text-sm bg-transparent border-none focus:ring-0 text-slate-600 w-64"
                  placeholder="unique-story-id"
                />
                {story.isHidden && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1"><EyeOff size={12}/> Hidden from App</span>}
                {story.ageBand === 'parents' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Parent Mode (Novel)</span>}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={!story.isHidden} onChange={e => updateStory(i, 'isHidden', !e.target.checked)} className="rounded text-amber-600" />
                  Published
                </label>
                <button onClick={() => deleteStory(i)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Col: Titles & Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title (English & Nepali)</label>
                  <input value={story.title.en} onChange={e => updateLocalized(i, 'title', 'en', e.target.value)} className="w-full border rounded-t-lg p-2 mb-px" placeholder="English Title" />
                  <input value={story.title.ne} onChange={e => updateLocalized(i, 'title', 'ne', e.target.value)} className="w-full border rounded-b-lg p-2" placeholder="नेपाली शीर्षक" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Audience</label>
                    <select value={story.ageBand} onChange={e => updateStory(i, 'ageBand', e.target.value)} className="w-full border rounded-lg p-2">
                      <option value="2-4">Ages 2-4 (Toddlers)</option>
                      <option value="4-6">Ages 4-6 (Kids)</option>
                      <option value="7-9">Ages 7-9 (Older Kids)</option>
                      <option value="parents">Parents (Novels / Audiobooks)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Format</label>
                    <select value={story.mediaType} onChange={e => updateStory(i, 'mediaType', e.target.value)} className="w-full border rounded-lg p-2">
                      <option value="video">Animated Video</option>
                      <option value="audio">Audio Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Col: Media URLs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image URL</label>
                  <input 
                    value={story.coverImage || ''} 
                    onChange={e => updateStory(i, 'coverImage', e.target.value)} 
                    className="w-full border rounded-lg p-2 text-sm" 
                    placeholder="https://cdn.saanjh.prabinkhokhali.com.np/covers/image.jpg" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">English Audio/Video URL</label>
                  <input 
                    value={story.mediaUrl || ''} 
                    onChange={e => updateStory(i, 'mediaUrl', e.target.value)} 
                    className="w-full border rounded-lg p-2 text-sm text-blue-600" 
                    placeholder="https://cdn.saanjh.prabinkhokhali.com.np/media/english.mp4" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nepali Audio/Video URL (Optional)</label>
                  <input 
                    value={story.mediaUrl_ne || ''} 
                    onChange={e => updateStory(i, 'mediaUrl_ne', e.target.value)} 
                    className="w-full border rounded-lg p-2 text-sm text-amber-600" 
                    placeholder="https://cdn.saanjh.prabinkhokhali.com.np/media/nepali.mp4" 
                  />
                  <p className="text-xs text-gray-400 mt-1">If provided, app shows a Bilingual toggle.</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {catalog?.stories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <h3 className="text-xl font-medium text-gray-600">No stories in database yet.</h3>
            <p className="text-gray-400 mt-2">Click "Add New" to create your first content.</p>
          </div>
        )}
      </main>
    </div>
  );
}
