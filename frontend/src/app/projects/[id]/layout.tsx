"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../lib/api";
import { Sidebar } from "../../../components/layout/Sidebar";
import { WorkflowTimeline } from "../../../components/workspace/WorkflowTimeline";
import { Clock } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setLoading(false);
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
    return <div className="flex items-center justify-center h-screen w-screen bg-[#0B1120] text-white">Loading Project...</div>;
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
                <div className="text-h4 font-bold text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  {project.targetDeliveryDate ? new Date(project.targetDeliveryDate).toLocaleDateString() : 'Not Set'}
                </div>
              </div>
            </div>
          </header>

          {/* Visual Timeline Navigation */}
          <WorkflowTimeline currentStage={project.currentStage} />

          {/* Project Navigation Tabs */}
          <div className="flex space-x-8 border-b border-white/10 mb-8 mt-4 px-2 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link href={`/projects/${project.id}/overview`} className={getTabClass('/overview')}>Overview</Link>
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
    </div>
  );
}
