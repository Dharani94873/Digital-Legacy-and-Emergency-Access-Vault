'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Log {
  _id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

const ACTION_LABELS: Record<string, string> = {
  'document.upload':   '📤 Uploaded document',
  'document.download': '📥 Downloaded document',
  'document.delete':   '🗑️ Deleted document',
  'document.verify':   '🔍 Verified document',
  'nominee.invite':    '📨 Invited nominee',
  'nominee.revoke':    '🚫 Revoked nominee',
  'emergency.approve': '✅ Approved emergency request',
  'emergency.reject':  '❌ Rejected emergency request',
  'emergency.auto-approve': '⏰ Auto-approved request',
};

export default function AuditLogsPage() {
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = async (p = 1) => {
    try {
      const res  = await fetch(`/api/audit?page=${p}&limit=20`);
      const json = await res.json();
      if (!json.success) { toast.error('Failed to load logs'); return; }
      if (p === 1) setLogs(json.data.items);
      else         setLogs((prev) => [...prev, ...json.data.items]);
      setHasMore(json.data.hasMore);
    } catch { toast.error('Failed to load logs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const filtered = logs.filter((l) =>
    (ACTION_LABELS[l.action] ?? l.action).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Complete history of all actions on your vault</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search actions…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Action</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Resource</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">IP</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-5 py-3"><div className="h-4 shimmer rounded" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">No audit logs found</td></tr>
            ) : (
              filtered.map((log) => (
                <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="px-5 py-3 text-slate-500 capitalize">{log.resourceType}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{log.ipAddress ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{format(new Date(log.timestamp), 'MMM d, yyyy · HH:mm')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {hasMore && (
          <div className="p-4 text-center border-t border-slate-100">
            <button onClick={() => { const next = page + 1; setPage(next); fetchLogs(next); }}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-700">Load more</button>
          </div>
        )}
      </div>
    </div>
  );
}
