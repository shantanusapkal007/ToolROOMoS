"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../lib/api";
import { Sidebar } from "../../../components/layout/Sidebar";
import { PageHeader } from "../../../components/layout/PageHeader";
import { WorkflowTimeline } from "../../../components/workspace/WorkflowTimeline";
import { Clock, Calendar as CalendarIcon, Edit2, Briefcase } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoadingState } from "../../../components/ui/LoadingState";
import { formatDate } from "../../../lib/formatters";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { Input } from "../../../components/ui/Input";
import { useProject, useUpdateProject, useDeleteProject } from "../../../hooks/useProjects";
import { useUsers } from "../../../hooks/useUsers";
import { useMasterData } from "../../../hooks/useMasterData";
import { useRouter } from "next/navigation";

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
  const deleteProjectMutation = useDeleteProject(resolvedParams.id);
  const pathname = usePathname();
  const router = useRouter();
  const { success, error } = useToast();

  const { data: usersResult } = useUsers();
  const users = usersResult?.data || [];
  const projectOwnerUser = users.find((u: any) => u.name === project?.projectOwner);

  const { data: customers } = useMasterData('customers');

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [editProjectNumber, setEditProjectNumber] = useState("");
  const [editPartName, setEditPartName] = useState("");
  const [editCustomerPo, setEditCustomerPo] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");

  const [editPriority, setEditPriority] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  
  // Deletion States
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState("");

  useEffect(() => {
    if (project) {
      if (project.targetDeliveryDate) {
        setTargetDate(new Date(project.targetDeliveryDate).toISOString().split('T')[0]);
      }
      setEditProjectNumber(project.projectNumber || "");
      setEditPartName(project.partName || "");
      setEditCustomerPo(project.customerPoNumber || "");
      setEditCustomerId(project.customerId || "");
      setEditPriority(project.priority || "NORMAL");
      setEditRemarks(project.remarks || "");
    }
  }, [project]);

  const handleUpdateProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await updateProjectMutation.mutateAsync({
        projectNumber: editProjectNumber,
        partName: editPartName,
        customerPoNumber: editCustomerPo,
        customerId: editCustomerId,
        priority: editPriority as any,
        targetDeliveryDate: targetDate,
        remarks: editRemarks,
      });
      setShowDeliveryModal(false);
    } catch (err: any) {
      // Error handled by mutation hook
    }
  };

  const handleDeleteProceedStep1 = () => {
    setShowDeleteStep1(false);
    setShowDeleteStep2(true);
  };

  const handleFinalDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationName !== project?.projectNumber) {
      error("Mismatch", "Project number does not match. Deletion cancelled.");
      return;
    }
    try {
      await deleteProjectMutation.mutateAsync();
      setShowDeleteStep2(false);
      router.push('/projects');
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
        <main className="flex-1 h-full flex flex-col relative z-0 pl-[5.5rem]">
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
      <main className="flex-1 h-full flex flex-col relative z-0 pl-[5.5rem]">
        <div className="flex-1 h-full flex flex-col animate-slide-up min-h-0 overflow-hidden">
            
          {/* Premium Ultra-Dense Context Header */}
          <PageHeader 
            title={project.partName || 'Unknown Project'} 
            description={`PO: ${project.customerPoNumber || 'N/A'}`}
            icon={<Briefcase />}
            colorHint="blue-500"
            breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.projectNumber }]}
            actions={
              <div className="flex items-center space-x-3 z-10">
                <span className={`flex items-center text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border shadow-[0_0_10px_rgba(0,0,0,0.2)] ${
                  project.currentStage === 'INVOICED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${project.currentStage === 'INVOICED' ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]'}`} />
                  {project.currentStage}
                </span>

                <button 
                  onClick={() => setShowDeliveryModal(true)}
                  className="group relative flex items-center bg-black/40 hover:bg-black/60 border border-white/10 hover:border-blue-500/50 shadow-inner rounded-xl px-4 py-2 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <Clock className="h-4 w-4 mr-2.5 text-blue-500 group-hover:text-blue-400 relative z-10" />
                  <span className={`relative z-10 text-xs font-bold ${project.targetDeliveryDate ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                    {project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Delivery: Not Set'}
                  </span>
                  <Edit2 className="h-3.5 w-3.5 ml-3 text-slate-500 group-hover:text-blue-400 transition-colors relative z-10" />
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={() => setShowDeleteStep1(true)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-all shadow-inner"
                  title="Delete Project"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            }
          />


          {/* Project Navigation Tabs */}
          <div className="flex space-x-6 border-b border-white/5 px-6 pt-2 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar hide-on-print">
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
          <div className="flex-1 min-h-0 relative z-0 px-6 pt-4 pb-2 overflow-y-auto hide-scrollbar flex flex-col">
            {children}
          </div>

        </div>
      </main>

      {/* Edit Project Details Modal */}
      <Modal isOpen={showDeliveryModal} onClose={() => setShowDeliveryModal(false)} title="Edit Mission Details">
        <form onSubmit={handleUpdateProjectDetails} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Project Number"
              value={editProjectNumber}
              onChange={(e) => setEditProjectNumber(e.target.value)}
              required
            />
            <Input
              label="Part Name"
              value={editPartName}
              onChange={(e) => setEditPartName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer PO Number"
              value={editCustomerPo}
              onChange={(e) => setEditCustomerPo(e.target.value)}
            />
            <Input
              label="Target Delivery Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer</label>
              <select 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all appearance-none" 
                value={editCustomerId}
                onChange={e => setEditCustomerId(e.target.value)}
                required
              >
                {customers?.map((cust: any) => (
                  <option key={cust.id} value={cust.id} className="bg-[#0B1018] text-white">
                    {cust.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
              <select 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all appearance-none" 
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
                required
              >
                <option value="LOW" className="bg-[#0B1018]">LOW</option>
                <option value="NORMAL" className="bg-[#0B1018]">NORMAL</option>
                <option value="HIGH" className="bg-[#0B1018]">HIGH</option>
                <option value="CRITICAL" className="bg-[#0B1018]">CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Remarks</label>
              <textarea 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[80px] resize-none" 
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Project notes/remarks..."
              />
            </div>
          </div>
          <div className="flex space-x-3 pt-4 border-t border-white/10 mt-6">
            <button type="button" onClick={() => setShowDeliveryModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Step 1: Soft Warning */}
      <Modal isOpen={showDeleteStep1} onClose={() => setShowDeleteStep1(false)} title="Delete Project" maxWidth="md">
        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm">
            <h4 className="font-bold text-red-400 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Are you sure you want to delete this project?
            </h4>
            <p>This action will permanently hide the project from the active workspace. It will be marked as DELETED in the database.</p>
          </div>
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setShowDeleteStep1(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
            <button type="button" onClick={handleDeleteProceedStep1} className="flex-1 px-4 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 font-bold text-red-400 transition-all">Yes, Proceed</button>
          </div>
        </div>
      </Modal>

      {/* Delete Step 2: Hard Confirmation */}
      <Modal isOpen={showDeleteStep2} onClose={() => { setShowDeleteStep2(false); setDeleteConfirmationName(""); }} title="Confirm Deletion" maxWidth="md">
        <form onSubmit={handleFinalDelete} className="space-y-4">
          <div className="p-4 bg-red-900/40 border border-red-500/40 rounded-xl text-red-200 text-sm mb-4">
            <p className="mb-3 font-medium">To confirm, please type the project number exactly as it appears below:</p>
            <div className="bg-black/50 p-2 rounded text-center font-mono font-bold text-lg text-white mb-4 shadow-inner border border-white/10">
              {project.projectNumber}
            </div>
            <Input
              placeholder={`Type ${project.projectNumber} to confirm`}
              value={deleteConfirmationName}
              onChange={(e) => setDeleteConfirmationName(e.target.value)}
              required
              className="font-mono text-center border-red-500/30 focus:border-red-500"
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={() => { setShowDeleteStep2(false); setDeleteConfirmationName(""); }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={deleteConfirmationName !== project.projectNumber || deleteProjectMutation.isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all"
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
