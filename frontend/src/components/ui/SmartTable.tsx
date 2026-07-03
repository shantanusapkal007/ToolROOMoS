import { EntityColumn } from '../../modules/settings/types';
import { Edit2, Trash2, History } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

interface SmartTableProps {
  columns: EntityColumn[];
  data: any[];
  isLoading: boolean;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onHistory?: (record: any) => void;
}

export const SmartTable: React.FC<SmartTableProps> = ({ columns, data, isLoading, onEdit, onDelete, onHistory }) => {
  
  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No Records Found" description="There is no data available for this view." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete || onHistory) && (
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-white/[0.04] transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-slate-200">
                  {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                </td>
              ))}
              {(onEdit || onDelete || onHistory) && (
                <td className="px-6 py-4 text-sm text-right space-x-2 whitespace-nowrap">
                  {onHistory && (
                    <button 
                      onClick={() => onHistory(row)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      title="View Audit History"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(row)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Edit Record"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(row)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Archive/Delete Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
