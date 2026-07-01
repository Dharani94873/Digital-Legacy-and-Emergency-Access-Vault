'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IFolder } from '@/types';

interface TreeNode extends IFolder {
  children: TreeNode[];
  documentCount: number;
}

function buildTree(folders: IFolder[], documentCounts: Record<string, number>): TreeNode[] {
  const map: Record<string, TreeNode> = {};
  folders.forEach((f) => {
    map[f._id] = { ...f, children: [], documentCount: documentCounts[f._id] ?? 0 };
  });

  const roots: TreeNode[] = [];
  folders.forEach((f) => {
    if (f.parentFolderId && map[f.parentFolderId]) {
      map[f.parentFolderId].children.push(map[f._id]);
    } else {
      roots.push(map[f._id]);
    }
  });
  return roots;
}

interface TreeNodeProps {
  node: TreeNode;
  selectedId?: string;
  onSelect: (folder: IFolder) => void;
  depth?: number;
}

function TreeNodeItem({ node, selectedId, onSelect, depth = 0 }: TreeNodeProps) {
  const [open, setOpen] = useState(false);
  const isSelected = selectedId === node._id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => { setOpen(!open); onSelect(node); }}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left group ${
          isSelected
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0">
            {open
              ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </span>
        ) : (
          <span className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        {open || isSelected
          ? <FolderOpen className="w-4 h-4 flex-shrink-0 text-indigo-500" />
          : <Folder className="w-4 h-4 flex-shrink-0 text-slate-400" />}
        <span className="flex-1 truncate">{node.name}</span>
        {node.documentCount > 0 && (
          <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
            isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {node.documentCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeNodeItem
                key={child._id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FolderTreeProps {
  folders: IFolder[];
  documentCounts?: Record<string, number>;
  selectedFolderId?: string;
  onSelectFolder: (folder: IFolder | null) => void;
}

export function FolderTree({ folders, documentCounts = {}, selectedFolderId, onSelectFolder }: FolderTreeProps) {
  const tree = buildTree(folders, documentCounts);

  return (
    <div className="space-y-0.5">
      {/* All documents root */}
      <button
        onClick={() => onSelectFolder(null)}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ${
          !selectedFolderId
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <FileText className="w-4 h-4 flex-shrink-0 text-indigo-400" />
        <span>All Documents</span>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${!selectedFolderId ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          {Object.values(documentCounts).reduce((a, b) => a + b, 0)}
        </span>
      </button>

      {tree.length === 0 ? (
        <p className="text-xs text-slate-400 px-3 py-4 text-center">No folders yet</p>
      ) : (
        tree.map((node) => (
          <TreeNodeItem
            key={node._id}
            node={node}
            selectedId={selectedFolderId}
            onSelect={onSelectFolder}
          />
        ))
      )}
    </div>
  );
}
