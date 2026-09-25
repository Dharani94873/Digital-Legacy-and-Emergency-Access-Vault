'use client';

import React, { useState } from 'react';
import { Lock, Shield, Key, CheckCircle, ArrowRight, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function InteractiveVaultDemo() {
  const [activeTab, setActiveTab] = useState<'encrypt' | 'blockchain' | 'nominee'>('encrypt');

  // Encryption Demo State
  const [plaintext, setPlaintext] = useState('My Swiss Bank Account & Master Crypto Seed Phrase (12 Words)');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [cipherOutput, setCipherOutput] = useState(
    'U2FsdGVkX19q8a9v4lKq8P9L+mN4y9B7A3x5z8+e1w0='
  );
  const [cipherTag, setCipherTag] = useState('9f8b3c2d4e1a0f5e');

  // Nominee Demo State
  const [nomineeCode, setNomineeCode] = useState('LEGACY-9042-VAULT');
  const [nomineeStatus, setNomineeStatus] = useState<'idle' | 'verifying' | 'granted'>('idle');

  const handleSimulateEncrypt = () => {
    setIsEncrypting(true);
    setTimeout(() => {
      // Generate pseudo-cipher from plaintext
      const fakeCipher = Array.from({ length: 48 }, () =>
        '0123456789ABCDEFabcdef+/'.charAt(Math.floor(Math.random() * 26))
      ).join('');
      const fakeTag = Array.from({ length: 16 }, () =>
        '0123456789abcdef'.charAt(Math.floor(Math.random() * 16))
      ).join('');
      setCipherOutput(fakeCipher);
      setCipherTag(fakeTag);
      setIsEncrypting(false);
    }, 600);
  };

  const handleSimulateNominee = () => {
    setNomineeStatus('verifying');
    setTimeout(() => {
      setNomineeStatus('granted');
    }, 900);
  };

  return (
    <div className="relative rounded-3xl border border-indigo-500/20 bg-slate-950/80 backdrop-blur-2xl p-6 sm:p-8 md:p-10 shadow-2xl shadow-indigo-950/50 overflow-hidden">
      {/* Background Neon Grid & Glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-mono mb-2">
            <Cpu className="w-3.5 h-3.5" />
            LIVE SECURITY PIPELINE SIMULATOR
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            How Digital Legacy Protects Your Assets
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Experience the three-pillar cryptographic workflow behind every stored document.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('encrypt')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'encrypt'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            1. AES-256
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'blockchain'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Polygon Amoy
          </button>
          <button
            onClick={() => setActiveTab('nominee')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'nominee'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            3. Nominee Handshake
          </button>
        </div>
      </div>

      {/* Tab Content 1: AES-256-GCM */}
      {activeTab === 'encrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Input Plaintext Document / Secret</span>
                <span className="text-cyan-400">Owner Key Isolated</span>
              </label>
              <textarea
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                rows={3}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Type your sensitive legacy message or secret..."
              />
            </div>

            <div className="flex gap-2">
              {['Will & Testament', 'Seed Phrase', 'Health Directive'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPlaintext(`${preset}: Confidential assets registered for verified beneficiaries.`)}
                  className="px-2.5 py-1 rounded-md text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Preset: {preset}
                </button>
              ))}
            </div>

            <button
              onClick={handleSimulateEncrypt}
              disabled={isEncrypting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isEncrypting ? 'animate-spin' : ''}`} />
              {isEncrypting ? 'Deriving Keys & Encrypting...' : 'Simulate AES-256-GCM Encryption'}
            </button>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                AES-256-GCM Cipher Payload
              </span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">Zero-Knowledge</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Initialization Vector (IV - 96 bit):</span>
              <span className="text-indigo-300 break-all select-all bg-slate-950/60 p-1.5 rounded block">
                0x7a89f02c4b1d6e8301fae29c
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Ciphertext (Encrypted Payload):</span>
              <span className="text-cyan-300 break-all select-all bg-slate-950/60 p-2 rounded block">
                {cipherOutput}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Auth Tag (Integrity Seal - 128 bit):</span>
              <span className="text-emerald-400 break-all select-all bg-slate-950/60 p-1.5 rounded block">
                0x{cipherTag}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Polygon Amoy */}
      {activeTab === 'blockchain' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Immutable Blockchain Fingerprint
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you store a vault file, its SHA-256 cryptographic digest is anchored directly onto the 
                <span className="text-cyan-400 font-semibold"> Polygon Amoy Proof-of-Stake testnet</span>. 
                Even if server databases are compromised, no one can tamper with or forge your records.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Smart Contract</span>
                <span className="text-slate-200 font-semibold">0x3F9a...88c2</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Consensus Network</span>
                <span className="text-purple-400 font-semibold">Polygon Amoy (80002)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="text-purple-400 font-semibold">On-Chain Receipt Verified</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Confirmed Block #15,829,102
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">SHA-256 Document Hash:</span>
              <span className="text-slate-300 break-all select-all bg-slate-950/60 p-2 rounded block text-[11px]">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Transaction Hash (Polygonscan):</span>
              <span className="text-cyan-400 break-all select-all bg-slate-950/60 p-2 rounded block text-[11px]">
                0x8b193f48a1290bb3918a36c61fcf13824bbd1297e09ef961e0b50346a0c0e18f
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Gas Used: 43,120 Gwei</span>
              <span className="text-emerald-400">100% Tamper Proof</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Nominee Handshake */}
      {activeTab === 'nominee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Enter Nominee Emergency Access Token</span>
                <span className="text-amber-400">Dead-Man Check: OK</span>
              </label>
              <input
                type="text"
                value={nomineeCode}
                onChange={(e) => setNomineeCode(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-100 font-mono tracking-widest focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                placeholder="LEGACY-XXXX-VAULT"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              In an emergency, your trusted nominee logs in with their dedicated Nominee account and inputs this single-use authorization token. If the dead-man switch timer lapses without owner veto, access unlocks seamlessly.
            </p>

            <button
              onClick={handleSimulateNominee}
              disabled={nomineeStatus === 'verifying'}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {nomineeStatus === 'verifying' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Smart Clearance...
                </>
              ) : (
                <>
                  Simulate Nominee Access Request <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-semibold">Access Quorum Status</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                  nomineeStatus === 'granted'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {nomineeStatus === 'granted' ? 'ACCESS GRANTED' : 'PENDING SIMULATION'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>1. Nominee Identity Verification</span>
                <span className="text-emerald-400">PASSED ✓</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>2. Emergency Inactivity Grace Period</span>
                <span className="text-emerald-400">EXPIRED ✓</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>3. Owner Veto Override Check</span>
                <span className="text-emerald-400">NO VETO RAISED ✓</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>4. Decryption Key De-enclave</span>
                <span className={nomineeStatus === 'granted' ? 'text-cyan-400' : 'text-slate-500'}>
                  {nomineeStatus === 'granted' ? 'DECRYPTED & RELEASED' : 'LOCKED'}
                </span>
              </div>
            </div>

            {nomineeStatus === 'granted' && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs mt-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Emergency Nominee handshake verified. Documents are decrypted client-side and made accessible.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
