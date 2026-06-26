'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Clock, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface Request {
  _id: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  reason: string;
  requestedAt: string;
  resolvedAt?: string;
  autoApprovalScheduledAt: string;
}

const STATUS_CONFIG = {
  pending:         { label: 'Pending',       cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock        },
  approved:        { label: 'Approved',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  rejected:        { label: 'Rejected',      cls: 'bg-red-50 text-red-600 border-red-200',         icon: XCircle      },
  'auto-approved': { label: 'Auto-Approved', cls: 'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle  },
};

export default function NomineeRequestsPage() {
  const [requests,   setRequests]   = useState<Request[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showNew,    setShowNew]    = useState(false);
  const [ownerId,    setOwnerId]    = useState('');
  const [reason,     setReason]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/emergency/request')
      .then((r) => r.json())
      .then((j) => { if (j.success) setRequests(j.data); })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!ownerId.trim() || reason.length < 10) { toast.error('Please fill all fields (reason min 10 chars)'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch('/api/emergency/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ownerId: ownerId.trim(), reason }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Request failed'); return; }
      toast.success('Emergency access request submitted. The owner has been notified.');
      setShowNew(false); setOwnerId(''); setReason('');
      setRequests((prev) => [json.data, ...prev]);
    } catch { toast.error('Submission failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emergency Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Submit and track emergency access requests</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm text-sm">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Submit Emergency Request</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Owner ID</label>
                <input type="text" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} placeholder="MongoDB ObjectId of the owner"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for access</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
                  placeholder="Please explain why you need emergency access..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                <p className="text-xs text-slate-400 mt-1">{reason.length}/1000 characters (min 10)</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-xl hover:bg-sky-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 text-sm">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No emergency requests yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const cfg = STATUS_CONFIG[req.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div key={req._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{req.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span>Requested {formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}</span>
                      {req.status === 'pending' && (
                        <span className="text-amber-600 font-medium">
                          Auto-approves {format(new Date(req.autoApprovalScheduledAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
