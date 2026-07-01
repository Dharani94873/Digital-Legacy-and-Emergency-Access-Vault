'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Trash2, Shield, ExternalLink, Tag,
  MoreVertical, FileImage, File, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { IDocument } from '@/types';
import { toast } from 'sonner';

interface DocumentCardProps {
  document: IDocument;
  onDeleted: () => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf')  return FileText;
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentCard({ document: doc, onDeleted }: DocumentCardProps) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [verified,    setVerified]    = useState<boolean | null>(null);
  const [verifying,   setVerifying]   = useState(false);

  const Icon = getFileIcon(doc.mimeType);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`/api/documents/${doc._id}/download`);
      if (!res.ok) { toast.error('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = window.document.createElement('a');
      a.href     = url;
      a.download = doc.originalFilename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
      setMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${doc.title}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/documents/${doc._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Delete failed'); return; }
      toast.success('Document deleted');
      onDeleted();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res  = await fetch(`/api/documents/${doc._id}/verify`);
      const json = await res.json();
      setVerified(json.success && json.data?.verified === true);
    } catch {
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate">{doc.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.originalFilename}</p>
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0">
            <button
              id={`doc-menu-${doc._id}`}
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-44 text-sm"
                  >
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-slate-400" />}
                      Download
                    </button>
                    <button
                      onClick={handleVerify}
                      disabled={verifying}
                      className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 text-slate-400" />}
                      Verify Hash
                    </button>
                    {doc.blockchainTxHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${doc.blockchainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                        View on Chain
                      </a>
                    )}
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description */}
        {doc.description && (
          <p className="text-xs text-slate-500 mt-3 leading-relaxed line-clamp-2">{doc.description}</p>
        )}

        {/* Tags */}
        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {doc.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Verify result banner */}
        <AnimatePresence>
          {verified !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                verified ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {verified
                ? <><CheckCircle2 className="w-3.5 h-3.5" /> Blockchain verified — hash matches</>
                : <><AlertTriangle className="w-3.5 h-3.5" /> Verification failed — hash mismatch</>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-1.5">
          {doc.blockchainVerified ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <Shield className="w-3 h-3" /> Blockchain
            </span>
          ) : (
            <span className="text-xs text-slate-400">Unverified</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{formatBytes(doc.sizeBytes)}</p>
          <p className="text-xs text-slate-300 mt-0.5" title={format(new Date(doc.createdAt), 'PPpp')}>
            {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
