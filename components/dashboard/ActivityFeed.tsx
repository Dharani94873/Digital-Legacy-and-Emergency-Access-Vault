'use client';

import { motion } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { IAuditLog } from '@/types';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'document.upload':   { label: 'Uploaded document',   color: 'bg-indigo-500' },
  'document.download': { label: 'Downloaded document',  color: 'bg-sky-500' },
  'document.delete':   { label: 'Deleted document',     color: 'bg-red-400' },
  'document.verify':   { label: 'Verified document',    color: 'bg-emerald-500' },
  'nominee.invite':    { label: 'Invited nominee',      color: 'bg-violet-500' },
  'nominee.revoke':    { label: 'Revoked nominee',      color: 'bg-orange-500' },
  'emergency.request': { label: 'Emergency requested',  color: 'bg-amber-500' },
  'emergency.approve': { label: 'Approved request',     color: 'bg-emerald-500' },
  'emergency.reject':  { label: 'Rejected request',     color: 'bg-red-500' },
  'auth.login':        { label: 'Signed in',            color: 'bg-slate-400' },
};

interface ActivityFeedProps {
  activities: IAuditLog[];
  delay?: number;
  viewAllHref?: string;
}

export function ActivityFeed({ activities, delay = 0, viewAllHref = '/owner/audit-logs' }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        <a
          href={viewAllHref}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          View all →
        </a>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Activity className="w-10 h-10 mb-3 text-slate-200" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((log, i) => {
            const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-slate-400' };
            const filename = (log.metadata as { filename?: string } | undefined)?.filename;

            return (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + i * 0.04 }}
                className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium leading-snug">{meta.label}</p>
                  {filename && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{filename}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
