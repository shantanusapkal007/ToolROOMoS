"use client";

import { EntityColumn } from '../../modules/settings/types';
import { Edit2, Trash2, History, Eye, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';

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

  const [searchQuery, setSearchQuery] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tableRef.current.style.setProperty('--mouse-x', `${x}px`);
    tableRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(col => {
        const val = row[col.key];
        if (val == null) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(lowerQuery);
        }
        return String(val).toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, searchQuery, columns]);

  return (
    <div 
      ref={tableRef}
      onMouseMove={handleMouseMove}
      className="glass-panel w-full flex flex-col spotlight-card relative z-10"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-b border-white/5 bg-white/[0.01] gap-4 relative z-20">
        <div className="relative w-full sm:w-72 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search all columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-black/60 shadow-inner transition-all"
          />
        </div>
        {exportable && data && data.length > 0 && (
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        )}
      </div>
      <div className="w-full overflow-auto max-h-[600px] pb-4 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max">
        <thead className="sticky top-0 z-30">
          <tr className="border-b border-white/10 bg-[#0a0a0c]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
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
            {filteredData.map((row, idx) => (
              <motion.tr 
                key={row.id || idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(idx * 0.05, 0.5), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="group hover:bg-white/[0.03] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 relative cursor-default hover:-translate-y-0.5 rounded-lg overflow-hidden"
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
