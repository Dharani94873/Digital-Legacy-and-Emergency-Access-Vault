'use client';

import { ExternalLink, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface BlockchainBadgeProps {
  verified: boolean;
  txHash?: string;
}

export function BlockchainBadge({ verified, txHash }: BlockchainBadgeProps) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <ShieldAlert className="w-3 h-3" />
        Unverified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
      <ShieldCheck className="w-3 h-3" />
      {txHash ? (
        <a
          href={`https://amoy.polygonscan.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Polygonscan"
          className="hover:underline flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          On-chain
          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
        </a>
      ) : (
        'Verified'
      )}
    </span>
  );
}

// Larger standalone badge variant for detail views
export function BlockchainBadgeLarge({ verified, txHash, blockNumber, network = 'Polygon Amoy' }: {
  verified: boolean;
  txHash?: string;
  blockNumber?: number;
  network?: string;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
      verified
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        verified ? 'bg-emerald-500' : 'bg-slate-300'
      }`}>
        {verified
          ? <ShieldCheck className="w-4 h-4 text-white" />
          : <Shield className="w-4 h-4 text-white" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${verified ? 'text-emerald-800' : 'text-slate-600'}`}>
          {verified ? 'Blockchain Verified' : 'Not Verified On-Chain'}
        </p>
        {verified && (
          <p className="text-xs text-emerald-600 mt-0.5">{network}</p>
        )}
        {txHash && (
          <a
            href={`https://amoy.polygonscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-mono mt-1"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-8)}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {blockNumber && (
          <p className="text-xs text-slate-400 mt-0.5">Block #{blockNumber.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
