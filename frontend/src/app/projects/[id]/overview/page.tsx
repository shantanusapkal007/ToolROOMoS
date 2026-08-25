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
  Factory,
  Trash2,
  BadgeCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

import { useGlobalDailyReports } from "@/hooks/useDailyReports";
import { ToolingWorkflowStepper } from "@/components/workspace/ToolingWorkflowStepper";

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

  const STAGE_STEPS = [
    { id: 'ENQUIRY', label: '1. ENQUIRY / RFQ' },
    { id: 'QUOTATION', label: '2. QUOTATION' },
    { id: 'ORDER_CONFIRMED', label: '3. ORDER CONFIRMED' },
    { id: 'PROJECT_CREATED', label: '4. PROJECT CREATED' },
    { id: 'DESIGN_CAD', label: '5. DESIGN CAD' },
    { id: 'BOM_PROCUREMENT', label: '6. BOM & PROCUREMENT' },
    { id: 'CAM_MACHINING', label: '7. CAM & MACHINING' },
    { id: 'BENCH_ASSEMBLY', label: '8. BENCH ASSEMBLY' },
    { id: 'TRYOUT', label: '9. PRESS TRYOUT' },
    { id: 'QUALITY_INSPECTION', label: '10. QUALITY INSPECTION' },
    { id: 'DISPATCH', label: '11. DISPATCH' },
    { id: 'CLOSED', label: '12. CLOSED' },
  ];

  const STAGE_ALIAS_MAP: Record<string, number> = {
    ENQUIRY: 0,
    QUOTATION: 1,
    ORDER_CONFIRMED: 2,
    CREATED: 3,
    PROJECT_CREATED: 3,
    DESIGN_CAD: 4,
    DESIGN: 4,
    ENGINEERING: 5,
    BOM_PROCUREMENT: 5,
    PURCHASE: 5,
    INVENTORY: 5,
    CAM_PROGRAMMING: 6,
    CAM_MACHINING: 6,
    MACHINING: 6,
    PRODUCTION: 6,
    SUBCONTRACT: 6,
    BENCH_ASSEMBLY: 7,
    ASSEMBLY: 7,
    TRYOUT: 8,
    QUALITY_INSPECTION: 9,
    INSPECTION: 9,
    QUALITY: 9,
    DISPATCH_READY: 10,
    DISPATCHED: 10,
    DISPATCH: 10,
    INVOICED: 11,
    CLOSED: 11,
  };

  const rawStage = (project.currentStage || 'CREATED').toUpperCase();
  const currentStageIdx = STAGE_ALIAS_MAP[rawStage] ?? 3;
  const progressPercent = Math.round(((currentStageIdx + 1) / STAGE_STEPS.length) * 100);

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
      <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs font-semibold text-cool-gray mb-1">
            <span>Projects</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-silver-blue" />
            <span className="font-mono font-semibold text-ink">{project.projectNumber}</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-silver-blue" />
            <span className="text-ink font-semibold">Overview & KPIs</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-primary text-white flex items-center justify-center font-semibold shadow-subtle">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-ink tracking-tight">
                  {project.partName || 'Tooling Project'}
                </h1>
                {project.currentStage === 'CLOSED' || project.currentStage === 'COMPLETED' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                    CLOSED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                    {project.status || 'ACTIVE'}
                  </span>
                )}
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
            className="border border-semantic-danger/30 bg-semantic-danger-subtle hover:bg-semantic-danger/20 text-semantic-danger-dark font-semibold rounded-[12px] text-xs shadow-subtle transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Project</span>
          </Button>

          {project.currentStage !== 'CLOSED' && project.currentStage !== 'CANCELLED' && project.currentStage !== 'COMPLETED' ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowCompleteModal(true)}
                className="bg-semantic-success hover:bg-semantic-success-dark text-white font-semibold rounded-[12px] text-xs shadow-subtle transition-colors cursor-pointer border-none"
              >
                <BadgeCheck className="w-4 h-4 mr-1.5" />
                <span>Mark Project Completed</span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => advanceStageMutation.mutate()}
                isLoading={advanceStageMutation.isPending}
                className="bg-primary hover:bg-primary-hover text-white font-semibold rounded-[12px] text-xs shadow-subtle transition-colors cursor-pointer"
              >
                <span>Evaluate & Advance Stage</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </>
          ) : (
            <span className="px-3.5 py-2 rounded-[12px] text-xs font-bold bg-primary-subtle text-primary border border-primary/20 flex items-center gap-1.5 shadow-subtle">
              <BadgeCheck className="w-4 h-4" />
              <span>Project Mission Closed</span>
            </span>
          )}
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
          <p className="text-caption text-body">
            Are you sure you want to mark project <strong className="font-mono text-ink">{project?.projectNumber}</strong> ({project?.partName}) as <strong>COMPLETED</strong>?
          </p>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1 uppercase tracking-wider">
              Completion Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              placeholder="e.g. All tooling deliverables approved by customer CMM inspection..."
              className="w-full bg-white border border-border-gray px-3 py-2 text-sm text-ink rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <Button variant="white" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button
              className="bg-semantic-success hover:bg-semantic-success-dark text-white font-semibold"
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
          <p className="text-caption text-body">
            Are you sure you want to permanently delete project <strong className="font-mono text-ink">{project?.projectNumber}</strong> ({project?.partName})?
          </p>
          <p className="text-micro text-semantic-danger-dark bg-semantic-danger-subtle p-3 rounded-[12px] border border-semantic-danger/20">
            <strong>Warning:</strong> All associated Bill of Materials (BOM), routings, job cards, and cost summaries will be permanently deleted.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-border-gray">
            <Button variant="white" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
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
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Schedule & Delivery</span>
            <div className="w-7 h-7 rounded-[12px] bg-primary-subtle text-primary flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink font-mono">
              {project.targetDeliveryDate ? formatDate(project.targetDeliveryDate) : 'Not Scheduled'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                daysRemaining !== null && daysRemaining < 0 
                  ? "bg-semantic-danger-subtle text-semantic-danger-dark border-semantic-danger/20"
                  : daysRemaining !== null
                  ? "bg-semantic-success-subtle text-semantic-success-dark border-semantic-success/20"
                  : "bg-canvas text-cool-gray border-border-gray"
              }`}>
                {daysRemaining !== null 
                  ? (daysRemaining < 0 ? `${Math.abs(daysRemaining)} Days Overdue` : `${daysRemaining} Days Remaining`) 
                  : 'Target Date Not Set'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Workflow Stage & Progress */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Workflow & Progress</span>
            <div className="w-7 h-7 rounded-[12px] bg-primary-subtle text-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-ink">{project.currentStage?.replace(/_/g, ' ') || 'CREATED'}</span>
              <span className="text-xs font-mono font-semibold text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-canvas border border-border-gray rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-cool-gray font-mono mt-1 block">Stage {currentStageIdx + 1} of {STAGE_STEPS.length}</span>
          </div>
        </div>

        {/* KPI 3: BOM & Materials Requisitions */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">BOM & Steel Stock</span>
            <div className="w-7 h-7 rounded-[12px] bg-semantic-success-subtle text-semantic-success-dark flex items-center justify-center">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink font-mono">
              {totalBomItemsCount} Material Requisitions
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-semibold text-semantic-success-dark bg-semantic-success-subtle px-2 py-0.5 rounded border border-semantic-success/20">
                {grnReceivedCount} GRN Received
              </span>
              <span className="text-[10px] font-semibold text-cool-gray bg-canvas px-2 py-0.5 rounded border border-border-gray">
                {poInProgressCount} In Progress
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Machining & Shopfloor Capacity */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cool-gray uppercase tracking-wider">Machining Capacity</span>
            <div className="w-7 h-7 rounded-[12px] bg-semantic-warning-subtle text-semantic-warning-dark flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink font-mono">
              {totalMachineHours > 0 ? `${totalMachineHours.toFixed(1)} Machine Hrs` : '0.0 Machine Hrs'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold text-semantic-warning-dark bg-semantic-warning-subtle px-2 py-0.5 rounded border border-semantic-warning/20">
                {reports.length > 0 ? `${reports.length} Daily Log Shifts` : 'No shopfloor logs recorded'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Stage Progress Pipeline Stepper */}
      <ToolingWorkflowStepper currentStage={project.currentStage} />
    </div>
  );
}
