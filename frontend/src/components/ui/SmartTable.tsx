"use client";

import React, { useState, useMemo } from 'react';
import { EntityColumn } from '../../modules/settings/types';
import { Edit2, Trash2, History, Eye, Download, Search, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SkeletonLoader, TableSkeleton } from './SkeletonLoader';
import { useDensityStore } from '../../store/useDensityStore';

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
  title?: string;
  actions?: React.ReactNode;
  maxHeight?: string;
}

export const SmartTable: React.FC<SmartTableProps> = ({ 
  columns, 
  data, 
  isLoading, 
  onView, 
  onEdit, 
  onDelete, 
  onHistory, 
  exportable = true, 
  exportFilename = 'ToolRoomOS_Export',
  title,
  actions,
  maxHeight
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { density } = useDensityStore();

  const handleExport = () => {
    if (!data || data.length === 0) return;
    
    const exportData = data.map(row => {
      const rowData: Record<string, any> = {};
      columns.forEach(col => {
        let val = row[col.key];
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
    
    const fileName = `${exportFilename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data || [];
    const lowerQuery = searchQuery.toLowerCase();
    return (data || []).filter(row => {
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

  // Dynamic row height class based on density mode
  const rowHeightClass = {
    comfortable: 'h-[var(--size-table-row-comfortable)]',
    compact: 'h-[var(--size-table-row-compact)]',
    dense: 'h-[var(--size-table-row-dense)]',
  }[density] || 'h-[var(--size-table-row-comfortable)]';

  if (isLoading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden flex flex-col">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 shrink-0 gap-3">
        <div className="flex items-center gap-3 flex-1">
          {title && (
            <span className="text-card-title font-bold text-zinc-900 tracking-tight shrink-0 border-r border-zinc-200 pr-3">
              {title}
            </span>
          )}
          
          {/* Search Box */}
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-white border border-zinc-200 rounded-md text-caption text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          
          {exportable && (data || []).length > 0 && (
            <button 
              onClick={handleExport}
              className="h-8 px-2.5 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 text-caption font-medium border border-zinc-200 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export to Excel Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Grid */}
      <div 
        className="w-full overflow-x-auto" 
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table className="w-full text-left border-collapse min-w-max">
          <thead className="sticky top-0 z-20">
            <tr className="bg-zinc-100 border-b border-zinc-200 text-micro font-bold text-zinc-500 uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2 border-r border-zinc-200/50 last:border-r-0">
                  {col.label}
                </th>
              ))}
              {(onView || onEdit || onDelete || onHistory) && (
                <th className="px-3 py-2 text-right sticky right-0 bg-zinc-100 z-30 border-l border-zinc-200 shadow-[ -2px_0_4px_rgba(0,0,0,0.02) ]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-caption text-zinc-800">
            {filteredData.length > 0 ? (
              filteredData.map((row, idx) => (
                <tr 
                  key={row.id || idx}
                  className={`${rowHeightClass} group hover:bg-zinc-50/90 transition-colors`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-1.5 border-r border-zinc-100/50 last:border-r-0 font-normal">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? <span className="text-zinc-300">-</span>)}
                    </td>
                  ))}
                  
                  {(onView || onEdit || onDelete || onHistory) && (
                    <td className="px-3 py-1.5 text-right sticky right-0 bg-white group-hover:bg-zinc-50 border-l border-zinc-200 shadow-[ -2px_0_4px_rgba(0,0,0,0.02) ]">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button 
                            onClick={() => onView(row)}
                            className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Record"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onHistory && (
                          <button 
                            onClick={() => onHistory(row)}
                            className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded transition-colors"
                            title="View Audit Trail"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onEdit && (
                          <button 
                            onClick={() => onEdit(row)}
                            className="p-1 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={() => onDelete(row)}
                            className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Archive Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <p className="text-body font-semibold text-zinc-700">No records found</p>
                    <p className="text-caption text-zinc-400">Try adjusting your search criteria or create a new entry.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Telemetry Bar */}
      <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 text-micro text-zinc-500 flex justify-between items-center shrink-0">
        <span>Showing {filteredData.length} of {(data || []).length} records</span>
        <span className="font-mono">Density: {density.toUpperCase()}</span>
      </div>
    </div>
  );
};
