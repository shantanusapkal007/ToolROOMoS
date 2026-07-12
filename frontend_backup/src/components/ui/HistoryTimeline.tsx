import React from 'react';
import { History, User, Clock, FileText, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface AuditEvent {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'ARCHIVED' | 'APPROVED';
  timestamp: string;
  user: string;
  details?: string;
}

interface HistoryTimelineProps {
  events: AuditEvent[];
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
        <History className="h-8 w-8 mb-4 opacity-50" />
        <p className="text-sm">No history available for this record.</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED': return <FileText className="h-4 w-4 text-emerald-400" />;
      case 'UPDATED': return <Edit2 className="h-4 w-4 text-blue-400" />;
      case 'ARCHIVED': return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'APPROVED': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
      {events.map((event, idx) => (
        <div key={event.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0B1018] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
            {getActionIcon(event.action)}
          </div>
          
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded-xl flex flex-col hover:border-blue-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={event.action} />
              <span className="text-xs font-semibold text-slate-500">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            
            {event.details && (
              <p className="text-sm text-slate-300 mb-3">{event.details}</p>
            )}
            
            <div className="flex items-center text-xs text-slate-400">
              <User className="h-3 w-3 mr-1" />
              {event.user}
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};
