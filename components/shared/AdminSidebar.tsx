'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, BarChart2, FileSearch, LogOut, ChevronRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const navItems = [
  { href: '/admin/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/users',      label: 'Users',        icon: Users           },
  { href: '/admin/analytics',  label: 'Analytics',    icon: BarChart2       },
  { href: '/admin/logs',       label: 'System Logs',  icon: FileSearch      },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function AdminSidebar({ user }: Props) {
  const pathname    = usePathname();
  const [so, setSo] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-30">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">Admin Panel</p>
          <p className="text-xs text-rose-400 font-medium">Digital Legacy Vault</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}>
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer
                  ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-rose-400' : ''}`} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-slate-300">{user.name?.charAt(0)?.toUpperCase() ?? 'A'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name ?? 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button onClick={async () => { setSo(true); toast.success('Successfully logged out'); await signOut({ callbackUrl: '/' }); }} disabled={so}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
