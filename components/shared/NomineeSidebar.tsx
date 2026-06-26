'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, AlertTriangle, FileText, Bell, LogOut, ChevronRight, Shield } from 'lucide-react';
import Image from 'next/image';

const navItems = [
  { href: '/nominee/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/nominee/owners',    label: 'My Owners',    icon: Users           },
  { href: '/nominee/requests',  label: 'Requests',     icon: AlertTriangle   },
  { href: '/nominee/documents', label: 'Documents',    icon: FileText        },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function NomineeSidebar({ user }: Props) {
  const pathname    = usePathname();
  const [so, setSo] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col z-30 shadow-sm">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">Digital Legacy</p>
          <p className="text-xs text-sky-600 font-medium">Nominee</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href}>
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium cursor-pointer
                  ${active ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-sky-600' : ''}`} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.image ? <Image src={user.image} alt="" width={32} height={32} /> : (
              <span className="text-sm font-semibold text-sky-700">{user.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name ?? 'Nominee'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button onClick={async () => { setSo(true); await signOut({ callbackUrl: '/login' }); }} disabled={so}
            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
