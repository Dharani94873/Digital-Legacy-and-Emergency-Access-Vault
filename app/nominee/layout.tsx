import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NomineeSidebar from '@/components/shared/NomineeSidebar';

export default async function NomineeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== 'nominee') redirect('/login');
  return (
    <div className="flex min-h-screen bg-slate-50">
      <NomineeSidebar user={session.user as { name?: string; email?: string; image?: string }} />
      <main className="flex-1 ml-64 p-6 overflow-auto">{children}</main>
    </div>
  );
}
