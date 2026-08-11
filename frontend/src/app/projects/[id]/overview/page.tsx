"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject, useAdvanceProjectStage, useDeleteProject, useCompleteProject } from "@/hooks/useProjects";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  Building2, 
  User, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Wrench,
  FileText,
  PackageCheck,
  ShoppingCart,
  ChevronRight,
  CheckSquare,
  Sparkles,
  Factory,
  Trash2,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

import { useGlobalDailyReports } from "@/hooks/useDailyReports";

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: project, isLoading, error } = useProject(id);
  const { data: globalReportsRes = [] } = useGlobalDailyReports({ projectId: id });
  const advanceStageMutation = useAdvanceProjectStage(id);
  const deleteProjectMutation = useDeleteProject(id);
  const completeProjectMutation = useCompleteProject(id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionRemarks, setCompletionRemarks] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonBox className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonBox className="h-28" />
          <SkeletonBox className="h-28" />
          <SkeletonBox className="h-28" />
          <SkeletonBox className="h-28" />
        </div>
        <SkeletonBox className="h-64 w-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-white rounded-[12px] border border-border-gray p-8 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-semibold text-ink">Project Not Found</h3>
        <p className="text-xs text-mute">Could not retrieve details for project ID: {id}</p>
      </div>
    );
  }

  const STAGES = [
    'CREATED',
    'ENQUIRY',
    'QUOTATION',
    'ORDER_CONFIRMED',
    'DESIGN_CAD',
    'CAM_PROGRAMMING',
    'MACHINING',
    'BENCH_ASSEMBLY',
    'TRYOUT',
    'QUALITY_INSPECTION',
    'DISPATCH',
    'CLOSED'
  ];

  const currentStageIdx = Math.max(0, STAGES.indexOf(project.currentStage || 'CREATED'));
  const progressPercent = Math.round(((currentStageIdx + 1) / STAGES.length) * 100);

  // Calculate target delivery countdown
  let daysRemaining = null;
  if (project.targetDeliveryDate) {
    const target = new Date(project.targetDeliveryDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Real BOM & Procurement metrics
  const bomHeaders = project.billOfMaterialHeaders || [];
  let totalBomItemsCount = 0;
  bomHeaders.forEach((b: any) => {
    totalBomItemsCount += (b.items || []).length;
  });

  const grnReceivedCount = (project.goodsReceiptHeaders || []).length;
  const poHeaders = project.purchaseOrderHeaders || [];
  const poInProgressCount = poHeaders.filter((po: any) => po.status !== 'CLOSED' && po.status !== 'CANCELLED').length;

  // Real Machining & Floor Logs metrics
  const reports = Array.isArray(globalReportsRes) ? globalReportsRes : (globalReportsRes as any)?.data || [];
  const totalMachineHours = reports.reduce((sum: number, r: any) => {
    const setup = Number(r.setupTime || 0);
    const cutting = Number(r.cuttingTime || (r.type === 'MSDR' ? Number(r.hoursSpent || 0) : 0));
    return sum + setup + cutting;
  }, 0);

  // Format plant name clean
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(str);
  const formattedPlant = !project.plantId || isUuid(project.plantId) 
    ? "Toolroom Main Facility" 
    : project.plantId;

  return (
    <div className="space-y-5 text-ink font-sans pb-12">
      
      {/* Sleek Enterprise Page Header */}
      <div className="bg-white border border-border-gray/80 rounded-[12px] p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs font-semibold text-zinc-400 mb-1">
            <span>Projects</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-300" />
            <span className="font-mono font-semibold text-zinc-800">{project.projectNumber}</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-300" />
            <span className="text-zinc-950 font-semibold">Overview & KPIs</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-zinc-900 text-white flex items-center justify-center font-semibold shadow-subtle">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-zinc-950 tracking-tight">
                  {project.partName || 'Tooling Project'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {project.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-mute font-medium mt-0.5">
                {project.description || 'No description provided for this tooling mission.'}
              </p>
            </div>
          </div>
        </div>

        {/* Stage Advancement & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="white"
            size="md"
            onClick={() => setShowDeleteModal(true)}
            className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-[12px] text-xs shadow-subtle transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Project</span>
          </Button>

          {project.currentStage !== 'CLOSED' && project.currentStage !== 'CANCELLED' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCompleteModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-[12px] text-xs shadow-subtle transition-colors cursor-pointer"
            >
              <BadgeCheck className="w-4 h-4 mr-1.5" />
              <span>Mark Project Completed</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => advanceStageMutation.mutate()}
            isLoading={advanceStageMutation.isPending}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-[12px] text-xs shadow-subtle transition-colors cursor-pointer"
          >
            <span>Evaluate & Advance Stage</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Complete Project Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Mark Project as Completed"
        subtitle="This will close the project and record final completion."
      >
        <div className="space-y-4">
          <p className="text-caption text-zinc-700">
            Are you sure you want to mark project <strong className="font-mono text-ink">{project?.projectNumber}</strong> ({project?.partName}) as <strong>COMPLETED</strong>?
          </p>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
              Completion Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              placeholder="e.g. All tooling deliverables approved by customer CMM inspection..."
              className="w-full bg-white border border-border-gray px-3 py-2 text-sm text-ink rounded-[12px] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <Button variant="white" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              isLoading={completeProjectMutation.isPending}
              onClick={() => {
                completeProjectMutation.mutate(completionRemarks || undefined, {
                  onSuccess: () => {
                    setShowCompleteModal(false);
                    setCompletionRemarks("");
                  }
                });
              }}
            >
              Confirm Project Completion
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project Confirmation"
        subtitle="This action is permanent and cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-caption text-zinc-700">
            Are you sure you want to permanently delete project <strong className="font-mono text-ink">{project?.projectNumber}</strong> ({project?.partName})?
          </p>
          <p className="text-micro text-red-600 bg-red-50 p-3 rounded-[12px] border border-red-200">
            <strong>Warning:</strong> All associated Bill of Materials (BOM), routings, job cards, and cost summaries will be permanently deleted.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <Button variant="white" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              disabled={deleteProjectMutation.isPending}
              onClick={async () => {
                try {
                  await deleteProjectMutation.mutateAsync();
                  setShowDeleteModal(false);
                  router.push('/projects');
                } catch (err) {}
              }}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Confirm & Delete Project"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4 HIGHLY RELEVANT TOOLROOM PROJECT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Schedule & Target Delivery */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Schedule & Delivery</span>
            <div className="w-7 h-7 rounded-[12px] bg-primary-subtle text-primary-dark flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-950 font-mono">
              {project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Not Scheduled'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                daysRemaining !== null && daysRemaining < 0 
                  ? "bg-red-50 text-red-700 border-red-200"
                  : daysRemaining !== null
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border-border-gray"
              }`}>
                {daysRemaining !== null 
                  ? (daysRemaining < 0 ? `${Math.abs(daysRemaining)} Days Overdue` : `${daysRemaining} Days Remaining`) 
                  : 'Target Date Not Set'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Workflow Stage & Progress */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Workflow & Progress</span>
            <div className="w-7 h-7 rounded-[12px] bg-primary-subtle text-primary-dark flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-ink">{project.currentStage?.replace(/_/g, ' ') || 'CREATED'}</span>
              <span className="text-xs font-mono font-semibold text-primary-dark">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono mt-1 block">Stage {currentStageIdx + 1} of {STAGES.length}</span>
          </div>
        </div>

        {/* KPI 3: BOM & Materials Requisitions */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">BOM & Steel Stock</span>
            <div className="w-7 h-7 rounded-[12px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-950 font-mono">
              {totalBomItemsCount} Material Requisitions
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {grnReceivedCount} GRN Received
              </span>
              <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-border-gray">
                {poInProgressCount} In Progress
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Machining & Shopfloor Capacity */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Machining Capacity</span>
            <div className="w-7 h-7 rounded-[12px] bg-amber-50 text-amber-700 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-950 font-mono">
              {totalMachineHours > 0 ? `${totalMachineHours.toFixed(1)} Machine Hrs` : '0.0 Machine Hrs'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {reports.length > 0 ? `${reports.length} Daily Log Shifts` : 'No shopfloor logs recorded'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Stage Progress Pipeline Stepper */}
      <div className="bg-white rounded-[12px] border border-border-gray/80 p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-border-gray/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
              Tooling Workflow Pipeline Stepper
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-zinc-600">
            Active: <strong className="text-zinc-950 font-semibold">{project.currentStage?.replace(/_/g, ' ') || 'CREATED'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {STAGES.map((stg, idx) => {
            const isCompleted = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <div 
                key={stg} 
                className={`p-3 rounded-[12px] border text-center transition-all ${
                  isCurrent 
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-subtle" 
                    : isCompleted 
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold" 
                    : "bg-canvas/80 border-border-gray/80 text-zinc-400"
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider">
                  {stg.replace(/_/g, ' ')}
                </div>
                <div className="text-[9px] mt-1 font-mono font-semibold">
                  {isCurrent ? "IN PROGRESS" : isCompleted ? "COMPLETED" : "PENDING"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Specifications Card */}
      <div className="bg-white rounded-[12px] border border-border-gray/80 p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-border-gray/80 pb-3">
          <FileText className="w-4 h-4 text-zinc-700" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-950">
            Tooling Mission Specifications
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-xs">
          <div>
            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Customer / Client</span>
            <div className="font-semibold text-zinc-950 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-mute" />
              <span>{project.customer?.companyName || project.customerName || 'Unspecified Customer'}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Customer PO Number</span>
            <div className="font-mono font-semibold text-zinc-950 mt-1">
              {project.customerPoNumber || 'No PO Assigned'}
            </div>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Target Delivery Date</span>
            <div className="font-mono font-semibold text-zinc-950 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-mute" />
              <span>{project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Not Scheduled'}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Plant / Facility</span>
            <div className="font-semibold text-zinc-950 mt-1 flex items-center gap-2">
              <Factory className="w-3.5 h-3.5 text-mute" />
              <span>{formattedPlant}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Project Owner</span>
            <div className="font-semibold text-zinc-950 mt-1 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-mute" />
              <span>{project.projectOwner || project.manager || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

