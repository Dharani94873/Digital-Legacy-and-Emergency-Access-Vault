'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, AlertCircle, Loader2, ShieldCheck, User as UserIcon, Lock, Unlock, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  _id: string;
  email: string;
  role: 'owner' | 'nominee' | 'admin';
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  profile?: {
    fullName: string;
    phone: string;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadUsers = async (p = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      const q = new URLSearchParams({ page: p.toString(), limit: '20' });
      if (search) q.set('search', search);
      if (roleFilter) q.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${q.toString()}`);
      const json = await res.json();
      
      if (json.success) {
        setUsers(prev => append ? [...prev, ...json.data.items] : json.data.items);
        setHasMore(json.data.hasMore);
        setPage(p);
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const toggleSuspension = async (user: UserProfile) => {
    const action = user.isSuspended ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    setProcessingId(user._id);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, action })
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success(`User ${action}d successfully`);
        setUsers(users.map(u => u._id === user._id ? { ...u, isSuspended: !u.isSuspended } : u));
      } else {
        toast.error(json.error ?? `Failed to ${action} user`);
      }
    } catch {
      toast.error(`Failed to ${action} user`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage all registered users.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="nominee">Nominee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !users.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                    <p>No users found matching your search.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          {user.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-indigo-500" /> : <UserIcon className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.profile?.fullName || 'No Name'}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 
                          user.role === 'owner' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
                        ${user.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        {user.isSuspended ? (
                          <><AlertCircle className="w-3 h-3" /> Suspended</>
                        ) : (
                          <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => toggleSuspension(user)}
                          disabled={processingId === user._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50
                            ${user.isSuspended 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          {processingId === user._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.isSuspended ? (
                            <><Unlock className="w-3.5 h-3.5" /> Activate</>
                          ) : (
                            <><Lock className="w-3.5 h-3.5" /> Suspend</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="p-4 border-t border-slate-100 text-center">
            <button
              onClick={() => loadUsers(page + 1, true)}
              disabled={loading}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Users'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
