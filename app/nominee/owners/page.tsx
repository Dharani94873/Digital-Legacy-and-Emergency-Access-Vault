'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Folder, FileText, Mail, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OwnerNomination {
  nomineeRecordId: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerAvatarUrl?: string | null;
  waitingPeriodDays: number;
  allowedFolderIds: string[];
  allowedDocumentIds: string[];
  acceptedAt?: string | null;
}

export default function NomineeOwnersPage() {
  const [owners, setOwners] = useState<OwnerNomination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/nominees/owners')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setOwners(json.data ?? []);
        } else {
          toast.error(json.error ?? 'Failed to load owners');
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Network error loading owners');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Owners</h1>
        <p className="text-slate-500 text-sm mt-1">
          Vault owners who have selected you as a trusted emergency contact
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white border border-slate-100 p-6 animate-pulse space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : owners.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl p-12 border border-slate-100 shadow-sm"
        >
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 text-lg">No designations found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            You haven&apos;t been added as a nominee by any vault owners yet. Once an owner invites you and you accept, they will show up here.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {owners.map((owner, i) => (
            <motion.div
              key={owner.nomineeRecordId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-lg">
                    {owner.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate">{owner.ownerName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{owner.ownerEmail}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 my-5 py-3.5 px-4 bg-slate-50 rounded-xl text-center">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Wait Period</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {owner.waitingPeriodDays}d
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Folders</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-sky-500" />
                      {owner.allowedFolderIds.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Files</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center justify-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      {owner.allowedDocumentIds.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Accepted {owner.acceptedAt ? new Date(owner.acceptedAt).toLocaleDateString() : 'Pending'}
                </span>
                <span className="bg-emerald-50 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Active
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
