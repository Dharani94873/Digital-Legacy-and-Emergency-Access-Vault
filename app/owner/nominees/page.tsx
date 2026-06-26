'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Mail, Clock, Shield, ShieldOff, Loader2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const WAITING_PERIODS = [7, 15, 30, 60, 90, 180, 365] as const;

interface Nominee {
  _id: string;
  nomineeEmail: string;
  nomineeName: string | null;
  status: 'pending' | 'active' | 'revoked';
  waitingPeriodDays: number;
  allowedFolderIds: string[];
  allowedDocumentIds: string[];
  invitedAt: string;
  acceptedAt?: string;
}

const StatusBadge = ({ status }: { status: Nominee['status'] }) => {
  const map = {
    pending: { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    active:  { label: 'Active',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    revoked: { label: 'Revoked',  cls: 'bg-red-50 text-red-600 border-red-200' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
};

export default function NomineesPage() {
  const [nominees,   setNominees]   = useState<Nominee[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [waitingDays, setWaitingDays] = useState<number>(30);
  const [inviting,   setInviting]   = useState(false);

  useEffect(() => {
    fetch('/api/nominees')
      .then((r) => r.json())
      .then((j) => { if (j.success) setNominees(j.data); })
      .catch(() => toast.error('Failed to load nominees'))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error('Enter an email address'); return; }
    setInviting(true);
    try {
      const res  = await fetch('/api/nominees', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: inviteEmail.trim(), waitingPeriodDays: waitingDays }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Invite failed'); return; }
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      // Refetch
      const r2 = await fetch('/api/nominees');
      const j2 = await r2.json();
      if (j2.success) setNominees(j2.data);
    } catch { toast.error('Something went wrong'); }
    finally { setInviting(false); }
  };

  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
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
          onClick={() => setShowInvite(true)}
          className="vault-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Invite Nominee
        </button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6">Invite a Nominee</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nominee@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
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
              <button onClick={() => setShowInvite(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleInvite} disabled={inviting}
                className="flex-1 vault-gradient text-white font-semibold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm">
                {inviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Invitation'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Nominees List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}</div>
      ) : nominees.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No nominees yet</h3>
          <p className="text-slate-400 text-sm">Invite someone you trust to be your emergency nominee.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nominees.map((n, i) => (
            <motion.div key={n._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 flex items-start justify-between hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{n.nomineeName ?? n.nomineeEmail}</p>
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{n.nomineeEmail}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {n.waitingPeriodDays} days waiting</span>
                    <span>Invited {formatDistanceToNow(new Date(n.invitedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              {n.status === 'active' && (
                <button onClick={() => handleRevoke(n._id, n.nomineeEmail)}
                  className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
