'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Lock, Layers, KeyRound, ChevronDown } from 'lucide-react';

const STAGES = [
  { id: 'hero', name: 'Cryptographic Core', icon: Shield, range: [0, 0.22] },
  { id: 'simulator', name: 'Simulation Enclave', icon: Lock, range: [0.22, 0.5] },
  { id: 'features', name: 'Security Pillars', icon: Layers, range: [0.5, 0.75] },
  { id: 'workflow', name: 'Emergency Gateway', icon: KeyRound, range: [0.75, 1.0] },
];

export default function LandingScrollExperience() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      setScrollProgress(progress);

      const stageIndex = STAGES.findIndex(
        (s) => progress >= s.range[0] && progress <= s.range[1]
      );
      if (stageIndex !== -1) {
        setActiveStage(stageIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const CurrentIcon = STAGES[activeStage]?.icon || Shield;

  return (
    <>
      {/* Top 3D Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-slate-900/60 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-75 ease-out"
          style={{ width: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      {/* Floating 3D Telemetry HUD on Bottom Left */}
      <div className="fixed bottom-6 left-6 z-40 hidden lg:flex items-center gap-3 px-3.5 py-2 rounded-full bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-xl pointer-events-none select-none">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <CurrentIcon className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-mono text-slate-300">
          3D VIEW:{' '}
          <strong className="text-white font-semibold uppercase">
            {STAGES[activeStage]?.name}
          </strong>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
          {Math.round(scrollProgress * 100)}% DEPTH
        </span>
      </div>

      {/* Floating Scroll Down Hint on Hero */}
      {scrollProgress < 0.08 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 text-slate-400 text-xs font-mono pointer-events-none animate-bounce">
          <span>SCROLL TO EXPLORE 3D VAULT</span>
          <ChevronDown className="w-4 h-4 text-cyan-400" />
        </div>
      )}
    </>
  );
}
