import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, AlertCircle, History, Download } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  render?: (val: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface SmartTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onHistory?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  exportable?: boolean;
  exportFilename?: string;
}

/**
 * SmartTable Component matching Design_System.md (Kraken theme):
 * - bg white, border border-gray (#dedee5), rounded 12px, shadow subtle
 */
export function SmartTable<T extends { id?: string | number }>({
  title,
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  onHistory,
  isLoading,
  emptyMessage = 'No records found.',
  exportable,
  exportFilename = 'export',
}: SmartTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a: any, b: any) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const hasActions = onView || onEdit || onDelete || onHistory;

  const handleExportCSV = () => {
    if (!data.length) return;
    const headerRow = columns.map(c => c.header || c.label || c.key).join(',');
    const rows = data.map(item =>
      columns.map(c => {
        const val = (item as any)[c.key];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val ?? '';
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${exportFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden flex flex-col">
      {(title || exportable) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-gray bg-[rgba(148,151,169,0.02)]">
          {title && <h3 className="text-feature-title font-semibold text-ink">{title}</h3>}
          {exportable && (
            <Button variant="white" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1.5 text-silver-blue" /> Export CSV
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-body-sm">
          <thead>
            <tr className="bg-[rgba(148,151,169,0.05)] border-b border-border-gray text-caption font-semibold text-cool-gray">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3.5 px-4 select-none ${
                    col.sortable ? 'cursor-pointer hover:text-ink' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header || col.label}</span>
                    {col.sortable && (
                      <span className="text-silver-blue">
                        {sortKey === col.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-primary" />
                          )
                        ) : (
                          <span className="opacity-0 group-hover:opacity-50">↕</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {hasActions && <th className="py-3.5 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-gray">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="py-12 text-center text-silver-blue">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="py-12 text-center text-silver-blue">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <AlertCircle className="w-6 h-6 text-silver-blue/60" />
                    <span className="font-medium text-ink">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-[rgba(148,151,169,0.06)] transition-colors text-ink"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="py-3.5 px-4">
                      {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key] ?? '—'}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onHistory && (
                          <button
                            onClick={() => onHistory(row)}
                            className="p-1.5 text-cool-gray hover:text-primary hover:bg-primary-subtle/50 rounded-[8px] transition-colors"
                            title="Audit History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="p-1.5 text-cool-gray hover:text-primary hover:bg-primary-subtle/50 rounded-[8px] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="p-1.5 text-cool-gray hover:text-primary hover:bg-primary-subtle/50 rounded-[8px] transition-colors"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="p-1.5 text-cool-gray hover:text-accent-red hover:bg-red-50 rounded-[8px] transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-gray bg-[rgba(148,151,169,0.04)] text-caption text-cool-gray">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="white"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="px-3 font-medium text-ink">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="white"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
