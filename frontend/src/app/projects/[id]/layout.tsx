"use client";

import React, { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useMasterData } from "@/hooks/useMasterData";
import { 
  Briefcase, 
  Layers, 
  Cpu, 
  Wrench, 
  Truck, 
  ShieldCheck, 
  PackageCheck, 
  DollarSign, 
  CheckSquare, 
  Calendar, 
  Building2,
  ArrowLeft,
  Activity,
  ShoppingCart,
  Factory,
  User,
  Edit,
  Lock
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params?.id as string;

  const { data: project } = useProject(id);
  const updateProjectMutation = useUpdateProject(id);
  const { data: employees = [] } = useMasterData('employees');

  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState("");

  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

  const rawOwner = (typeof project?.projectOwner === 'string' && project.projectOwner.trim())
    ? project.projectOwner
    : ((project?.projectOwner as any)?.name || (project?.manager as any)?.name || (typeof project?.manager === 'string' && project.manager.trim() ? project.manager : ""));

  const ownerDisplay = rawOwner.trim() ? rawOwner.trim() : "Unassigned";

  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwner) return;
    await updateProjectMutation.mutateAsync({
      projectOwner: selectedOwner,
      manager: selectedOwner,
    });
    setShowOwnerModal(false);
  };

  const tabs = [
    { label: "Overview", path: `/projects/${id}/overview`, icon: Briefcase },
    { label: "Design", path: `/projects/${id}/design`, icon: Layers },
    { label: "Engineering", path: `/projects/${id}/engineering`, icon: Cpu },
    { label: "Purchase", path: `/projects/${id}/purchase`, icon: ShoppingCart },
    { label: "Inventory", path: `/projects/${id}/inventory`, icon: PackageCheck },
    { label: "Subcontract", path: `/projects/${id}/subcontract`, icon: Truck },
    { label: "Production", path: `/projects/${id}/production`, icon: Wrench },
    { label: "Assembly", path: `/projects/${id}/assembly`, icon: Activity },
    { label: "Quality", path: `/projects/${id}/quality`, icon: ShieldCheck },
    { label: "Dispatch", path: `/projects/${id}/dispatch`, icon: Truck },
    { label: "Finance", path: `/projects/${id}/finance`, icon: DollarSign },
    { label: "Tasks", path: `/projects/${id}/tasks`, icon: CheckSquare },
  ];

  return (
    <AppLayout noPadding>
      <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
        {/* Sub Header */}
        <div className="w-full bg-white border-b border-border-gray shrink-0 shadow-subtle">
          {/* Upper Header Content */}
          <div className="w-full px-6 pt-4 pb-3">
            <div className="max-w-[1440px] mx-auto flex flex-col gap-3">
              {/* Upper Action Bar & Breadcrumb */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="white"
                    size="sm"
                    onClick={() => router.push('/projects')}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="bg-white border border-border-gray hover:bg-canvas text-ink text-xs font-medium rounded-[10px] shadow-subtle px-3 py-1.5"
                  >
                    Back to Projects
                  </Button>

                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-[6px] text-[11px] font-semibold font-mono bg-primary-subtle text-primary border border-primary/20 shrink-0">
                      {project?.projectNumber || "PRJ-2025-086"}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                      {project?.partName || "Fender Panel Draw Die"}
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-semibold text-mute">Stage:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20 shadow-subtle">
                    {typeof project?.currentStage === 'string' ? project.currentStage.replace(/_/g, " ") : "DISPATCHED"}
                  </span>
                </div>
              </div>

              {/* Quick Metadata Bar */}
              <div className="flex items-center gap-6 text-xs text-cool-gray font-medium flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cool-gray shrink-0" />
                  <span className="font-bold text-ink">{project?.customer?.companyName || project?.customerName || "Tata Motors Ltd"}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-mute font-sans">PO #:</span>
                  <span className="font-semibold text-ink">{project?.customerPoNumber || "PO/TATA/2025/0445"}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-4 h-4 text-mute shrink-0" />
                  <span>Target: {project?.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : "08 Aug 2026"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-mute shrink-0" />
                  <span>Owner: <strong className="text-ink font-semibold">{ownerDisplay}</strong></span>
                  {!isProjectClosed ? (
                    <button 
                      onClick={() => {
                        setSelectedOwner(ownerDisplay !== "Unassigned" ? ownerDisplay : "");
                        setShowOwnerModal(true);
                      }}
                      className="ml-1 p-1 hover:bg-canvas rounded text-primary transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      title="Assign Project Owner"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  ) : null}
                </div>

                {isProjectClosed && (
                  <div className="px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 inline-flex items-center gap-1.5 ml-auto">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Project Closed — Audit Locked (Read-Only)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edge-to-Edge Separator Line */}
          <div className="w-full border-t border-border-gray" />

          {/* Sub-Navigation Tabs */}
          <div className="w-full px-6 py-2">
            <div className="max-w-[1440px] mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.path || pathname?.startsWith(`${tab.path}/`);
                return (
                  <Link
                    key={tab.path}
                    href={tab.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-white font-semibold shadow-subtle"
                        : "text-cool-gray hover:text-ink hover:bg-cool-gray/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable View Content */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto overflow-y-auto p-6">
          {children}
        </div>

        {/* Assign Project Owner Modal */}
        <Modal
          isOpen={showOwnerModal}
          onClose={() => setShowOwnerModal(false)}
          title="Assign Project Owner"
          subtitle={`Assign a lead project engineer or manager to ${project?.projectNumber || 'this project'}.`}
        >
          <form onSubmit={handleSaveOwner} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Select Project Owner / Lead Manager</label>
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-[10px] text-xs text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Select Employee / Manager --</option>
                {employees.map((emp: any) => {
                  const deptLabel = typeof emp.department === 'object'
                    ? (emp.department?.departmentName || emp.department?.departmentCode || 'Staff')
                    : (typeof emp.department === 'string' ? emp.department : (emp.designation || 'Staff'));
                  const name = emp.name || emp.employeeName || 'Unknown Employee';
                  return (
                    <option key={emp.id} value={name}>
                      {name} ({deptLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Or Type Custom Owner Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full px-3 py-2 border border-border-gray rounded-[10px] text-xs text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
              <Button variant="white" type="button" onClick={() => setShowOwnerModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" isLoading={updateProjectMutation.isPending}>Save Assignment</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
