'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, FileText, Folder, Loader2, CheckSquare, Square } from 'lucide-react';
import { INominee, IDocument, IFolder } from '@/types';
import { toast } from 'sonner';

interface PermissionsPanelProps {
  nominee: INominee;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PermissionsPanel({ nominee, isOpen, onClose, onSaved }: PermissionsPanelProps) {
  const [documents,     setDocuments]     = useState<IDocument[]>([]);
  const [folders,       setFolders]       = useState<IFolder[]>([]);
  const [selDocs,       setSelDocs]       = useState<Set<string>>(new Set(nominee.allowedDocumentIds));
  const [selFolders,    setSelFolders]    = useState<Set<string>>(new Set(nominee.allowedFolderIds));
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [waitingPeriod, setWaitingPeriod] = useState<number>(nominee.waitingPeriodDays);

  useEffect(() => {
    if (!isOpen) return;
    setSelDocs(new Set(nominee.allowedDocumentIds));
    setSelFolders(new Set(nominee.allowedFolderIds));
    setWaitingPeriod(nominee.waitingPeriodDays);

    const load = async () => {
      setLoading(true);
      try {
        const [docsRes, foldersRes] = await Promise.all([
          fetch('/api/documents'),
          fetch('/api/folders'),
        ]);
        const [docsJson, foldersJson] = await Promise.all([docsRes.json(), foldersRes.json()]);
        if (docsJson.success)    setDocuments(docsJson.data?.items ?? []);
        if (foldersJson.success) setFolders(foldersJson.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, nominee]);

  const toggleDoc    = (id: string) => setSelDocs(s    => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleFolder = (id: string) => setSelFolders(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`/api/nominees/${nominee._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          allowedDocumentIds: Array.from(selDocs),
          allowedFolderIds:   Array.from(selFolders),
          waitingPeriodDays:  waitingPeriod,
        }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to save'); return; }
      toast.success('Permissions updated successfully');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900">Manage Permissions</h2>
                <p className="text-sm text-slate-500 truncate max-w-[240px]">{nominee.nomineeEmail}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Waiting Period */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      Waiting Period Before Auto-Approval
                    </h3>
                    <select
                      id="waiting-period"
                      value={waitingPeriod}
                      onChange={(e) => setWaitingPeriod(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[7, 15, 30, 60, 90, 180, 365].map((d) => (
                        <option key={d} value={d}>{d} days</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1.5">
                      After an emergency request, access will be auto-granted if you don&apos;t respond within this period.
                    </p>
                  </div>

                  {/* Folders */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      Accessible Folders ({selFolders.size} selected)
                    </h3>
                    {folders.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No folders created yet</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {folders.map((f) => (
                          <label
                            key={f._id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => toggleFolder(f._id)}
                              className="flex-shrink-0 text-indigo-600"
                            >
                              {selFolders.has(f._id)
                                ? <CheckSquare className="w-5 h-5" />
                                : <Square className="w-5 h-5 text-slate-300" />}
                            </button>
                            <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm text-slate-700 truncate">{f.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Accessible Documents ({selDocs.size} selected)
                    </h3>
                    {documents.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No documents uploaded yet</p>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {documents.map((d) => (
                          <label
                            key={d._id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => toggleDoc(d._id)}
                              className="flex-shrink-0 text-indigo-600"
                            >
                              {selDocs.has(d._id)
                                ? <CheckSquare className="w-5 h-5" />
                                : <Square className="w-5 h-5 text-slate-300" />}
                            </button>
                            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-slate-700 truncate">{d.title}</p>
                              <p className="text-xs text-slate-400 truncate">{d.originalFilename}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-permissions"
                onClick={handleSave}
                disabled={saving || loading}
                className="flex-1 vault-gradient text-white font-semibold py-2.5 rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Permissions'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
