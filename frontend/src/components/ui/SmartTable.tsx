"use client";

import { EntityColumn } from '../../modules/settings/types';
import { Edit2, Trash2, History, Eye, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartTableProps {
  columns: EntityColumn[];
  data: any[];
  isLoading: boolean;
  onView?: (record: any) => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onHistory?: (record: any) => void;
}

export const SmartTable: React.FC<SmartTableProps> = ({ columns, data, isLoading, onView, onEdit, onDelete, onHistory }) => {
  
  if (isLoading) {
    return <LoadingState message="Scanning Database..." />;
  }

  if (!data || data.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <EmptyState title="No Records Found" description="There is no data available for this view." />
      </motion.div>
    );
  }

  return (
    <div className="glass-panel w-full overflow-x-auto overflow-y-hidden pb-4 hide-scrollbar">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="border-b border-white/10 relative bg-gradient-to-r from-white/5 to-transparent">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-5 text-micro text-zinc-400 whitespace-nowrap relative z-10">
                {col.label}
              </th>
            ))}
            {(onView || onEdit || onDelete || onHistory) && (
              <th className="px-6 py-5 text-micro text-zinc-400 text-right whitespace-nowrap relative z-10">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 relative z-10">
          <AnimatePresence>
            {data.map((row, idx) => (
              <motion.tr 
                key={row.id || idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group hover:bg-blue-500/10 transition-colors relative cursor-default"
              >
                
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-body text-zinc-200 relative z-10">
                    {col.render ? col.render(row[col.key], row) : row[col.key] || <span className="text-zinc-600">-</span>}
                  </td>
                ))}
                
                {(onView || onEdit || onDelete || onHistory) && (
                  <td className="px-6 py-3 text-right whitespace-nowrap relative z-10">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {onView && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(59,130,246,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onView(row)}
                          className="p-2 text-zinc-400 hover:text-blue-400 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.button>
                      )}
                      {onHistory && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onHistory(row)}
                          className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                          title="View Audit History"
                        >
                          <History className="h-4 w-4" />
                        </motion.button>
                      )}
                      {onEdit && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(16,185,129,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEdit(row)}
                          className="p-2 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </motion.button>
                      )}
                      {onDelete && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239,68,68,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(row)}
                          className="p-2 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Archive/Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};
