'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, X, Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { IFolder } from '@/types';
import { FolderCard } from '@/components/folders/FolderCard';

const COLORS = ['indigo', 'violet', 'sky', 'emerald', 'amber', 'rose'];

export default function FoldersPage() {
  const [folders,    setFolders]    = useState<IFolder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name,       setName]       = useState('');
  const [desc,       setDesc]       = useState('');
  const [color,      setColor]      = useState('indigo');
  const [creating,   setCreating]   = useState(false);
  const [selected,   setSelected]   = useState<string | null>(null);
  const [error,      setError]      = useState('');

  const loadFolders = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/folders');
      const json = await res.json();
      if (json.success) setFolders(json.data ?? []);
    } catch { setError('Failed to load folders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFolders(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Folder name is required'); return; }
    setCreating(true);
    try {
      const res  = await fetch('/api/folders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), description: desc.trim(), color }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Folder created');
        setFolders((prev) => [json.data, ...prev]);
        setShowCreate(false); setName(''); setDesc(''); setColor('indigo');
      } else {
        toast.error(json.error ?? 'Failed to create folder');
      }
    } catch { toast.error('Failed to create folder'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (folderId: string) => {
    if (!window.confirm('Delete this folder? Documents inside will be moved to root.')) return;
    try {
      const res  = await fetch(`/api/folders?id=${folderId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Folder deleted');
        setFolders((prev) => prev.filter((f) => f._id !== folderId));
        if (selected === folderId) setSelected(null);
      } else {
        toast.error(json.error ?? 'Delete failed');
      }
    } catch { toast.error('Failed to delete folder'); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Folders</h1>
          <p className="text-slate-500 text-sm mt-1">Organize your documents into folders for easier management.</p>
        </div>
        <button
          id="create-folder-btn"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          New Folder
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Create Folder</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="folder-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Legal Documents"
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <input
                  id="folder-desc"
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      id={`color-${c}`}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        c === 'indigo' ? 'bg-indigo-500' :
                        c === 'violet' ? 'bg-violet-500' :
                        c === 'sky'    ? 'bg-sky-500'    :
                        c === 'emerald'? 'bg-emerald-500':
                        c === 'amber'  ? 'bg-amber-400'  : 'bg-rose-500'
                      } ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="folder-create-submit"
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <FolderOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No folders yet</h3>
          <p className="text-sm text-slate-400 mb-6">Create your first folder to organise your documents.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Create Folder
          </button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {folders.map((folder, i) => (
              <div key={folder._id} className="group">
                <FolderCard
                  folder={folder}
                  isSelected={selected === folder._id}
                  onClick={(f) => setSelected(selected === f._id ? null : f._id)}
                  onDelete={handleDelete}
                  delay={i * 0.04}
                />
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Stats */}
      {!loading && folders.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Folder className="w-3.5 h-3.5" />
          {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
