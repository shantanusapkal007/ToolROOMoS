import React from 'react';
import { History, User, Clock, FileText, CheckCircle2, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { motion } from 'framer-motion';

interface AuditEvent {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'ARCHIVED' | 'APPROVED' | 'DELETED' | 'STATUS_CHANGE' | string;
  timestamp: string;
  user: string;
  details?: string;
  entityType?: string;
  entityId?: string;
  snapshot?: any;
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
      case 'CREATED': return <FileText className="h-4 w-4 text-emerald-600" />;
      case 'UPDATED': return <Edit2 className="h-4 w-4 text-primary" />;
      case 'DELETED':
      case 'ARCHIVED': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'APPROVED': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'STATUS_CHANGE': return <History className="h-4 w-4 text-purple-600" />;
      default: return <Clock className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'bg-emerald-50 border-emerald-200';
      case 'UPDATED': return 'bg-primary-subtle border-blue-200';
      case 'DELETED':
      case 'ARCHIVED': return 'bg-red-50 border-red-200';
      case 'APPROVED': return 'bg-emerald-50 border-emerald-200';
      case 'STATUS_CHANGE': return 'bg-purple-50 border-purple-200';
      default: return 'bg-zinc-50 border-zinc-200';
    }
  };

  const renderChanges = (snapshot: any) => {
    if (!snapshot || !snapshot.changes || !Array.isArray(snapshot.changes)) return null;
    
    return (
      <div className="mt-3 space-y-2 bg-white/50 p-3 rounded-lg border border-black/5">
        {snapshot.changes.map((change: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 w-24 truncate" title={change.field}>{change.field}:</span>
            <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={String(change.old)}>
              {String(change.old || 'null')}
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={String(change.new)}>
              {String(change.new || 'null')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-black/10 before:to-transparent">
      {events.map((event, idx) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
          key={event.id || idx} 
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${getActionColor(event.action)} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-transform group-hover:scale-110 duration-300`}>
            {getActionIcon(event.action)}
          </div>
          
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-4 rounded-xl flex flex-col hover:border-blue-300/50 transition-all hover:shadow-elevation relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={event.action} />
                <span className="text-xs font-semibold text-slate-500">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              
              {event.entityType && (
                <div className="text-xs font-medium text-primary mb-1">
                  {event.entityType} <span className="text-zinc-400 font-normal">#{event.entityId}</span>
                </div>
              )}
              
              {event.details && (
                <p className="text-sm text-zinc-700 mb-3 leading-relaxed">{event.details}</p>
              )}
              
              {renderChanges(event.snapshot)}
              
              <div className="flex items-center text-xs text-zinc-500 mt-3 pt-3 border-t border-black/5">
                <User className="h-3 w-3 mr-1" />
                <span className="font-medium">{event.user}</span>
              </div>
            </div>
          </div>

        </motion.div>
      ))}
    </div>
  );
};
