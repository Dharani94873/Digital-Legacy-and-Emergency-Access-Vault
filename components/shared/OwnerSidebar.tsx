'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, FolderOpen, Users, AlertTriangle,
  ClipboardList, Settings, Shield, LogOut, ChevronRight, Bell,
} from 'lucide-react';
import Image from 'next/image';

const navItems = [
  { href: '/owner/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/owner/documents',  label: 'Documents',      icon: FileText        },
  { href: '/owner/folders',    label: 'Folders',         icon: FolderOpen      },
  { href: '/owner/nominees',   label: 'Nominees',        icon: Users           },
  { href: '/owner/requests',   label: 'Requests',        icon: AlertTriangle   },
  { href: '/owner/audit-logs', label: 'Audit Logs',      icon: ClipboardList   },
  { href: '/owner/settings',   label: 'Settings',        icon: Settings        },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function OwnerSidebar({ user }: Props) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col z-30 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl vault-gradient flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">Digital Legacy</p>
          <p className="text-xs text-indigo-600 font-medium">Vault</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : ''}`} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-indigo-700">
                {user.name?.charAt(0)?.toUpperCase() ?? user.email?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name ?? 'Owner'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            id="signout-btn"
            onClick={async () => { setSigningOut(true); await signOut({ callbackUrl: '/login' }); }}
            disabled={signingOut}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
