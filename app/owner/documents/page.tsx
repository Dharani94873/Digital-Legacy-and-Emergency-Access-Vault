'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, File, Image, Trash2, Download, Shield,
  CheckCircle, AlertCircle, Search, Filter, Plus, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { formatBytes } from '@/lib/cn';

interface DocRecord {
  _id: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  blockchainVerified: boolean;
  createdAt: string;
  tags: string[];
}

const MIME_ICONS: Record<string, React.ElementType> = {
  'application/pdf':                     FileText,
  'application/msword':                  FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'image/png':  Image,
  'image/jpeg': Image,
  'image/jpg':  Image,
};

function DocumentCard({
  doc,
  onDelete,
  onDownload,
  onVerify,
}: {
  doc: DocRecord;
  onDelete: (id: string) => void;
  onDownload: (id: string, filename: string) => void;
  onVerify: (id: string) => void;
}) {
  const Icon = MIME_ICONS[doc.mimeType] ?? File;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate text-sm">{doc.title}</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{doc.originalFilename}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-400">{formatBytes(doc.sizeBytes)}</span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
            </span>
            {doc.blockchainVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Shield className="w-3 h-3" /> Verified
              </span>
            ) : (
              <button
                onClick={() => onVerify(doc._id)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Verify
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDownload(doc._id, doc.originalFilename)}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        <button
          onClick={() => onDelete(doc._id)}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const [docs,         setDocs]         = useState<DocRecord[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [showUpload,   setShowUpload]   = useState(false);
  const [uploadTitle,  setUploadTitle]  = useState('');
  const [uploadFile,   setUploadFile]   = useState<File | null>(null);
  const [fetched,      setFetched]      = useState(false);

  // Fetch docs on mount
  const fetchDocs = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/documents?limit=50`);
      const json = await res.json();
      if (json.success) setDocs(json.data.items ?? []);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); setFetched(true); }
  }, [fetched]);

  useState(() => { fetchDocs(); });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => { if (files[0]) { setUploadFile(files[0]); setUploadTitle(files[0].name.replace(/\.[^.]+$/, '')); }},
    accept: {
      'application/pdf':          ['.pdf'],
      'application/msword':       ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png':  ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) { toast.error('Please select a file and enter a title'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file',  uploadFile);
      form.append('title', uploadTitle.trim());
      const res  = await fetch('/api/documents/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Upload failed'); return; }
      toast.success('Document encrypted and uploaded!');
      setShowUpload(false);
      setUploadFile(null);
      setUploadTitle('');
      setFetched(false);
      fetchDocs();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/download`);
      if (!res.ok) { toast.error('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    try {
      const res  = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Delete failed'); return; }
      setDocs((prev) => prev.filter((d) => d._id !== id));
      toast.success('Document deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleVerify = async (id: string) => {
    const t = toast.loading('Verifying on blockchain…');
    try {
      const res  = await fetch(`/api/documents/${id}/verify`);
      const json = await res.json();
      toast.dismiss(t);
      if (json.data?.isVerified) {
        toast.success('✅ Document verified on Polygon Amoy blockchain');
        setDocs((prev) => prev.map((d) => d._id === id ? { ...d, blockchainVerified: true } : d));
      } else {
        toast.error('❌ Blockchain verification failed');
      }
    } catch { toast.dismiss(t); toast.error('Verification error'); }
  };

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.originalFilename.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Vault</h1>
          <p className="text-slate-500 text-sm mt-1">{docs.length} documents · All encrypted with AES-256-GCM</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="vault-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">Upload Document</h2>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Document title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Life Insurance Policy 2024"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <input {...getInputProps()} />
                {uploadFile ? (
                  <div>
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-800">{uploadFile.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatBytes(uploadFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop or click to select'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, PNG, JPG · Max 50MB</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                File will be encrypted with AES-256-GCM before upload
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUpload(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile}
                  className="flex-1 vault-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting…</> : 'Upload Securely'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No documents yet</h3>
          <p className="text-slate-400 text-sm">Upload your first encrypted document to get started.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onVerify={handleVerify}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
