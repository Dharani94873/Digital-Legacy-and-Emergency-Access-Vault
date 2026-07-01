'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderOpen, ChevronRight, MoreVertical, Trash2, Edit2, Plus } from 'lucide-react';
import { IFolder } from '@/types';

interface FolderCardProps {
  folder: IFolder;
  documentCount?: number;
  isSelected?: boolean;
  onClick?: (folder: IFolder) => void;
  onDelete?: (folderId: string) => void;
  onRename?: (folder: IFolder) => void;
  delay?: number;
}

const FOLDER_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-600',
  violet: 'bg-violet-100 text-violet-600',
  sky:    'bg-sky-100 text-sky-600',
  emerald:'bg-emerald-100 text-emerald-600',
  amber:  'bg-amber-100 text-amber-600',
  rose:   'bg-rose-100 text-rose-600',
};

export function FolderCard({
  folder, documentCount = 0, isSelected = false, onClick, onDelete, onRename, delay = 0,
}: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const colorClass = FOLDER_COLORS[folder.color ?? 'indigo'] ?? FOLDER_COLORS.indigo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay, duration: 0.3 }}
      onClick={() => onClick?.(folder)}
      className={`relative bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-100 shadow-sm'
      }`}
    >
      {/* Menu button */}
      <div className="absolute top-3 right-3">
        <button
          id={`folder-menu-${folder._id}`}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-36 text-sm">
              {onRename && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRename(folder); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Rename
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(folder._id); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
        {isSelected
          ? <FolderOpen className="w-6 h-6" />
          : <Folder className="w-6 h-6" />
        }
      </div>

      <h3 className="font-semibold text-slate-900 text-sm leading-snug truncate pr-6">{folder.name}</h3>
      {folder.description && (
        <p className="text-xs text-slate-400 mt-0.5 truncate">{folder.description}</p>
      )}
      <p className="text-xs text-slate-400 mt-2">
        {documentCount === 0 ? 'Empty' : `${documentCount} document${documentCount !== 1 ? 's' : ''}`}
      </p>
    </motion.div>
  );
}
