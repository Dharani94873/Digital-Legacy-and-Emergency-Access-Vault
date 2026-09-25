'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, User, Clock, Loader2, Trash2, Copy, Check, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const WAITING_PERIODS = [7, 15, 30, 60, 90, 180, 365] as const;

interface Nominee {
  _id: string;
  nomineeUsername?: string;
  nomineeName?: string | null;
  status: 'pending' | 'active' | 'revoked';
  waitingPeriodDays: number;
  allowedFolderIds?: string[];
  allowedDocumentIds?: string[];
  secretCode?: string;
  invitedAt?: string;
  acceptedAt?: string;
}

function safeFormatDistance(dateStr?: string | Date | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return null;
  }
}

const StatusBadge = ({ status }: { status?: Nominee['status'] }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Awaiting Nominee', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    active:  { label: 'Active',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    revoked: { label: 'Revoked',          cls: 'bg-red-50 text-red-600 border-red-200' },
  };
  const badge = (status && map[status]) || { label: status ?? 'Pending', cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>;
};

function SecretCodeDisplay({ code, nomineeId }: { code?: string; nomineeId: string }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Secret code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Format as XXXX-XXXX if 8 chars, otherwise display as-is
  const formatted = code.length >= 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
        <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
        <code className="text-sm font-mono font-bold text-indigo-700 tracking-widest">{formatted}</code>
      </div>
      <button
        onClick={handleCopy}
        title="Copy secret code"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function NomineesPage() {
  const [nominees,         setNominees]         = useState<Nominee[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [showAdd,          setShowAdd]          = useState(false);
  const [nomineeUsername,  setNomineeUsername]  = useState('');
  const [waitingDays,      setWaitingDays]      = useState<number>(30);
  const [adding,           setAdding]           = useState(false);
  const [newCode,          setNewCode]          = useState<string | null>(null);

  const fetchNominees = async () => {
    const r = await fetch('/api/nominees');
    const j = await r.json();
    if (j.success) setNominees(j.data);
  };

  useEffect(() => {
    fetchNominees()
      .catch(() => toast.error('Failed to load nominees'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!nomineeUsername.trim()) { toast.error('Enter a username'); return; }
    const usernameClean = nomineeUsername.trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(usernameClean)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }
    setAdding(true);
    try {
      const res  = await fetch('/api/nominees', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nomineeUsername: usernameClean, waitingPeriodDays: waitingDays }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to add nominee'); return; }

      // Show the generated secret code to the owner
      setNewCode(json.data.secretCode);
      setNomineeUsername('');
      await fetchNominees();
    } catch { toast.error('Something went wrong'); }
    finally { setAdding(false); }
  };

  const handleRevoke = async (id: string, username: string) => {
    if (!confirm(`Revoke access for @${username}?`)) return;
    try {
      const res  = await fetch(`/api/nominees?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to revoke'); return; }
      setNominees((prev) => prev.map((n) => n._id === id ? { ...n, status: 'revoked' } : n));
      toast.success('Access revoked');
    } catch { toast.error('Failed to revoke'); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nominees</h1>
          <p className="text-slate-500 text-sm mt-1">Trusted people who can request emergency access</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setNewCode(null); }}
          className="vault-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Add Nominee
        </button>
      </div>

      {/* How it works banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-700">
          <p className="font-semibold mb-0.5">How nominees work</p>
          <p className="text-indigo-600 leading-relaxed">
            Enter a nominee&apos;s username → you&apos;ll receive a <strong>secret code</strong>. Share it with them directly (e.g., in person or via a message). They enter it in their <strong>Nominee Dashboard → Enter Secret Code</strong> to link themselves to your vault.
          </p>
        </div>
      </div>

      {/* Add Nominee Modal */}
      <AnimatePresence>
        {showAdd && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { if (!newCode) setShowAdd(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {!newCode ? (
                <>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Add a Nominee</h2>
                  <p className="text-sm text-slate-500 mb-6">Enter their username. A secret code will be generated for you to share with them.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nominee&apos;s username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                        <input
                          type="text"
                          value={nomineeUsername}
                          onChange={(e) => setNomineeUsername(e.target.value.toLowerCase())}
                          placeholder="e.g. john_doe"
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">The nominee must already have an account with this exact username.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Waiting period before auto-approval
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {WAITING_PERIODS.map((d) => (
                          <button key={d} onClick={() => setWaitingDays(d)}
                            className={`py-2 rounded-xl text-sm font-medium transition-colors border ${
                              waitingDays === d
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                            }`}
                          >{d}d</button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        If you don&apos;t respond within {waitingDays} days, access is granted automatically
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowAdd(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleAdd} disabled={adding}
                      className="flex-1 vault-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm">
                      {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate Secret Code'}
                    </button>
                  </div>
                </>
              ) : (
                /* Secret code reveal */
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Secret Code Generated!</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Share this code with <strong>@{nominees.find(n => n.secretCode === newCode)?.nomineeUsername ?? nomineeUsername}</strong>. They enter it in their Nominee Dashboard to link themselves.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-6">
                    <p className="text-xs text-indigo-500 font-medium mb-2 uppercase tracking-wider">Secret Code</p>
                    <code className="text-3xl font-mono font-black text-indigo-700 tracking-[0.25em]">
                      {newCode.slice(0, 4)}-{newCode.slice(4)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newCode);
                        toast.success('Code copied!');
                      }}
                      className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium mx-auto"
                    >
                      <Copy className="w-4 h-4" /> Copy Code
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-6">
                    ⚠️ This code never expires. You can always view it in the nominees list below.
                  </p>
                  <button
                    onClick={() => { setShowAdd(false); setNewCode(null); }}
                    className="w-full vault-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nominees List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}</div>
      ) : nominees.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No nominees yet</h3>
          <p className="text-slate-400 text-sm">Add someone you trust as your emergency nominee.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nominees.map((n, i) => (
            <motion.div key={n._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">
                        {n.nomineeName ?? (n.nomineeUsername ? `@${n.nomineeUsername}` : 'Nominee')}
                      </p>
                      <StatusBadge status={n.status} />
                    </div>
                    {n.nomineeUsername && (
                      <p className="text-xs text-slate-400 mt-0.5">@{n.nomineeUsername}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {n.waitingPeriodDays ?? 30} days waiting</span>
                      {safeFormatDistance(n.invitedAt) && <span>Added {safeFormatDistance(n.invitedAt)}</span>}
                      {n.acceptedAt && safeFormatDistance(n.acceptedAt) && (
                        <span className="text-emerald-600">Accepted {safeFormatDistance(n.acceptedAt)}</span>
                      )}
                    </div>
                    {/* Show secret code for pending nominees */}
                    {n.status === 'pending' && n.secretCode && (
                      <SecretCodeDisplay code={n.secretCode} nomineeId={n._id} />
                    )}
                  </div>
                </div>
                {n.status !== 'revoked' && (
                  <button onClick={() => handleRevoke(n._id, n.nomineeUsername ?? 'nominee')}
                    className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
