'use client';

import { useState, useEffect } from 'react';
import { Activity, Search, Loader2, AlertCircle, Shield, FileText, UserCheck, RefreshCw, Box } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  _id: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  'auth.login': Shield,
  'document.upload': FileText,
  'document.delete': AlertCircle,
  'emergency.request': AlertCircle,
  'emergency.approve': UserCheck,
  'emergency.auto-approve': RefreshCw,
};

const ACTION_COLORS: Record<string, string> = {
  'auth.login': 'bg-indigo-100 text-indigo-600',
  'document.upload': 'bg-emerald-100 text-emerald-600',
  'document.delete': 'bg-red-100 text-red-600',
  'emergency.request': 'bg-amber-100 text-amber-600',
  'emergency.approve': 'bg-blue-100 text-blue-600',
  'emergency.auto-approve': 'bg-violet-100 text-violet-600',
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAction, setSearchAction] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadLogs = async (p = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      const q = new URLSearchParams({ page: p.toString(), limit: '50' });
      if (searchAction) q.set('action', searchAction);

      const res = await fetch(`/api/admin/logs?${q.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        setLogs(prev => append ? [...prev, ...json.data.items] : json.data.items);
        setHasMore(json.data.hasMore);
        setPage(p);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchAction]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Platform-wide audit trail and security events.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action (e.g. document.upload)..."
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !logs.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p>No audit logs found.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] ?? Box;
                  const color = ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600';
                  
                  return (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                            {log.actorRole}
                          </span>
                          <span className="text-slate-600 font-mono text-xs truncate max-w-[120px]" title={log.actorId}>
                            {log.actorId.slice(-6)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900">{log.resourceType}</span>
                          {log.resourceId && (
                            <span className="text-slate-400 font-mono text-xs" title={log.resourceId}>
                              #{log.resourceId.slice(-6)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="p-4 border-t border-slate-100 text-center">
            <button
              onClick={() => loadLogs(page + 1, true)}
              disabled={loading}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Logs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
