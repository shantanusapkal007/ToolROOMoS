'use client';

import React, { useState, useEffect } from 'react';
import { UniversalLayout } from "../../../components/layout/UniversalLayout";
import { Clock, Edit2, ArrowLeft, ChevronRight, Cpu, ShoppingCart, Package, Wrench, Shield, Truck, IndianRupee, BarChart3, Layers, FileText, Activity } from "lucide-react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LoadingState } from "../../../components/ui/LoadingState";
import { formatDate } from "../../../lib/formatters";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { useProject, useUpdateProject, useDeleteProject } from "../../../hooks/useProjects";
import { useUsers } from "../../../hooks/useUsers";
import { useMasterData } from "../../../hooks/useMasterData";

const PROJECT_TABS = [
  { id: 'overview', label: 'Overview', path: (id: string) => `/projects/${id}/overview`, icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'milestones', label: 'Milestones', path: (id: string) => `/projects/${id}/milestones`, icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'team', label: 'Team', path: (id: string) => `/projects/${id}/team`, icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'budget', label: 'Budget', path: (id: string) => `/projects/${id}/budget`, icon: <IndianRupee className="w-3.5 h-3.5" /> },
  { id: 'timeline', label: 'Timeline', path: (id: string) => `/projects/${id}/timeline`, icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'engineering', label: 'Engineering', path: (id: string) => `/projects/${id}/engineering`, icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: 'purchasing', label: 'Purchase', path: (id: string) => `/projects/${id}/purchasing`, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { id: 'stores', label: 'Inventory', path: (id: string) => `/projects/${id}/stores`, icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'production', label: 'Production', path: (id: string) => `/projects/${id}/production`, icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: 'assembly', label: 'Assembly', path: (id: string) => `/projects/${id}/assembly`, icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'quality', label: 'Quality', path: (id: string) => `/projects/${id}/quality`, icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'dispatch', label: 'Dispatch', path: (id: string) => `/projects/${id}/dispatch`, icon: <Truck className="w-3.5 h-3.5" /> },
  { id: 'finance', label: 'Finance', path: (id: string) => `/projects/${id}/finance`, icon: <IndianRupee className="w-3.5 h-3.5" /> },
  { id: 'reports', label: 'Reports', path: (id: string) => `/projects/${id}/reports`, icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'documents', label: 'Documents', path: (id: string) => `/projects/${id}/documents`, icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'history', label: 'History', path: (id: string) => `/projects/${id}/history`, icon: <Activity className="w-3.5 h-3.5" /> },
];

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

  const { data: customers } = useMasterData('customers');

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [editProjectNumber, setEditProjectNumber] = useState("");
  const [editPartName, setEditPartName] = useState("");
  const [editCustomerPo, setEditCustomerPo] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  
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

  // Determine active tab
  const getActiveTab = () => {
    for (const tab of PROJECT_TABS) {
      if (pathname.includes(`/${tab.id}`)) return tab.id;
    }
    return 'overview';
  };
  const activeTab = getActiveTab();

  const priorityColors: Record<string, string> = {
    LOW: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    NORMAL: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    HIGH: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  if (loading) {
    return (
      <UniversalLayout>
        <div className="flex-1 h-full flex items-center justify-center">
          <LoadingState message="Loading Project..." />
        </div>
      </UniversalLayout>
    );
  }

  if (!project) {
    return (
      <UniversalLayout>
        <div className="flex-1 h-full flex items-center justify-center text-zinc-500">
          Project Not Found
        </div>
      </UniversalLayout>
    );
  }

  const breadcrumb = (
    <>
      <button 
        onClick={() => router.push('/projects')} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title="Back to Projects"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center text-[12px] font-medium text-zinc-500">
        <Link href="/projects" className="hover:text-zinc-300 transition-colors">Projects</Link>
        <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
        <span className="text-emerald-400 font-semibold">{project.projectNumber}</span>
      </div>
    </>
  );

  const documentTabs = (
    <div className="flex gap-1 overflow-x-auto hide-scrollbar">
      {PROJECT_TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.path(project.id.replace('PRJ-', ''))}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition-all duration-200 shrink-0 rounded-t-lg ${
              isActive 
                ? 'text-white bg-white/[0.04]' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
            }`}
          >
            <span className={isActive ? 'text-emerald-400' : ''}>{tab.icon}</span>
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <UniversalLayout breadcrumb={breadcrumb} documentTabs={documentTabs}>
        <div className="flex flex-col mb-6 animate-fade-in">
          {/* Title + Status Row */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                {project.partName}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                {project.customerPoNumber && (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    PO: {project.customerPoNumber}
                  </span>
                )}
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                  project.currentStage === 'INVOICED' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  <div className={`w-1 h-1 rounded-full mr-1.5 ${
                    project.currentStage === 'INVOICED' ? 'bg-emerald-400' : 'bg-blue-400'
                  }`} />
                  {project.currentStage}
                </span>
                {project.priority && project.priority !== 'NORMAL' && (
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${priorityColors[project.priority] || priorityColors.NORMAL}`}>
                    {project.priority}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowDeliveryModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/[0.08] rounded-lg transition-all text-[11px] text-zinc-400 hover:text-white group"
              >
                <Clock className="h-3.5 w-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                <span className="font-medium">
                  {project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Set Delivery'}
                </span>
                <Edit2 className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
              
              <button
                onClick={() => setShowDeleteStep1(true)}
                className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                title="Delete Project"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 relative z-0 animate-fade-in-soft">
          {children}
        </div>
      </UniversalLayout>

      {/* Edit Project Details Modal */}
      <Modal isOpen={showDeliveryModal} onClose={() => setShowDeliveryModal(false)} title="Edit Project Details" maxWidth="2xl">
        <form onSubmit={handleUpdateProjectDetails} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
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
          <div className="grid grid-cols-2 gap-5">
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
          <div className="grid grid-cols-2 gap-5">
            <Select
              label="Customer"
              value={editCustomerId}
              onChange={(e) => setEditCustomerId(e.target.value)}
              options={(customers || []).map((c: any) => ({ label: c.companyName, value: c.id }))}
              required
            />
            <Select
              label="Priority"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Normal', value: 'NORMAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical', value: 'CRITICAL' },
              ]}
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">Remarks</label>
            <textarea 
              className="w-full bg-[#0A0D14]/80 backdrop-blur-xl border border-white/5 border-t-white/10 border-b-black/80 rounded-lg px-3 py-2 text-[13px] font-medium text-white placeholder-zinc-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.2)] focus:outline-none focus:bg-[#0F141E]/90 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:bg-[#121824]/90 hover:border-white/10 transition-all duration-300 min-h-[80px] resize-y" 
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
              placeholder="Project notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
            <Button type="button" variant="ghost" onClick={() => setShowDeliveryModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={updateProjectMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Step 1 */}
      <Modal isOpen={showDeleteStep1} onClose={() => setShowDeleteStep1(false)} title="Delete Project" maxWidth="md">
        <div className="space-y-4">
          <div className="p-4 bg-red-500/8 border border-red-500/15 rounded-lg text-[13px] text-red-200/80">
            <h4 className="font-bold text-red-400 mb-1 flex items-center text-[13px]">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Are you sure you want to delete this project?
            </h4>
            <p>This will permanently remove the project from the workspace.</p>
          </div>
          <div className="flex gap-3 pt-3 border-t border-white/[0.04]">
            <Button variant="ghost" onClick={() => setShowDeleteStep1(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDeleteProceedStep1} className="flex-1">Yes, Proceed</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Step 2 */}
      <Modal isOpen={showDeleteStep2} onClose={() => { setShowDeleteStep2(false); setDeleteConfirmationName(""); }} title="Confirm Deletion" maxWidth="md">
        <form onSubmit={handleFinalDelete} className="space-y-4">
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-[13px] text-red-200/80">
            <p className="mb-3 font-medium">Type the project number to confirm:</p>
            <div className="bg-black/40 p-2 rounded-lg text-center font-mono font-bold text-lg text-white mb-4 shadow-inner border border-white/[0.06]">
              {project.projectNumber}
            </div>
            <Input
              placeholder={`Type ${project.projectNumber} to confirm`}
              value={deleteConfirmationName}
              onChange={(e) => setDeleteConfirmationName(e.target.value)}
              required
              className="font-mono text-center"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setShowDeleteStep2(false); setDeleteConfirmationName(""); }} className="flex-1">Cancel</Button>
            <Button 
              type="submit" 
              variant="danger"
              disabled={deleteConfirmationName !== project.projectNumber || deleteProjectMutation.isPending}
              isLoading={deleteProjectMutation.isPending}
              className="flex-1"
            >
              Delete Permanently
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
