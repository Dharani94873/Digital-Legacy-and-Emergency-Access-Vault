'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, AlertTriangle, Activity, ShieldCheck,
  TrendingUp, UserCheck, UserX, Clock,
} from 'lucide-react';

interface AdminStats {
  users: {
    total: number;
    newLast7Days: number;
    newLast30Days: number;
    byRole: Record<string, number>;
  };
  documents: { total: number };
  requests: {
    total: number;
    pending: number;
    approved: number;
    byStatus: Record<string, number>;
  };
  activity: { logsLast7Days: number };
}

function StatCard({
  title, value, subtitle, icon: Icon, color, delay = 0,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
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
}

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setStats(j.data);
        else setError(j.error ?? 'Failed to load stats');
      })
      .catch(() => setError('Failed to load admin analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-6 text-red-300">{error}</div>
      </div>
    );
  }

  const owners    = stats?.users.byRole?.owner ?? 0;
  const nominees  = stats?.users.byRole?.nominee ?? 0;
  const admins    = stats?.users.byRole?.admin ?? 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide system overview</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users" value={stats?.users.total ?? 0}
          subtitle={`+${stats?.users.newLast7Days ?? 0} this week`}
          icon={Users} color="bg-indigo-500" delay={0.05}
        />
        <StatCard
          title="Total Documents" value={stats?.documents.total ?? 0}
          icon={FileText} color="bg-violet-500" delay={0.1}
        />
        <StatCard
          title="Pending Requests" value={stats?.requests.pending ?? 0}
          subtitle={stats?.requests.pending ? 'Requires attention' : 'All clear'}
          icon={AlertTriangle}
          color={(stats?.requests.pending ?? 0) > 0 ? 'bg-amber-500' : 'bg-slate-400'}
          delay={0.15}
        />
        <StatCard
          title="Activity (7d)" value={stats?.activity.logsLast7Days ?? 0}
          subtitle="audit log events"
          icon={Activity} color="bg-sky-500" delay={0.2}
        />
      </div>

      {/* User breakdown + request stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users by role */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-5">Users by Role</h3>
          <div className="space-y-4">
            {[
              { label: 'Owners',   count: owners,   color: 'bg-indigo-500', icon: UserCheck },
              { label: 'Nominees', count: nominees, color: 'bg-violet-500', icon: Users },
              { label: 'Admins',   count: admins,   color: 'bg-slate-500',  icon: ShieldCheck },
            ].map(({ label, count, color, icon: Icon }) => {
              const total = stats?.users.total || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-700 font-medium">{label}</span>
                    </div>
                    <span className="text-slate-900 font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className={`h-2 rounded-full ${color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400">
            <span>+{stats?.users.newLast7Days ?? 0} in last 7 days</span>
            <span>+{stats?.users.newLast30Days ?? 0} in last 30 days</span>
          </div>
        </motion.div>

        {/* Request status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-5">Emergency Request Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending',       value: stats?.requests.byStatus?.pending        ?? 0, color: 'bg-amber-400' },
              { label: 'Approved',      value: stats?.requests.byStatus?.approved       ?? 0, color: 'bg-emerald-500' },
              { label: 'Auto-Approved', value: stats?.requests.byStatus?.['auto-approved'] ?? 0, color: 'bg-blue-500' },
              { label: 'Rejected',      value: stats?.requests.byStatus?.rejected       ?? 0, color: 'bg-red-400' },
            ].map(({ label, value, color }) => {
              const total = stats?.requests.total || 1;
              const pct   = Math.round((value / total) * 100);
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-800">{value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.45, duration: 0.6 }}
                        className={`h-1.5 rounded-full ${color}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-300" />
                Total requests
              </span>
              <span className="font-bold text-slate-900">{stats?.requests.total ?? 0}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { href: '/admin/users', label: 'Manage Users',      icon: Users,         color: 'from-indigo-500 to-violet-500' },
          { href: '/admin/logs',  label: 'View Audit Logs',   icon: Activity,      color: 'from-slate-600 to-slate-800' },
          { href: '/admin/analytics', label: 'Full Analytics', icon: TrendingUp,   color: 'from-sky-500 to-blue-600' },
        ].map(({ href, label, icon: Icon, color }) => (
          <a
            key={href}
            href={href}
            className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </a>
        ))}
      </motion.div>

      {/* Recent activity hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {stats?.activity.logsLast7Days ?? 0} audit events in the last 7 days
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Monitor all platform activity in the Audit Logs section</p>
            </div>
          </div>
          <a href="/admin/logs" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View logs →
          </a>
        </div>
      </motion.div>
    </div>
  );
}
