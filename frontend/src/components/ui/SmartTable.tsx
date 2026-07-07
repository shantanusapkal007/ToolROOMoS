"use client";

import { EntityColumn } from '../../modules/settings/types';
import { Edit2, Trash2, History, Eye, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  exportable?: boolean;
  exportFilename?: string;
}

export const SmartTable: React.FC<SmartTableProps> = ({ columns, data, isLoading, onView, onEdit, onDelete, onHistory, exportable, exportFilename }) => {
  
  const handleExport = () => {
    if (!data || data.length === 0) return;
    
    const exportData = data.map(row => {
      const rowData: Record<string, any> = {};
      columns.forEach(col => {
        let val = row[col.key];
        // If it's an object/array, stringify it safely, else keep it
        if (typeof val === 'object' && val !== null) {
          val = val.name || val.id || JSON.stringify(val);
        }
        rowData[col.label] = val;
      });
      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    
    const fileName = `${exportFilename || 'Data_Export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  
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
    <div className="glass-panel w-full flex flex-col">
      {exportable && data && data.length > 0 && (
        <div className="flex justify-end items-center px-4 py-3 border-b border-white/5 bg-white/[0.01]">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        </div>
      )}
      <div className="w-full overflow-x-auto overflow-y-hidden pb-4 hide-scrollbar">
        <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="border-b border-white/10 relative bg-white/[0.02]">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap relative z-10">
                {col.label}
              </th>
            ))}
            {(onView || onEdit || onDelete || onHistory) && (
              <th className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap relative z-10">
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
                  <td key={col.key} className="px-3 py-2 text-xs text-white/90 relative z-10 font-medium">
                    {col.render ? col.render(row[col.key], row) : row[col.key] || <span className="text-white/20">-</span>}
                  </td>
                ))}
                
                {(onView || onEdit || onDelete || onHistory) && (
                  <td className="px-3 py-2 text-right whitespace-nowrap relative z-10">
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      {onView && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(59,130,246,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onView(row)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                      {onHistory && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onHistory(row)}
                          className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                          title="View Audit History"
                        >
                          <History className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                      {onEdit && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(16,185,129,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEdit(row)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                      {onDelete && (
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239,68,68,0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(row)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Archive/Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
};
