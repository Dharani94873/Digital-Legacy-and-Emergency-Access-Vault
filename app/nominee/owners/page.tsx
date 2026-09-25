'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Clock, Folder, FileText, Calendar, Loader2, KeyRound, CheckCircle2, X,
} from 'lucide-react';
import { toast } from 'sonner';

interface OwnerNomination {
  nomineeRecordId: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerAvatarUrl?: string | null;
  waitingPeriodDays: number;
  allowedFolderIds: string[];
  allowedDocumentIds: string[];
  acceptedAt?: string | null;
}

export default function NomineeOwnersPage() {
  const [owners,      setOwners]      = useState<OwnerNomination[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showRedeem,  setShowRedeem]  = useState(false);
  const [secretCode,  setSecretCode]  = useState('');
  const [redeeming,   setRedeeming]   = useState(false);

  useEffect(() => {
    fetch('/api/nominees/owners')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setOwners(json.data ?? []);
        } else {
          toast.error(json.error ?? 'Failed to load owners');
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Network error loading owners');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async () => {
    const code = secretCode.trim().replace(/-/g, '').toUpperCase();
    if (code.length !== 8) {
      toast.error('Secret code must be 8 characters (format: XXXX-XXXX)');
      return;
    }
    setRedeeming(true);
    try {
      const res  = await fetch('/api/nominees/redeem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ secretCode: code }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error ?? 'Failed to redeem code');
        return;
      }
      toast.success('You are now linked as an active nominee!');
      setShowRedeem(false);
      setSecretCode('');
      // Reload the owners list
      const r2 = await fetch('/api/nominees/owners');
      const j2 = await r2.json();
      if (j2.success) setOwners(j2.data ?? []);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Owners</h1>
          <p className="text-slate-500 text-sm mt-1">
            Vault owners who have designated you as a trusted emergency contact
          </p>
        </div>
        <button
          onClick={() => setShowRedeem(true)}
          className="vault-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm text-sm"
        >
          <KeyRound className="w-4 h-4" /> Enter Secret Code
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
        <KeyRound className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          If a vault owner has added you as a nominee, they will share a <strong>secret code</strong> with you.
          Click <strong>&quot;Enter Secret Code&quot;</strong> above to link yourself to their vault.
        </p>
      </div>

      {/* Enter Secret Code Modal */}
      <AnimatePresence>
        {showRedeem && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRedeem(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Enter Secret Code</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Enter the 8-character code shared by the vault owner</p>
                </div>
                <button onClick={() => setShowRedeem(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Secret Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={secretCode}
                    onChange={(e) => {
                      // Auto-format: insert dash after 4 chars
                      let val = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
                      if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                      setSecretCode(val);
                    }}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-base font-mono font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Your username must match what the owner entered. Make sure you&apos;re logged in with the correct account.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRedeem(false); setSecretCode(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={redeeming || secretCode.replace(/-/g, '').length !== 8}
                  className="flex-1 vault-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {redeeming
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Linking…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Link to Vault</>
                  }
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Owners list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-100 p-6 animate-pulse space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : owners.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl p-12 border border-slate-100 shadow-sm"
        >
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 text-lg">No designations yet</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            Ask a vault owner to add you as a nominee. They will give you a secret code to enter above.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {owners.map((owner, i) => (
            <motion.div
              key={owner.nomineeRecordId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                    {owner.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate">{owner.ownerName}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{owner.ownerEmail}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 my-5 py-3.5 px-4 bg-slate-50 rounded-xl text-center">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Wait Period</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {owner.waitingPeriodDays}d
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Folders</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-sky-500" />
                      {owner.allowedFolderIds.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Files</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      {owner.allowedDocumentIds.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Linked {owner.acceptedAt ? new Date(owner.acceptedAt).toLocaleDateString() : '—'}
                </span>
                <span className="bg-emerald-50 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Active
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
