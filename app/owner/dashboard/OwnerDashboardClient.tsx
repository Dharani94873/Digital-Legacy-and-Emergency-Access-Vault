'use client';

import { motion } from 'framer-motion';
import {
  FileText, Users, AlertTriangle, CheckCircle, XCircle,
  Shield, HardDrive, Activity, ExternalLink, Clock,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { OwnerDashboardStats, IAuditLog } from '@/types';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface Props {
  stats: OwnerDashboardStats;
  lastTxHash: string | null;
  userId: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k    = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i    = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const StatCard = ({
  title, value, icon: Icon, color, subtitle, delay = 0,
}: {
  title: string; value: string | number; icon: React.ElementType;
  color: string; subtitle?: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const ACTION_LABELS: Record<string, string> = {
  'document.upload':   'Uploaded document',
  'document.download': 'Downloaded document',
  'document.delete':   'Deleted document',
  'document.verify':   'Verified document',
  'nominee.invite':    'Invited nominee',
  'nominee.revoke':    'Revoked nominee',
  'emergency.approve': 'Approved request',
  'emergency.reject':  'Rejected request',
};

export default function OwnerDashboardClient({ stats, lastTxHash, userId }: Props) {
  const storageGB      = stats.totalStorageBytes / (1024 * 1024 * 1024);
  const storagePct     = Math.min(100, Math.round((storageGB / 10) * 100)); // assume 10GB quota

  const requestData = [
    { name: 'Approved',  value: stats.approvedRequests,  color: '#10b981' },
    { name: 'Rejected',  value: stats.rejectedRequests,  color: '#ef4444' },
    { name: 'Pending',   value: stats.pendingRequests,   color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Documents"   value={stats.totalDocuments}        icon={FileText}      color="bg-indigo-500"  delay={0.05} />
        <StatCard title="Storage Used"      value={formatBytes(stats.totalStorageBytes)} icon={HardDrive} color="bg-violet-500"  delay={0.1}  />
        <StatCard title="Active Nominees"   value={`${stats.activeNominees}/${stats.totalNominees}`} icon={Users} color="bg-sky-500" delay={0.15} />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={AlertTriangle}
          color={stats.pendingRequests > 0 ? 'bg-amber-500' : 'bg-slate-400'}
          delay={0.2}
          subtitle={stats.pendingRequests > 0 ? 'Requires your attention' : 'All clear'}
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Storage Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-4">Storage Usage</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="90%" startAngle={90} endAngle={-270} data={[{ value: storagePct }]}>
                  <RadialBar dataKey="value" fill="#6366f1" background={{ fill: '#e0e7ff' }} cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">{storagePct}%</span>
                <span className="text-xs text-slate-400">used</span>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Used</span><span className="font-medium">{formatBytes(stats.totalStorageBytes)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Limit</span><span>10 GB</span>
            </div>
          </div>
        </motion.div>

        {/* Request Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-4">Request Status</h3>
          {requestData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={requestData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                      {requestData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {requestData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <CheckCircle className="w-10 h-10 mb-2 text-emerald-300" />
              <p className="text-sm">No requests yet</p>
            </div>
          )}
        </motion.div>

        {/* Blockchain Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-4">Blockchain Status</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">Polygon Amoy</p>
                <p className="text-xs text-emerald-600">Connected</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Verified docs</span>
                <span className="font-semibold text-slate-800">{stats.blockchainVerifiedCount}/{stats.totalDocuments}</span>
              </div>
              {lastTxHash && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Last TX</span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-medium"
                  >
                    {lastTxHash.slice(0, 8)}…{lastTxHash.slice(-6)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          <a href="/owner/audit-logs" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all
          </a>
        </div>
        {stats.recentActivities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentActivities.map((log: IAuditLog, i: number) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </p>
                  {log.metadata && (log.metadata as { filename?: string }).filename && (
                    <p className="text-xs text-slate-400 truncate">
                      {(log.metadata as { filename: string }).filename}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
