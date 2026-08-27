"use client";

import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ShieldCheck,
  Cpu,
  Layers,
  Filter,
  Activity,
  Briefcase,
} from 'lucide-react';
import { useMaintenanceTickets } from '../../hooks/useMaintenance';
import { motion, AnimatePresence } from 'framer-motion';
import { TicketDrawer } from './components/TicketDrawer';
import { CreateTicketModal } from './components/CreateTicketModal';
import { Button } from '../../components/ui/Button';

type FilterTab = 'ALL' | 'MACHINE' | 'DIE_TOOL';

export default function MaintenancePage() {
  const { data: rawTickets, isLoading } = useMaintenanceTickets();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTargetType, setCreateModalTargetType] = useState<'MACHINE' | 'DIE_TOOL'>('MACHINE');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const tickets = Array.isArray(rawTickets)
    ? rawTickets
    : Array.isArray((rawTickets as any)?.data)
    ? (rawTickets as any).data
    : [];

  // Filtered by Asset Type tab
  const filteredTickets = tickets.filter((t: any) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'DIE_TOOL') return t.targetType === 'DIE_TOOL';
    return t.targetType !== 'DIE_TOOL'; // 'MACHINE' by default
  });

  const openTickets = filteredTickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const resolvedTickets = filteredTickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED');

  // Overall analytical counts
  const totalOpenCount = tickets.filter((t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const activeDieBreakages = tickets.filter((t: any) => t.targetType === 'DIE_TOOL' && (t.status === 'OPEN' || t.status === 'IN_PROGRESS')).length;
  const activeMachineBreakdowns = tickets.filter((t: any) => t.targetType !== 'DIE_TOOL' && (t.status === 'OPEN' || t.status === 'IN_PROGRESS')).length;
  const activeLoto = tickets.filter((t: any) => t.lotoApplied && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const totalResolved = tickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const handleOpenCreateModal = (type: 'MACHINE' | 'DIE_TOOL') => {
    setCreateModalTargetType(type);
    setIsCreateModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="w-full h-full flex flex-col min-h-0 space-y-6">
        <PageHeader 
          title="Maintenance & Toolroom Breakage OS" 
          description="Reactive machine breakdown ticketing, die damage & punch breakage management, and digital LOTO safety tracking."
          icon={<Wrench />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Maintenance' }
          ]}
          actions={
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button 
                variant="white" 
                size="md"
                onClick={() => handleOpenCreateModal('DIE_TOOL')}
                className="border-amber-400/80 text-amber-800 hover:bg-amber-50 shadow-subtle"
              >
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Report Die Breakage</span>
              </Button>

              <Button 
                variant="primary" 
                size="md"
                onClick={() => handleOpenCreateModal('MACHINE')}
              >
                <Cpu className="w-4 h-4" />
                <span>Report Machine Breakdown</span>
              </Button>
            </div>
          }
        />

        {/* Analytical KPI Strips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Die Breakages */}
          <div className="enterprise-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <span className="text-micro font-semibold uppercase text-mute">Active Die Breakages</span>
              <div className="text-2xl font-semibold font-mono text-amber-700 mt-1">{activeDieBreakages}</div>
              <span className="text-[10px] text-mute">Punches, inserts, springs</span>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          {/* Active Machine Breakdowns */}
          <div className="enterprise-card p-4 flex items-center justify-between border-l-4 border-l-red-500">
            <div>
              <span className="text-micro font-semibold uppercase text-mute">Active Machine Faults</span>
              <div className="text-2xl font-semibold font-mono text-red-600 mt-1">{activeMachineBreakdowns}</div>
              <span className="text-[10px] text-mute">CNC, VMC, press shop</span>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          {/* Active LOTO Safety Locks */}
          <div className="enterprise-card p-4 flex items-center justify-between">
            <div>
              <span className="text-micro font-semibold uppercase text-mute">Active LOTO Locks</span>
              <div className="text-2xl font-semibold font-mono text-amber-600 mt-1">{activeLoto}</div>
              <span className="text-[10px] text-mute">Digital isolation tags</span>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Resolved Maintenance Tickets */}
          <div className="enterprise-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <span className="text-micro font-semibold uppercase text-mute">Resolved Repairs</span>
              <div className="text-2xl font-semibold font-mono text-emerald-600 mt-1">{totalResolved}</div>
              <span className="text-[10px] text-mute">Completed work orders</span>
            </div>
            <div className="w-9 h-9 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center p-1 bg-canvas rounded-[12px] border border-border-gray gap-1">
          {[
            { id: 'ALL', label: 'All Breakdowns', count: tickets.length, icon: Activity },
            { id: 'DIE_TOOL', label: 'Dies & Press Tools', count: tickets.filter((t: any) => t.targetType === 'DIE_TOOL').length, icon: Wrench },
            { id: 'MACHINE', label: 'Machines & Equipment', count: tickets.filter((t: any) => t.targetType !== 'DIE_TOOL').length, icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-subtle font-bold'
                    : 'text-cool-gray hover:text-ink hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-cool-gray/10 text-cool-gray'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Maintenance Kanban / List Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          
          {/* Open Tickets Column */}
          <div className="enterprise-panel p-4 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center border-b border-border-gray pb-3 mb-3">
              <h3 className="text-card-title font-semibold text-ink flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Open & In-Progress Tickets ({openTickets.length})</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
              {openTickets.map((ticket: any) => {
                const isDie = ticket.targetType === 'DIE_TOOL';
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-3.5 rounded-[12px] border border-border-gray bg-white hover:border-primary/50 transition-all cursor-pointer space-y-2 shadow-subtle"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-micro font-mono text-mute font-bold">{ticket.ticketNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          isDie ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {isDie ? 'DIE TOOL' : 'MACHINE'}
                        </span>
                      </div>

                      <span className={`text-micro font-semibold px-2 py-0.5 rounded border ${
                        ticket.priority === 'CRITICAL' ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {ticket.priority || ticket.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-caption font-bold text-ink flex items-center gap-1.5">
                        {isDie ? <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <span>{isDie ? (ticket.dieToolName || 'Stamping Die') : (ticket.machine?.machineName || 'Machine Asset')}</span>
                      </h4>

                      {isDie && ticket.brokenComponent && (
                        <p className="text-[11px] font-medium text-amber-900 mt-0.5">
                          Damaged: <span className="font-bold">{ticket.brokenComponent}</span>
                          {ticket.strokeCountAtFailure ? ` • ${Number(ticket.strokeCountAtFailure).toLocaleString()} hits` : ''}
                        </p>
                      )}
                    </div>

                    <p className="text-caption text-zinc-600 line-clamp-2">{ticket.issueDescription}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isDie && ticket.actionRequired && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          {ticket.actionRequired.replace(/_/g, ' ')}
                        </span>
                      )}

                      {ticket.project && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          <Briefcase className="w-3 h-3" />
                          {ticket.project.projectNumber}
                        </span>
                      )}

                      {ticket.lotoApplied && (
                        <span className="inline-flex items-center text-micro font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          LOTO ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {openTickets.length === 0 && (
                <div className="py-12 text-center text-zinc-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-body font-semibold text-zinc-700">Zero Open Breakdowns</p>
                  <p className="text-caption text-zinc-400">All tools and machines are fully operational.</p>
                </div>
              )}
            </div>
          </div>

          {/* Resolved Tickets Column */}
          <div className="enterprise-panel p-4 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center border-b border-border-gray pb-3 mb-3">
              <h3 className="text-card-title font-semibold text-ink flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resolved Tickets ({resolvedTickets.length})</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
              {resolvedTickets.map((ticket: any) => {
                const isDie = ticket.targetType === 'DIE_TOOL';
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-3.5 rounded-[12px] border border-border-gray bg-white hover:border-border-gray transition-colors cursor-pointer space-y-2 shadow-subtle"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-micro font-mono text-mute font-bold">{ticket.ticketNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          isDie ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {isDie ? 'DIE TOOL' : 'MACHINE'}
                        </span>
                      </div>

                      <span className="text-micro font-semibold px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
                        RESOLVED
                      </span>
                    </div>

                    <h4 className="text-caption font-semibold text-ink flex items-center gap-1.5">
                      {isDie ? <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span>{isDie ? (ticket.dieToolName || 'Stamping Die') : (ticket.machine?.machineName || 'Machine Asset')}</span>
                    </h4>

                    <p className="text-caption text-zinc-600 line-clamp-2">{ticket.issueDescription}</p>
                  </div>
                );
              })}

              {resolvedTickets.length === 0 && (
                <div className="py-12 text-center text-zinc-400">
                  <p className="text-caption">No resolved ticket history available for this filter.</p>
                </div>
              )}
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
        initialTargetType={createModalTargetType}
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </AppLayout>
  );
}
