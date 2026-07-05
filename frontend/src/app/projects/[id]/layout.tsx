"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../lib/api";
import { Sidebar } from "../../../components/layout/Sidebar";
import { WorkflowTimeline } from "../../../components/workspace/WorkflowTimeline";
import { Clock, Calendar as CalendarIcon, Edit2 } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoadingState } from "../../../components/ui/LoadingState";
import { formatDate } from "../../../lib/formatters";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { Input } from "../../../components/ui/Input";
import { useProject, useUpdateProject } from "../../../hooks/useProjects";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const { data: project, isLoading: loading } = useProject(resolvedParams.id);
  const updateProjectMutation = useUpdateProject(resolvedParams.id);
  const pathname = usePathname();
  const { success, error } = useToast();

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    if (project?.targetDeliveryDate && !targetDate) {
      setTargetDate(new Date(project.targetDeliveryDate).toISOString().split('T')[0]);
    }
  }, [project]);

  const handleUpdateDeliveryDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await updateProjectMutation.mutateAsync({
        targetDeliveryDate: targetDate
      });
      setShowDeliveryModal(false);
    } catch (err: any) {
      // Error handled by mutation hook
    }
  };

  const getTabClass = (pathNameSuffix: string) => {
    const isActive = pathname.endsWith(pathNameSuffix);
    return `pb-4 text-sm font-bold tracking-wider uppercase transition-all ${
      isActive 
        ? "text-blue-400 border-b-2 border-blue-400" 
        : "text-slate-400 hover:text-slate-200"
    }`;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
        <Sidebar />
        <main className="flex-1 h-full flex flex-col relative z-0" style={{ paddingLeft: '76px' }}>
          <LoadingState message="Initializing Project Core..." />
        </main>
      </div>
    );
  }

  if (!project) {
    return <div className="flex items-center justify-center h-screen w-screen bg-[#0B1120] text-white">Project Not Found</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative z-0" style={{ paddingLeft: '76px' }}>
        <div className="flex-1 h-full flex flex-col animate-slide-up min-h-0 overflow-hidden">
            
          {/* Premium Ultra-Dense Context Header */}
          <header className="relative flex items-center justify-between shrink-0 px-6 py-3 bg-white/[0.02] backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20">
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent blur-[1px]" />
            
            <div className="flex items-center space-x-4 relative z-10">
              <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-black/40 shadow-inner px-3 py-1.5 rounded-lg border border-white/5">
                <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
                <span className="mx-2 opacity-40">/</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{project.projectNumber}</span>
              </div>
              
              <h1 className="text-xl font-bold text-white tracking-tight truncate max-w-sm flex items-center">
                {project.partName}
              </h1>
              
              <div className="flex items-center space-x-2">
                <span className="flex items-center text-xs text-slate-300 font-mono bg-white/[0.03] border border-white/10 px-2.5 py-1 rounded-md shadow-sm">
                  <span className="text-slate-500 mr-1.5">PO:</span> {project.customerPoNumber}
                </span>
                
                <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${
                  project.currentStage === 'INVOICED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${project.currentStage === 'INVOICED' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]'}`} />
                  {project.currentStage}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setShowDeliveryModal(true)}
              className="group relative flex items-center bg-black/40 hover:bg-black/60 border border-white/10 hover:border-blue-500/50 shadow-inner rounded-xl px-4 py-2 transition-all duration-300 z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              <Clock className="h-4 w-4 mr-2.5 text-blue-500 group-hover:text-blue-400 relative z-10" />
              <span className={`relative z-10 text-xs font-bold ${project.targetDeliveryDate ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                {project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Delivery: Not Set'}
              </span>
              <Edit2 className="h-3.5 w-3.5 ml-3 text-slate-500 group-hover:text-blue-400 transition-colors relative z-10" />
            </button>
          </header>

          {/* Project Navigation Tabs */}
          <div className="flex space-x-6 border-b border-white/5 px-6 pt-2 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link href={`/projects/${project.id}/overview`} className={getTabClass('/overview')}>Overview</Link>
            <Link href={`/projects/${project.id}/tasks`} className={getTabClass('/tasks')}>Tasks & WBS</Link>
            <Link href={`/projects/${project.id}/engineering`} className={getTabClass('/engineering')}>Engineering</Link>
            <Link href={`/projects/${project.id}/purchase`} className={getTabClass('/purchase')}>Purchase</Link>
            <Link href={`/projects/${project.id}/inventory`} className={getTabClass('/inventory')}>Inventory</Link>
            <Link href={`/projects/${project.id}/production`} className={getTabClass('/production')}>Production</Link>
            <Link href={`/projects/${project.id}/subcontract`} className={getTabClass('/subcontract')}>Subcontract</Link>
            <Link href={`/projects/${project.id}/quality`} className={getTabClass('/quality')}>Quality</Link>
            <Link href={`/projects/${project.id}/dispatch`} className={getTabClass('/dispatch')}>Dispatch</Link>
            <Link href={`/projects/${project.id}/finance`} className={getTabClass('/finance')}>Finance</Link>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 relative z-0 px-6 pt-4 pb-2 overflow-hidden flex flex-col">
            {children}
          </div>

        </div>
      </main>

      {/* Delivery Target Modal */}
      <Modal isOpen={showDeliveryModal} onClose={() => setShowDeliveryModal(false)} title="Update Delivery Target">
        <form onSubmit={handleUpdateDeliveryDate} className="space-y-4">
          <Input
            label="Target Delivery Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
          <div className="flex space-x-3 pt-4 border-t border-white/10 mt-6">
            <button type="button" onClick={() => setShowDeliveryModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
