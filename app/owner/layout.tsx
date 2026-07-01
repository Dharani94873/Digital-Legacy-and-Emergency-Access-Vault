import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OwnerSidebar from '@/components/shared/OwnerSidebar';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'owner') {
    redirect('/auth/login');
  }
  return (
    <div className="flex min-h-screen bg-slate-50">
      <OwnerSidebar user={session.user as { name?: string; email?: string; image?: string }} />
      <main className="flex-1 ml-64 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
