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

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { success, error } = useToast();

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
      if (res.data.targetDeliveryDate) {
        setTargetDate(new Date(res.data.targetDeliveryDate).toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await api.put(`projects/${project.id}`, {
        targetDeliveryDate: targetDate
      });
      success("Updated", "Delivery Target Date has been updated.");
      setShowDeliveryModal(false);
      loadProjectDetails(project.id);
    } catch (err: any) {
      error("Update Failed", err.message);
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
        <main className="flex-1 h-full flex flex-col relative z-0 pl-16">
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
      <main className="flex-1 h-full flex flex-col relative z-0 pl-16">
        <div className="flex-1 h-full flex flex-col pl-32 pr-12 animate-slide-up">
            
          {/* Linear Style Context Header */}
          <header className="pt-12 pb-8 flex flex-col justify-between shrink-0">
            <div className="flex items-center text-sm font-semibold text-slate-500 mb-6 uppercase tracking-widest">
              <Link href="/projects" className="hover:text-white cursor-pointer transition-colors">Projects</Link>
              <span className="mx-2">/</span>
              <span className="text-blue-400">{project.projectNumber}</span>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-h1 tracking-tight text-white mb-2">{project.partName}</h1>
                <p className="text-h6 text-slate-400 font-normal">Customer PO: {project.customerPoNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400 mb-2">Delivery Target</div>
                <button 
                  onClick={() => setShowDeliveryModal(true)}
                  className="group flex items-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-xl px-4 py-2 transition-all"
                >
                  <Clock className="h-5 w-5 mr-3 text-blue-500 group-hover:text-blue-400" />
                  <span className={`text-lg font-bold ${project.targetDeliveryDate ? 'text-white' : 'text-slate-400 italic'}`}>
                    {project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Not Set'}
                  </span>
                  <Edit2 className="h-4 w-4 ml-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                </button>
              </div>
            </div>
          </header>

          {/* Visual Timeline Navigation */}
          <WorkflowTimeline currentStage={project.currentStage} />

          {/* Project Navigation Tabs */}
          <div className="flex space-x-8 border-b border-white/10 mb-8 mt-4 px-2 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
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

          {/* Tab Content injected here by Next.js router */}
          {children}

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
