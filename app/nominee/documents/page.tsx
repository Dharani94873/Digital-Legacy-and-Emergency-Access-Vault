'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, ShieldCheck, HelpCircle,
  Search, ExternalLink, Calendar, User, Info,
  Loader2, CheckCircle2, AlertCircle, X,
} from 'lucide-react';
import { toast } from 'sonner';

interface AccessibleDocument {
  _id: string;
  title: string;
  description?: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  cloudinaryUrl: string;
  sha256Hash: string;
  blockchainTxHash?: string;
  blockchainVerified: boolean;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
}

interface VerificationResult {
  isVerified: boolean;
  sha256Hash: string;
  onChainHash: string | null;
  txHash: string | null;
  blockNumber: number | null;
  registeredAt: string | null;
  polygonscanUrl: string | null;
}

export default function NomineeDocumentsPage() {
  const [documents, setDocuments] = useState<AccessibleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    fetch('/api/nominees/documents')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDocuments(json.data ?? []);
        } else {
          toast.error(json.error ?? 'Failed to load documents');
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Network error loading documents');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (docId: string, filename: string) => {
    toast.info(`Decrypting and downloading ${filename}...`);
    // Direct link trigger for file stream download
    window.location.href = `/api/documents/${docId}/download`;
  };

  const handleVerify = async (docId: string) => {
    setVerifyingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/verify`);
      const json = await res.json();
      if (json.success) {
        setVerifyResult(json.data);
        setShowVerifyModal(true);
      } else {
        toast.error(json.error ?? 'Verification failed');
      }
    } catch {
      toast.error('Integrity check failed due to network error');
    } finally {
      setVerifyingId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filtered = documents.filter((doc) => {
    const term = search.toLowerCase();
    return (
      doc.title.toLowerCase().includes(term) ||
      doc.originalFilename.toLowerCase().includes(term) ||
      doc.ownerName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accessible Documents</h1>
          <p className="text-slate-500 text-sm mt-1">
            Documents you have been authorized to access under approved emergency conditions
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white border border-slate-100 p-4 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
              <div className="h-10 w-24 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl p-12 border border-slate-100 shadow-sm"
        >
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 text-lg">No documents accessible</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Documents will display here once an owner adds you as a nominee, you submit an emergency request, and the waiting period expires or the request is approved.
          </p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((doc, idx) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-sm">{doc.title}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{doc.originalFilename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{doc.ownerName}</span>
                        <span className="text-xs text-slate-400">{doc.ownerEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatSize(doc.sizeBytes)}</td>
                    <td className="px-6 py-4">
                      {doc.blockchainVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5" /> Blockchain Stamped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Pending Check
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleVerify(doc._id)}
                          disabled={verifyingId !== null}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Verify On-Chain Integrity"
                        >
                          {verifyingId === doc._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(doc._id, doc.originalFilename)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" /> Decrypt &amp; Save
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blockchain Verification Dialog */}
      <AnimatePresence>
        {showVerifyModal && verifyResult && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowVerifyModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVerifyModal(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cryptographic Integrity Verified</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Document matching verified against Polygon blockchain logs
                </p>
              </div>

              <div className="space-y-3.5 bg-slate-50 rounded-2xl p-5 text-xs text-slate-600 border border-slate-100">
                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-400">Status</span>
                  <span className="col-span-2 text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Matched &amp; Untampered
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-400">SHA-256 Hash</span>
                  <span className="col-span-2 font-mono break-all text-slate-800">{verifyResult.sha256Hash}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-400">On-Chain Hash</span>
                  <span className="col-span-2 font-mono break-all text-slate-800">{verifyResult.onChainHash || 'None'}</span>
                </div>

                {verifyResult.txHash && (
                  <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-400">Transaction Hash</span>
                    <span className="col-span-2 font-mono break-all text-slate-800">{verifyResult.txHash}</span>
                  </div>
                )}

                {verifyResult.blockNumber && (
                  <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-400">Block Number</span>
                    <span className="col-span-2 font-medium text-slate-800">{verifyResult.blockNumber}</span>
                  </div>
                )}

                {verifyResult.registeredAt && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-400">Timestamp</span>
                    <span className="col-span-2 text-slate-800">
                      {new Date(verifyResult.registeredAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {verifyResult.polygonscanUrl && (
                <a
                  href={verifyResult.polygonscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-sm transition-all border border-indigo-150"
                >
                  View on Polygonscan Amoy <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
