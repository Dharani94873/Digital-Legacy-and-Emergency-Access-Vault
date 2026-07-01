'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Upload, Shield, ShieldCheck, ShieldAlert, ExternalLink, Loader2, AlertCircle, Hash } from 'lucide-react';
import { toast } from 'sonner';

type VerifyResult = {
  verified: boolean;
  documentId?: string;
  title?: string;
  txHash?: string;
  blockNumber?: number;
  registeredAt?: string;
};

export function HashVerifier() {
  const [hash,    setHash]    = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<VerifyResult | null>(null);
  const [error,   setError]   = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      const h = await computeHash(file);
      setHash(h);
      toast.info('SHA-256 hash computed — click Verify to check blockchain');
    } catch {
      setError('Could not compute file hash');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const h = await computeHash(file);
      setHash(h);
      toast.info('SHA-256 hash computed — click Verify to check blockchain');
    } catch {
      setError('Could not compute file hash');
    }
  };

  const handleVerify = async () => {
    const trimmed = hash.trim();
    if (!trimmed) { setError('Please enter a SHA-256 hash or drop a file'); return; }
    if (!/^[a-f0-9]{64}$/i.test(trimmed)) { setError('Invalid SHA-256 hash (must be 64 hex characters)'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res  = await fetch(`/api/blockchain/verify?hash=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.error ?? 'Verification failed');
      }
    } catch {
      setError('Failed to connect to verification service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">Drop any file to auto-compute its SHA-256 hash</p>
        <p className="text-xs text-slate-400 mt-1">or click to browse — file never leaves your browser</p>
      </div>

      {/* Manual hash input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="hash-input"
            type="text"
            value={hash}
            onChange={(e) => { setHash(e.target.value); setResult(null); setError(''); }}
            placeholder="Enter SHA-256 hash (64 hex chars)…"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          id="hash-verify-btn"
          onClick={handleVerify}
          disabled={loading || !hash.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Verify
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border p-5 ${
              result.verified
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                result.verified ? 'bg-emerald-500' : 'bg-amber-400'
              }`}>
                {result.verified
                  ? <ShieldCheck className="w-5 h-5 text-white" />
                  : <ShieldAlert className="w-5 h-5 text-white" />
                }
              </div>
              <div>
                <p className={`font-semibold text-sm ${result.verified ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {result.verified ? 'Document Verified on Blockchain' : 'Hash Not Found on Blockchain'}
                </p>
                <p className={`text-xs mt-0.5 ${result.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {result.verified
                    ? 'This document\'s integrity is guaranteed by the Polygon Amoy network'
                    : 'This hash has no matching record in the registry contract'}
                </p>
              </div>
            </div>

            {result.verified && (
              <div className="space-y-2 text-xs">
                {result.title && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Document</span>
                    <span className="text-emerald-900">{result.title}</span>
                  </div>
                )}
                {result.txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-700 font-medium">TX Hash</span>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-600 hover:underline font-mono"
                    >
                      {result.txHash.slice(0, 10)}…{result.txHash.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {result.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Block</span>
                    <span className="text-emerald-900">#{result.blockNumber.toLocaleString()}</span>
                  </div>
                )}
                {result.registeredAt && (
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Registered</span>
                    <span className="text-emerald-900">{new Date(result.registeredAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      {!result && !error && (
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
          <Shield className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">
            Drop any file or paste its SHA-256 hash to check if it has been registered on the Polygon Amoy blockchain. Your file is never uploaded — the hash is computed locally in your browser.
          </p>
        </div>
      )}
    </div>
  );
}
