'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Clock, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface Request {
  _id: string;
  nomineeId: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  reason: string;
  requestedAt: string;
  resolvedAt?: string;
  autoApprovalScheduledAt: string;
}

const STATUS_CONFIG = {
  pending:       { label: 'Pending',       cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock        },
  approved:      { label: 'Approved',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  rejected:      { label: 'Rejected',      cls: 'bg-red-50 text-red-600 border-red-200',         icon: XCircle      },
  'auto-approved': { label: 'Auto-Approved', cls: 'bg-blue-50 text-blue-700 border-blue-200',    icon: CheckCircle  },
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<string>('all');
  const [acting,   setActing]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/emergency/request')
      .then((r) => r.json())
      .then((j) => { if (j.success) setRequests(j.data); })
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      const res  = await fetch(`/api/emergency/${id}/${action}`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Action failed'); return; }
      toast.success(`Request ${action}d successfully`);
      setRequests((prev) =>
        prev.map((r) => r._id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected', resolvedAt: new Date().toISOString() } : r),
      );
    } catch { toast.error('Action failed'); }
    finally { setActing(null); }
  };

  const tabs = ['all', 'pending', 'approved', 'rejected', 'auto-approved'];
  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emergency Requests</h1>
        <p className="text-slate-500 text-sm mt-1">Manage nominee emergency access requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors rounded-t-lg ${
              filter === tab ? 'text-indigo-700 border-b-2 border-indigo-600 -mb-px' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {tab}
            <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
              {tab === 'all' ? requests.length : requests.filter((r) => r.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => {
            const cfg      = STATUS_CONFIG[req.status];
            const Icon     = cfg.icon;
            const autoDate = new Date(req.autoApprovalScheduledAt);
            const isPending = req.status === 'pending';
            return (
              <motion.div key={req._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">Emergency Access Request</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls} flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{req.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>Requested {formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}</span>
                        {isPending && (
                          <span className={`font-medium ${isPast(autoDate) ? 'text-red-500' : 'text-amber-600'}`}>
                            Auto-approves {format(autoDate, 'MMM d, yyyy')}
                          </span>
                        )}
                        {req.resolvedAt && <span>Resolved {formatDistanceToNow(new Date(req.resolvedAt), { addSuffix: true })}</span>}
                      </div>
                    </div>
                  </div>
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleAction(req._id, 'reject')} disabled={acting === req._id}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {acting === req._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                      <button onClick={() => handleAction(req._id, 'approve')} disabled={acting === req._id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {acting === req._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
