import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Lock,
  FileText,
  CheckCircle,
  ArrowRight,
  Zap,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import Vault3DScene from '@/components/landing/Vault3DScene';
import TiltCard from '@/components/landing/TiltCard';
import InteractiveVaultDemo from '@/components/landing/InteractiveVaultDemo';

export const metadata = {
  title: 'Digital Legacy & Emergency Access Vault | 3D Cryptographic Enclave',
  description:
    'Protect your digital legacy with 3D interactive WebGL visualization, military-grade AES-256-GCM encryption, Polygon Amoy blockchain proof, and dead-man emergency access for trusted nominees.',
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role ?? 'owner';
    redirect(`/${role}/dashboard`);
  }

  const features = [
    {
      icon: Lock,
      title: 'AES-256-GCM Military Encryption',
      desc: 'Zero-knowledge client-side encryption. Documents and credentials are encrypted prior to network transmission; keys never touch raw storage.',
      badge: 'Zero-Knowledge',
      glow: 'rgba(99, 102, 241, 0.3)',
      iconColor: 'text-indigo-400',
    },
    {
      icon: Shield,
      title: 'Polygon Amoy Blockchain Proof',
      desc: 'SHA-256 cryptographic hashes anchored to Polygon smart contracts for immutable, tamper-evident proof of existence and integrity.',
      badge: 'On-Chain Ledger',
      glow: 'rgba(168, 85, 247, 0.3)',
      iconColor: 'text-purple-400',
    },
    {
      icon: KeyRound,
      title: 'Nominee Emergency Handshake',
      desc: 'Grant secure, revocable access to trusted family or legal executors using single-use emergency authorization tokens.',
      badge: 'Granular Access',
      glow: 'rgba(56, 189, 248, 0.3)',
      iconColor: 'text-cyan-400',
    },
    {
      icon: Zap,
      title: "Dead-Man's Automated Switch",
      desc: "Configurable heartbeat check-in intervals. If you become incapacitated or unreachable, verified nominees receive access upon grace expiry.",
      badge: 'Fail-Safe Automation',
      glow: 'rgba(251, 146, 60, 0.3)',
      iconColor: 'text-amber-400',
    },
    {
      icon: FileText,
      title: 'Encrypted Multi-Asset Enclave',
      desc: 'Seamlessly catalog crypto seed phrases, insurance policies, medical directives, deeds, and personal farewell messages in isolated folders.',
      badge: 'Multi-Asset Support',
      glow: 'rgba(52, 211, 153, 0.3)',
      iconColor: 'text-emerald-400',
    },
    {
      icon: Activity,
      title: 'Forensic Audit & IP Ledger',
      desc: 'Every access attempt, key check, and document view is permanently logged with IP telemetry, timestamps, and cryptographic audit trails.',
      badge: 'Tamper Evident',
      glow: 'rgba(244, 63, 94, 0.3)',
      iconColor: 'text-rose-400',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Encrypt & Vault Assets',
      desc: 'Store passwords, deeds, seeds, and wills. Encrypted with AES-256-GCM before upload.',
      tag: 'Browser-Side Cryptography',
    },
    {
      step: '02',
      title: 'Anchor On-Chain Proof',
      desc: 'Document hashes are timestamped onto the Polygon Amoy blockchain smart contract.',
      tag: 'Polygon Amoy Network',
    },
    {
      step: '03',
      title: 'Designate Trusted Nominees',
      desc: 'Assign beneficiaries with emergency clearance rules, heartbeat triggers, and access quotas.',
      tag: 'Zero Cross-Role Leak',
    },
    {
      step: '04',
      title: 'Emergency Release Protocol',
      desc: 'If the dead-man switch expires without veto, nominees verify tokens to unlock emergency files.',
      tag: 'Automated Quorum',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      {/* Background Cyber Grid & Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.18),rgba(255,255,255,0))] -z-20" />
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] -z-20" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-cyan-500/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/75 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-wide flex items-center gap-1.5">
                DIGITAL LEGACY <span className="text-cyan-400 text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">3D</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Emergency Access Vault</span>
            </div>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#3d-core" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 3D Enclave
            </a>
            <a href="#simulator" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Pipeline Simulator
            </a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Security Pillars
            </a>
            <a href="#workflow" className="hover:text-cyan-400 transition-colors">
              How It Works
            </a>
          </div>

          {/* Direct Role Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login?role=nominee"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-400 bg-amber-950/30 border border-amber-500/30 hover:bg-amber-900/40 hover:border-amber-400/60 transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Nominee Portal</span>
            </Link>
            <Link
              href="/auth/login?role=owner"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors hidden sm:inline-block"
            >
              Owner Sign In
            </Link>
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/25 hover:opacity-95 hover:shadow-cyan-500/25 transition-all flex items-center gap-1.5"
            >
              <span>Create Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D WebGL Canvas */}
      <section id="3d-core" className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6 min-h-[85vh] flex items-center justify-center">
        {/* Three.js Interactive 3D Canvas Background */}
        <Vault3DScene interactiveState="idle" />

        {/* Foreground Content */}
        <div className="max-w-5xl mx-auto relative z-10 text-center pointer-events-auto">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 shadow-lg shadow-indigo-950/40 backdrop-blur-xl mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono tracking-wider uppercase text-slate-200">
              Interactive 3D Cryptographic Enclave
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-xs font-mono text-cyan-400">Polygon Amoy Testnet</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Safeguard your legacy in an{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              interactive 3D vault
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Zero-knowledge <strong className="text-white font-semibold">AES-256-GCM encryption</strong> meets{' '}
            <strong className="text-white font-semibold">Polygon Amoy blockchain proofs</strong> and{' '}
            <strong className="text-white font-semibold">dead-man&apos;s emergency access</strong>. Your most sensitive deeds, keys, and credentials — accessible only to those you trust, precisely when it counts.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Launch Owner Vault</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/login?role=nominee"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/80 text-slate-200 hover:text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 backdrop-blur-xl transition-all hover:scale-[1.02] cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Nominee Access Portal</span>
            </Link>
          </div>

          {/* Live Telemetry Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-6 border-t border-slate-800/60 font-mono text-xs">
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">ENCRYPTION</span>
              <span className="text-cyan-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <Lock className="w-3.5 h-3.5" /> AES-256-GCM
              </span>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">CONSENSUS</span>
              <span className="text-purple-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5" /> Polygon Amoy
              </span>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">FAIL-SAFE</span>
              <span className="text-amber-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5" /> Dead-Man Heartbeat
              </span>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-3 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px]">PRIVACY MODEL</span>
              <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> Zero-Knowledge
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pipeline Simulator Section */}
      <section id="simulator" className="py-20 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-400 text-xs font-mono mb-3">
            <Cpu className="w-3.5 h-3.5" />
            LIVE SECURITY VERIFICATION
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Test the Cryptographic Pipeline
          </h2>
          <p className="text-slate-400 text-base mt-2">
            Try client-side encryption, inspect Polygon Amoy blockchain proof generation, and preview how trusted nominees claim emergency access.
          </p>
        </div>

        <InteractiveVaultDemo />
      </section>

      {/* 3D Tilt Feature Grid */}
      <section id="features" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            3D PERSPECTIVE CARDS (HOVER TO TILT)
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Uncompromising Security
          </h2>
          <p className="text-slate-400 text-lg mt-3">
            Every feature is architected to guarantee privacy during your lifetime and seamless release in critical emergencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, badge, glow, iconColor }) => (
            <TiltCard key={title} glowColor={glow} className="p-7">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner">
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60">
                      {badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2.5 tracking-tight">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Status: Active</span>
                  <span className="text-cyan-400">Verified &bull;</span>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* How it Works / Workflow Steps */}
      <section id="workflow" className="py-24 px-6 relative z-10 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Cryptographic Execution in 4 Steps
            </h2>
            <p className="text-slate-400 text-base mt-2">
              From day-to-day document confidentiality to automated emergency nominee release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc, tag }) => (
              <div
                key={step}
                className="relative bg-slate-950/80 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-colors group"
              >
                <div className="text-4xl font-black font-mono text-indigo-500/30 group-hover:text-indigo-400/60 transition-colors mb-4">
                  {step}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-4">{desc}</p>
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/50 text-indigo-300">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Impact 3D Call-to-Action Banner */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden p-10 md:p-14 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-950 border border-indigo-500/30 shadow-2xl shadow-indigo-950/80 text-center">
          {/* Subtle Cyber Glow Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none -z-10" />

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 mb-6">
            <Shield className="w-7 h-7 text-indigo-300" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Protect What Matters Most Today
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Create your encrypted vault now. No credit card required. Keep your sensitive records secure with military-grade encryption and blockchain-verified integrity.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-200 hover:text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Sign In to Existing Vault
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Cyber Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 bg-slate-950 relative z-10 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-slate-200 font-bold tracking-wider">DIGITAL LEGACY VAULT</span>
              <span className="text-slate-500 block text-[11px]">MSc Software Systems Security Capstone</span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Polygon Amoy (80002)
            </span>
            <span>&bull;</span>
            <span>Three.js WebGL 3D</span>
            <span>&bull;</span>
            <span>AES-256-GCM Galois Mode</span>
            <span>&bull;</span>
            <span>Next.js 15 App Router</span>
          </div>

          <div className="text-slate-500 flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} Digital Legacy Vault.</span>
            <a
              href="https://github.com/Dharani94873/Digital-Legacy-and-Emergency-Access-Vault"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
