'use client';

import { motion } from 'framer-motion';
import { User, Mail, Shield, ShieldOff, Clock, CheckCircle2, AlertCircle, MoreVertical, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { INominee } from '@/types';
import { toast } from 'sonner';

interface NomineeCardProps {
  nominee: INominee;
  nomineeName?: string;
  onRevoked: () => void;
  onManagePermissions: (nominee: INominee) => void;
  delay?: number;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',   icon: Clock },
  active:   { label: 'Active',   color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  revoked:  { label: 'Revoked',  color: 'bg-red-100 text-red-600',       icon: AlertCircle },
};

export function NomineeCard({ nominee, nomineeName, onRevoked, onManagePermissions, delay = 0 }: NomineeCardProps) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [revoking,  setRevoking]  = useState(false);
  const [resending, setResending] = useState(false);

  const status = STATUS_CONFIG[nominee.status];
  const StatusIcon = status.icon;

  const handleRevoke = async () => {
    if (!confirm(`Revoke ${nominee.nomineeEmail}'s access? They will no longer be able to request emergency access.`)) return;
    setRevoking(true);
    try {
      const res  = await fetch(`/api/nominees/${nominee._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to revoke'); return; }
      toast.success('Nominee access revoked');
      onRevoked();
    } catch {
      toast.error('Failed to revoke');
    } finally {
      setRevoking(false);
      setMenuOpen(false);
    }
  };

  const handleResendInvite = async () => {
    setResending(true);
    try {
      const res  = await fetch(`/api/nominees/${nominee._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend-invite' }),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error ?? 'Failed to resend'); return; }
      toast.success('Invitation resent successfully');
    } catch {
      toast.error('Failed to resend invitation');
    } finally {
      setResending(false);
      setMenuOpen(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-sm">
              {nomineeName ?? nominee.nomineeEmail}
            </h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-slate-400" />
            <p className="text-xs text-slate-400 truncate">{nominee.nomineeEmail}</p>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {nominee.waitingPeriodDays}d waiting period
            </span>
            {nominee.acceptedAt ? (
              <span>Accepted {formatDistanceToNow(new Date(nominee.acceptedAt), { addSuffix: true })}</span>
            ) : (
              <span>Invited {formatDistanceToNow(new Date(nominee.invitedAt), { addSuffix: true })}</span>
            )}
          </div>

          {/* Permissions summary */}
          <div className="flex items-center gap-2 mt-3">
            {nominee.allowedDocumentIds.length > 0 || nominee.allowedFolderIds.length > 0 ? (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {nominee.allowedDocumentIds.length} docs · {nominee.allowedFolderIds.length} folders
              </span>
            ) : (
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">No permissions set</span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            id={`nominee-menu-${nominee._id}`}
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-44 text-sm">
                <button
                  onClick={() => { setMenuOpen(false); onManagePermissions(nominee); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Permissions
                </button>
                {nominee.status === 'pending' && (
                  <button
                    onClick={handleResendInvite}
                    disabled={resending}
                    className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    {resending ? 'Sending…' : 'Resend Invite'}
                  </button>
                )}
                {nominee.status !== 'revoked' && (
                  <>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={handleRevoke}
                      disabled={revoking}
                      className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-red-50 text-red-600"
                    >
                      <ShieldOff className="w-4 h-4" />
                      {revoking ? 'Revoking…' : 'Revoke Access'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
