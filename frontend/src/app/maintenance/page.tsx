"use client";

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { PageHeader } from '../../components/layout/PageHeader';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useMaintenanceTickets } from '../../hooks/useMaintenance';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketDrawer } from './components/TicketDrawer';
import { CreateTicketModal } from './components/CreateTicketModal';

export default function MaintenancePage() {
  const { data: tickets, isLoading } = useMaintenanceTickets();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Kanban logic
  const openTickets = tickets?.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS') || [];
  const resolvedTickets = tickets?.filter((t: any) => t.status === 'RESOLVED') || [];
  const activeLoto = tickets?.filter((t: any) => t.lotoApplied && t.status !== 'RESOLVED' && t.status !== 'CLOSED')?.length || 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#05070A]">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col relative z-0 pl-[5.5rem] pr-8 animate-fade-in py-8 overflow-y-auto hide-scrollbar">
        
        <PageHeader 
          title="Enterprise Asset Management" 
          description="Reactive Maintenance, Breakdown Ticketing, and Digital LOTO."
          icon={<Wrench />}
          colorHint="blue-500"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Maintenance' }
          ]}
          actions={
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-elevation transition-all"
            >
              <Plus className="w-4 h-4" />
              Report Breakdown
            </button>
          }
        />

        {/* Top KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mt-6 mb-8">
          <div className="spotlight-card p-6 border border-black/5 bg-white/70 rounded-2xl flex items-center gap-5">
            <div className="p-4 rounded-xl bg-red-500/10 text-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] border border-red-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-zinc-500 font-medium text-sm">Active Breakdowns</p>
              <h2 className="text-3xl font-bold text-zinc-900 mt-1">{openTickets.length}</h2>
            </div>
          </div>
          <div className="spotlight-card p-6 border border-black/5 bg-white/70 rounded-2xl flex items-center gap-5">
            <div className="p-4 rounded-xl bg-orange-500/10 text-orange-500 shadow-[inset_0_0_20px_rgba(249,115,22,0.1)] border border-orange-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-zinc-500 font-medium text-sm">Machines under LOTO</p>
              <h2 className="text-3xl font-bold text-zinc-900 mt-1">{activeLoto}</h2>
            </div>
          </div>
          <div className="spotlight-card p-6 border border-black/5 bg-white/70 rounded-2xl flex items-center gap-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-zinc-500 font-medium text-sm">Recently Resolved</p>
              <h2 className="text-3xl font-bold text-zinc-900 mt-1">{resolvedTickets.length}</h2>
            </div>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex-1 flex gap-6 min-h-0">
          
          {/* Active Tickets Column */}
          <div className="flex-1 flex flex-col min-h-0 bg-black/[0.02] rounded-3xl border border-black/5 p-6 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Active Work Orders
                <span className="ml-2 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">{openTickets.length}</span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pr-2">
              <AnimatePresence>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-black/5 rounded-2xl" />
                    ))}
                  </div>
                ) : openTickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/30" />
                    <p>No active breakdowns. All systems operational.</p>
                  </div>
                ) : (
                  openTickets.map((ticket: any) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`spotlight-card p-5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                        ticket.lotoApplied 
                          ? 'border-red-500/30 bg-red-500/5' 
                          : 'border-black/5 bg-[#F4F4F6] hover:bg-[#161616]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-zinc-500">{ticket.ticketNumber}</span>
                          {ticket.lotoApplied && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full border border-red-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> LOTO Active
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          ticket.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mb-2 line-clamp-1">{ticket.machine?.machineName}</h4>
                      <p className="text-sm text-zinc-500 line-clamp-2">{ticket.issueDescription}</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Resolved Tickets Column */}
          <div className="flex-1 flex flex-col min-h-0 bg-black/[0.02] rounded-3xl border border-black/5 p-6 shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Resolved (Waiting Closure)
                <span className="ml-2 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs">{resolvedTickets.length}</span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pr-2">
              <AnimatePresence>
                {resolvedTickets.map((ticket: any) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-mono text-zinc-500">{ticket.ticketNumber}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        RESOLVED
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-zinc-900 mb-2 line-clamp-1">{ticket.machine?.machineName}</h4>
                    <p className="text-sm text-zinc-500 line-clamp-2">{ticket.issueDescription}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>

      <TicketDrawer 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />

      <CreateTicketModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
