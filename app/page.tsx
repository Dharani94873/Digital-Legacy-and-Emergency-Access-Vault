import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, FileText, Users, CheckCircle, ArrowRight, Zap } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role ?? 'owner';
    redirect(`/${role}/dashboard`);
  }

  const features = [
    { icon: Lock,      title: 'AES-256-GCM Encryption',   desc: 'Every document encrypted before upload. The key never leaves the server.' },
    { icon: Shield,    title: 'Blockchain Verification',   desc: 'SHA-256 hashes stored on Polygon for immutable integrity proof.' },
    { icon: Users,     title: 'Trusted Nominees',          desc: 'Grant controlled emergency access to people you trust.' },
    { icon: FileText,  title: 'Document Vault',            desc: 'Organize insurance, medical, legal, and identity documents securely.' },
    { icon: CheckCircle, title: 'Audit Trail',             desc: 'Every action logged with actor, timestamp, and IP address.' },
    { icon: Zap,       title: 'Emergency Access Workflow', desc: 'Configurable waiting periods with auto-approval and email notifications.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl vault-gradient flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Digital Legacy Vault</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="vault-gradient text-white text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-50 to-transparent rounded-full blur-3xl opacity-60" />
        </div>
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Blockchain-verified document security</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Protect your digital legacy.<br />
            <span className="vault-gradient-text">Trust who matters.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Securely vault your most important documents with military-grade encryption and blockchain verification. 
            Share emergency access with trusted nominees — on your terms.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="vault-gradient text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-200 hover:opacity-90 transition-all flex items-center gap-2 text-base"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-slate-700 font-semibold px-8 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to protect what matters</h2>
            <p className="text-slate-500 text-lg">Enterprise-grade security meets thoughtful emergency access design.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow hover:border-indigo-100 group"
              >
                <div className="w-11 h-11 rounded-xl vault-gradient flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-12 text-white shadow-2xl shadow-indigo-200">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-bold mb-3">Start securing your legacy today</h2>
            <p className="text-indigo-200 mb-8">Free to start. Your data is always encrypted and never shared.</p>
            <Link
              href="/register"
              className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
            >
              Create your vault <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Digital Legacy Vault — MSc Software Systems Project</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-indigo-500">⬡</span>
            <span>Polygon Amoy · AES-256-GCM · MongoDB Atlas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
