'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, Loader2, AlertCircle, CheckCircle2, FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { IFolder } from '@/types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folders: IFolder[];
}

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};

const MAX_SIZE_MB = 25;

export function DocumentUploadModal({ isOpen, onClose, onSuccess, folders }: DocumentUploadModalProps) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const [file,    setFile]    = useState<File | null>(null);
  const [title,   setTitle]   = useState('');
  const [desc,    setDesc]    = useState('');
  const [folder,  setFolder]  = useState('');
  const [tags,    setTags]    = useState('');
  const [drag,    setDrag]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => {
    setFile(null); setTitle(''); setDesc(''); setFolder(''); setTags('');
    setError(''); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES[f.type]) return `Unsupported file type. Allowed: ${Object.values(ACCEPTED_TYPES).join(', ')}`;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    const err = validateFile(dropped);
    if (err) { setError(err); return; }
    setFile(dropped);
    if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ''));
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) { setError(err); return; }
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    if (!title.trim()) { setError('Document title is required.'); return; }

    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', desc.trim());
      if (folder) formData.append('folderId', folder);
      if (tags) formData.append('tags', tags.split(',').map((t) => t.trim()).filter(Boolean).join(','));

      const res  = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (!json.success) { setError(json.error ?? 'Upload failed'); return; }

      toast.success('Document uploaded and encrypted successfully!');
      handleClose();
      onSuccess();
    } catch {
      setError('An error occurred during upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Upload Document</h2>
                <p className="text-sm text-slate-500 mt-0.5">Files are encrypted with AES-256-GCM</p>
              </div>
              <button
                id="upload-modal-close"
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Drop Zone */}
              <div
                onDragEnter={() => setDrag(true)}
                onDragLeave={() => setDrag(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  drag ? 'border-indigo-500 bg-indigo-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileRef}
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept={Object.keys(ACCEPTED_TYPES).join(',')}
                  onChange={handleFileSelect}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800 text-sm truncate max-w-[280px]">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · {ACCEPTED_TYPES[file.type]}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Drop your file here or click to browse</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPEG, PNG, DOCX, XLSX — max {MAX_SIZE_MB} MB</p>
                  </>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Life Insurance Policy"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  id="doc-desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional notes about this document"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Folder */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <FolderOpen className="inline w-4 h-4 mr-1 text-slate-400" />
                  Folder (optional)
                </label>
                <select
                  id="doc-folder"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">No folder (root)</option>
                  {folders.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags</label>
                <input
                  id="doc-tags"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="insurance, urgent, legal (comma separated)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Encryption notice */}
              <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-xl">
                <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700">
                  This document will be encrypted with AES-256-GCM before upload, and its SHA-256 hash will be registered on the Polygon blockchain.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="upload-submit"
                  type="submit"
                  disabled={loading || !file}
                  className="flex-1 vault-gradient text-white font-semibold py-2.5 rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting & Uploading…</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload Document</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
