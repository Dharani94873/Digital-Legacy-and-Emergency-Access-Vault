import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/shared/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') redirect('/login');
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar user={session.user as { name?: string; email?: string; image?: string }} />
      <main className="flex-1 ml-64 p-6 overflow-auto">{children}</main>
    </div>
  );
}
