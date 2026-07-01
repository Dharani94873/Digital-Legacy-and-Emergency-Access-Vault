'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, CheckCircle, FileText,
  Bell, Clock, ArrowRight, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface EmergencyRequest {
  _id: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto-approved';
  reason: string;
  requestedAt: string;
  autoApprovalScheduledAt: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

const STATUS_CONFIG = {
  pending:         { label: 'Pending',       cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  approved:        { label: 'Approved',      cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  rejected:        { label: 'Rejected',      cls: 'bg-red-100 text-red-700',       dot: 'bg-red-400' },
  'auto-approved': { label: 'Auto-Approved', cls: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
};

function StatCard({ title, value, icon: Icon, color, href, delay = 0 }: {
  title: string; value: string | number; icon: React.ElementType;
  color: string; href?: string; delay?: number;
}) {
  const inner = (
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
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {href && (
        <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium mt-3">
          View details <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function NomineeDashboardPage() {
  const [requests,       setRequests]       = useState<EmergencyRequest[]>([]);
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/emergency/request').then((r) => r.json()),
      fetch('/api/notifications').then((r) => r.json()),
    ])
      .then(([reqJson, notifJson]) => {
        if (reqJson.success)   setRequests(reqJson.data ?? []);
        if (notifJson.success) setNotifications(notifJson.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending      = requests.filter((r) => r.status === 'pending').length;
  const approved     = requests.filter((r) => r.status === 'approved' || r.status === 'auto-approved').length;
  const unread       = notifications.filter((n) => !n.isRead).length;
  const recentReqs   = requests.slice(0, 4);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of your emergency access requests and notifications
        </p>
      </motion.div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Requests"   value={requests.length}
            icon={AlertTriangle}    color="bg-indigo-500"
            href="/nominee/requests" delay={0.05}
          />
          <StatCard
            title="Pending"         value={pending}
            icon={Clock}            color={pending > 0 ? 'bg-amber-500' : 'bg-slate-400'}
            href="/nominee/requests" delay={0.1}
          />
          <StatCard
            title="Access Granted"  value={approved}
            icon={CheckCircle}      color="bg-emerald-500"
            href="/nominee/documents" delay={0.15}
          />
          <StatCard
            title="Unread Alerts"   value={unread}
            icon={Bell}             color={unread > 0 ? 'bg-rose-500' : 'bg-slate-400'}
            delay={0.2}
          />
        </div>
      )}

      {/* Recent requests + notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Requests */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Recent Requests</h3>
            <Link href="/nominee/requests" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : recentReqs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <AlertTriangle className="w-10 h-10 mb-2 text-slate-200" />
              <p className="text-sm">No requests yet</p>
              <Link href="/nominee/requests" className="text-xs text-indigo-500 hover:underline mt-2">
                Submit your first request
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReqs.map((req, i) => {
                const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
                return (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{req.reason}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unread > 0 && (
              <span className="text-xs font-medium bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {unread} unread
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Bell className="w-10 h-10 mb-2 text-slate-200" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notif, i) => (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className={`flex gap-3 py-2 border-b border-slate-50 last:border-0 ${!notif.isRead ? 'opacity-100' : 'opacity-60'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{notif.message}</p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { href: '/nominee/requests',  label: 'Emergency Requests', icon: AlertTriangle, color: 'from-amber-400 to-orange-500' },
          { href: '/nominee/documents', label: 'Accessible Docs',    icon: FileText,      color: 'from-indigo-500 to-violet-500' },
          { href: '/nominee/owners',    label: 'My Owners',          icon: Users,         color: 'from-slate-600 to-slate-800' },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </motion.div>

      {/* Security notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 p-4 bg-sky-50 rounded-2xl border border-sky-100"
      >
        <Shield className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-sky-800">Emergency access is protected</p>
          <p className="text-xs text-sky-600 mt-0.5">
            All document access requests are logged on the Polygon Amoy blockchain.
            Owners are notified immediately and can approve, reject, or let requests auto-approve after the configured waiting period.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
