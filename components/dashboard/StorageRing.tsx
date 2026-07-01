'use client';

import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface StorageRingProps {
  usedBytes: number;
  totalBytes?: number; // default 10 GB
  delay?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StorageRing({ usedBytes, totalBytes = 10 * 1024 * 1024 * 1024, delay = 0 }: StorageRingProps) {
  const pct = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
  const ringColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#6366f1';
  const ringBg    = pct > 85 ? '#fee2e2' : pct > 60 ? '#fef3c7' : '#e0e7ff';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
    >
      <h3 className="font-semibold text-slate-900 mb-4">Storage Usage</h3>

      <div className="flex flex-col items-center">
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              startAngle={90}
              endAngle={-270}
              data={[{ value: pct }]}
            >
              <RadialBar
                dataKey="value"
                fill={ringColor}
                background={{ fill: ringBg }}
                cornerRadius={8}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{pct}%</span>
            <span className="text-xs text-slate-400">used</span>
          </div>
        </div>

        <div className="w-full mt-5 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Used</span>
            <span className="font-semibold text-slate-800">{formatBytes(usedBytes)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%`, background: ringColor }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Free: {formatBytes(totalBytes - usedBytes)}</span>
            <span>of {formatBytes(totalBytes)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
