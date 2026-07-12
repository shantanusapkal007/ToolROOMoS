'use client';

import React from 'react';
import { useToolbarStore } from '@/store/useToolbarStore';
import { X, Clock, User, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface HistoryModalProps {
  onClose: () => void;
}

export function UniversalHistory({ onClose }: HistoryModalProps) {
  const { selection, activeFeature } = useToolbarStore();
  
  if (!selection || selection.length === 0) {
    return null;
  }

  // We use the first selected document for history context
  const doc = selection[0];
  const docNumber = doc.documentNumber || doc.routingNumber || doc.id;

  // Mocked Audit Trail Data
  // In a real system, this would be fetched from `GET /api/${activeFeature}/${doc.id}/history`
  const mockHistory = [
    {
      id: '1',
      timestamp: doc.updatedAt || new Date().toISOString(),
      user: doc.createdBy || 'System Admin',
      action: 'Updated Document',
      changes: [
        { field: 'Status', oldValue: 'Draft', newValue: doc.status || 'Active' },
        { field: 'Approval', oldValue: 'Pending', newValue: doc.approvalStatus || 'Approved' }
      ],
      revision: doc.revision || '1'
    },
    {
      id: '2',
      timestamp: doc.createdAt || new Date(Date.now() - 86400000).toISOString(),
      user: 'System',
      action: 'Created Document',
      changes: [],
      revision: '0'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Revision History</h2>
              <p className="text-xs text-zinc-400">Audit trail for {docNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Audit Trail Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-px before:bg-gradient-to-b before:from-white/10 before:via-white/10 before:to-transparent">
            {mockHistory.map((item) => (
              <div key={item.id} className="relative flex items-start gap-4 mb-8 last:mb-0 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#09090B] bg-blue-900/50 text-blue-400 shrink-0 z-10 group-hover:scale-110 transition-transform">
                  <User size={14} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-zinc-200">{item.action}</div>
                    <div className="text-xs text-zinc-500 font-mono">{formatDate(item.timestamp)}</div>
                  </div>
                  <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
                    <span className="text-white">{item.user}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span>Rev {item.revision}</span>
                  </div>

                  {item.changes.length > 0 && (
                    <div className="bg-black/40 border border-white/5 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                          <tr>
                            <th className="px-3 py-2 font-medium text-zinc-500">Field</th>
                            <th className="px-3 py-2 font-medium text-zinc-500">Previous Value</th>
                            <th className="px-3 py-2 font-medium text-zinc-500">New Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {item.changes.map((change, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02]">
                              <td className="px-3 py-2 text-zinc-300 font-medium">{change.field}</td>
                              <td className="px-3 py-2 text-zinc-500 line-through">{change.oldValue}</td>
                              <td className="px-3 py-2 text-green-400 flex items-center gap-2">
                                <ArrowRight size={12} className="text-zinc-600" />
                                {change.newValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
