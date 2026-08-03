"use client";

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { PageHeader } from '../../components/layout/PageHeader';
import { Wrench, AlertTriangle, CheckCircle2, Clock, Plus, ShieldCheck } from 'lucide-react';
import { useMaintenanceTickets } from '../../hooks/useMaintenance';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketDrawer } from './components/TicketDrawer';
import { CreateTicketModal } from './components/CreateTicketModal';
import { Button } from '../../components/ui/Button';

export default function MaintenancePage() {
  const { data: tickets, isLoading } = useMaintenanceTickets();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const openTickets = tickets?.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS') || [];
  const resolvedTickets = tickets?.filter((t: any) => t.status === 'RESOLVED') || [];
  const activeLoto = tickets?.filter((t: any) => t.lotoApplied && t.status !== 'RESOLVED' && t.status !== 'CLOSED')?.length || 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-6">
          
          <PageHeader 
            title="Machine Maintenance OS" 
            description="Reactive Maintenance, Breakdown Ticketing, and Digital LOTO Safety Tracking."
            icon={<Wrench />}
            breadcrumbs={[
              { label: 'Dashboard', href: '/' },
              { label: 'Maintenance' }
            ]}
            actions={
              <Button 
                variant="primary" 
                size="md"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Report Breakdown</span>
              </Button>
            }
          />

          {/* Top Analytical KPI Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">Active Breakdowns</span>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">{openTickets.length}</div>
              </div>
              <div className="w-8 h-8 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">Active LOTO Locks</span>
                <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{activeLoto}</div>
              </div>
              <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">Resolved Breakdowns</span>
                <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{resolvedTickets.length}</div>
              </div>
              <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Maintenance Kanban / List Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            
            {/* Open Tickets Column */}
            <div className="enterprise-panel p-4 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-3">
                <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Open & In-Progress Tickets ({openTickets.length})</span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                {openTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-3.5 rounded-md border border-zinc-200 bg-white hover:border-zinc-300 transition-colors cursor-pointer space-y-2 shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-micro font-mono text-zinc-500 font-bold">{ticket.ticketNumber}</span>
                      <span className={`text-micro font-bold px-2 py-0.5 rounded border ${
                        ticket.priority === 'CRITICAL' ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {ticket.priority || ticket.status}
                      </span>
                    </div>

                    <h4 className="text-caption font-bold text-zinc-900">{ticket.machine?.machineName || 'Unknown Asset'}</h4>
                    <p className="text-caption text-zinc-600 line-clamp-2">{ticket.issueDescription}</p>

                    {ticket.lotoApplied && (
                      <span className="inline-flex items-center text-micro font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        LOTO ACTIVE
                      </span>
                    )}
                  </div>
                ))}

                {openTickets.length === 0 && (
                  <div className="py-12 text-center text-zinc-400 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-body font-semibold text-zinc-700">Zero Open Breakdowns</p>
                    <p className="text-caption text-zinc-400">All machine assets are fully operational.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resolved Tickets Column */}
            <div className="enterprise-panel p-4 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-3">
                <h3 className="text-card-title font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolved Machine Tickets ({resolvedTickets.length})</span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
                {resolvedTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-3.5 rounded-md border border-zinc-200 bg-white hover:border-zinc-300 transition-colors cursor-pointer space-y-2 shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-micro font-mono text-zinc-500 font-bold">{ticket.ticketNumber}</span>
                      <span className="text-micro font-bold px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
                        RESOLVED
                      </span>
                    </div>

                    <h4 className="text-caption font-bold text-zinc-900">{ticket.machine?.machineName || 'Unknown Asset'}</h4>
                    <p className="text-caption text-zinc-600 line-clamp-2">{ticket.issueDescription}</p>
                  </div>
                ))}

                {resolvedTickets.length === 0 && (
                  <div className="py-12 text-center text-zinc-400">
                    <p className="text-caption">No resolved ticket history available.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

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
