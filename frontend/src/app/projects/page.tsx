"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Plus, Download, Briefcase, Clock, AlertTriangle, CheckCircle2, FileSpreadsheet, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportPremiumProjects } from "../../utils/exportPremiumProjects";
import { useToast } from "../../components/ui/Toast";
import { useProjects, useCreateProject, projectKeys } from "../../hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { useMasterData } from "../../hooks/useMasterData";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { SmartTable } from "../../components/ui/SmartTable";
import { formatDate } from "../../lib/formatters";
import { api } from "../../lib/api";

export default function ProjectsPage() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: customers } = useMasterData('customers');
  const { data: plants } = useMasterData('plants');
  const createProjectMutation = useCreateProject();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const router = useRouter();

  // New Project Form State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newProjectNumber, setNewProjectNumber] = useState("");
  const [projectPrefix, setProjectPrefix] = useState("KTD-");
  const [newPartName, setNewPartName] = useState("");
  const [newCustomerPo, setNewCustomerPo] = useState("");
  const [newRevenue, setNewRevenue] = useState("");
  const [newTargetDeliveryDate, setNewTargetDeliveryDate] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const computeNextProjectNumber = (currentProjects: any[], prefix: string, startingNum: number) => {
    const cleanPrefix = prefix.endsWith('-') ? prefix : `${prefix}-`;
    let maxSeq = 0;

    const prefixEscaped = cleanPrefix.replace(/[-[\]{}()*+?.:\\^$|]/g, '\\$&');
    const seqRegex = new RegExp(`^${prefixEscaped}(\\d+)`, 'i');

    if (Array.isArray(currentProjects)) {
      currentProjects.forEach((p) => {
        const num = p?.projectNumber;
        if (num && typeof num === 'string') {
          const match = num.match(seqRegex) || num.match(/KTD-?(\d+)/i) || num.match(/(\d+)/);
          if (match && match[1]) {
            const seq = parseInt(match[1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      });
    }

    const nextSeqNum = maxSeq > 0 ? Math.max(startingNum, maxSeq + 1) : startingNum;
    const formattedSeq = nextSeqNum < 10 ? `0${nextSeqNum}` : `${nextSeqNum}`;

    return `${cleanPrefix}${formattedSeq}`;
  };

  useEffect(() => {
    if (showNewProjectModal) {
      let isMounted = true;
      async function initProjectNumber() {
        let prefix = 'KTD-';
        let startingNum = 1;

        try {
          const res: any = await api.get('settings/preferences');
          const data = res?.data || res;
          if (data) {
            if (data.projectNumberPrefix) prefix = String(data.projectNumberPrefix);
            if (data.projectStartingNumber) startingNum = Number(data.projectStartingNumber);
          }
        } catch (err) {}

        if (isMounted) {
          setProjectPrefix(prefix);
          const autoNum = computeNextProjectNumber(projects, prefix, startingNum);
          setNewProjectNumber(autoNum);
          if (customers && customers.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(customers[0].id);
          }
        }
      }
      initProjectNumber();
      return () => { isMounted = false; };
    }
  }, [showNewProjectModal, projects, customers]);

  const handleProjectNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const cleanPrefix = projectPrefix.endsWith('-') ? projectPrefix : `${projectPrefix}-`;
    if (!val.toUpperCase().startsWith(cleanPrefix.toUpperCase())) {
      const raw = val.replace(new RegExp(`^${cleanPrefix.replace('-', '')}-?`, 'i'), '');
      val = `${cleanPrefix}${raw}`;
    }
    setNewProjectNumber(val);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProjectMutation.mutateAsync({
        projectNumber: newProjectNumber,
        partName: newPartName, 
        customerPoNumber: newCustomerPo,
        customerId: selectedCustomerId,
        plantId: plants?.[0]?.id || "PL-01",
        revenue: newRevenue ? parseFloat(newRevenue) : 0,
        targetDeliveryDate: newTargetDeliveryDate ? new Date(newTargetDeliveryDate).toISOString() : undefined,
      } as any);

      // Auto update next starting project counter in settings
      const numMatch = newProjectNumber.match(/\d+/);
      if (numMatch) {
        const currentNum = parseInt(numMatch[0], 10);
        if (!isNaN(currentNum)) {
          api.post('settings/preferences', {
            key: 'projectStartingNumber',
            value: currentNum + 1,
          }).catch(() => {});
        }
      }

      setShowNewProjectModal(false);
      setNewProjectNumber("");
      setNewPartName("");
      setNewCustomerPo("");
      setNewRevenue("");
      setNewTargetDeliveryDate("");
    } catch (err: any) {}
  };

  const activeProjects = projects.filter(p => p.currentStage !== "CLOSED" && p.currentStage !== "CANCELLED");
  const delayedProjects = activeProjects.filter(p => p.targetDeliveryDate && new Date(p.targetDeliveryDate).getTime() < new Date().getTime());
  const onTrackCount = activeProjects.length - delayedProjects.length;

  const columns = [
    {
      key: 'projectNumber',
      label: 'Project #',
      render: (val: string, row: any) => (
        <button 
          onClick={() => router.push(`/projects/${row.id}/overview`)} 
          className="font-semibold text-ink font-mono hover:text-blue-600 cursor-pointer"
        >
          {val}
        </button>
      )
    },
    {
      key: 'partName',
      label: 'Part / Component Name',
      render: (val: string) => <span className="font-semibold text-zinc-800">{val || 'N/A'}</span>
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (val: any) => <span>{val?.companyName || 'Pending'}</span>
    },
    {
      key: 'customerPoNumber',
      label: 'Customer PO',
      render: (val: string) => <span className="font-mono text-zinc-600">{val || 'N/A'}</span>
    },
    {
      key: 'currentStage',
      label: 'Stage',
      render: (val: string) => (
        <span className="text-micro font-semibold px-2 py-0.5 rounded bg-zinc-100 border border-hairline text-zinc-700">
          {val?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'targetDeliveryDate',
      label: 'Target Delivery',
      render: (val: string) => (
        <span className="font-mono text-mute">
          {val ? formatDate(val) : <span className="text-zinc-300">Not Set</span>}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, row: any) => {
        const hasDate = !!row.targetDeliveryDate;
        const isDelayed = hasDate && new Date(row.targetDeliveryDate).getTime() < new Date().getTime();
        return isDelayed ? (
          <span className="text-micro font-semibold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">
            OVERDUE
          </span>
        ) : (
          <span className="text-micro font-semibold px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
            ON TRACK
          </span>
        );
      }
    }
  ];

  return (
    <AppLayout>
      <div className="w-full flex flex-col space-y-6">
          
          {/* Header */}
          <PageHeader 
            title="Active Projects Pipeline"
            description="All manufacturing missions currently in progress across shopfloor stages."
            icon={<Briefcase />}
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Projects' }]}
            actions={
              <div className="flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="md"
                  onClick={() => exportPremiumProjects(projects)}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1.5 text-semantic-success-dark" />
                  <span>Export Excel</span>
                </Button>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={() => setShowNewProjectModal(true)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Initialize Project</span>
                </Button>
              </div>
            }
          />

          {/* Analytical KPI Summary Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Active Missions</span>
                <div className="text-2xl font-bold font-mono text-primary mt-1">{activeProjects.length}</div>
              </div>
              <div className="w-9 h-9 rounded-[8px] bg-primary-subtle text-primary flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">On Track</span>
                <div className="text-2xl font-bold font-mono text-semantic-success-dark mt-1">{onTrackCount}</div>
              </div>
              <div className="w-9 h-9 rounded-[8px] bg-semantic-success-subtle text-semantic-success-dark flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Overdue Alerts</span>
                <div className="text-2xl font-bold font-mono text-semantic-danger-dark mt-1">{delayedProjects.length}</div>
              </div>
              <div className="w-9 h-9 rounded-[8px] bg-semantic-danger-subtle text-semantic-danger-dark flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">Total Records</span>
                <div className="text-2xl font-bold font-mono text-ink mt-1">{projects.length}</div>
              </div>
              <div className="w-9 h-9 rounded-[8px] bg-neutral-100 dark:bg-neutral-800 border border-border-gray text-silver-blue flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Hero Projects Table */}
          <SmartTable 
            title="Projects Execution Register"
            columns={columns}
            data={projects}
            isLoading={projectsLoading}
            onView={(row) => router.push(`/projects/${row.id}/overview`)}
            onDelete={(row) => setDeletingProject(row)}
            exportFilename="Projects_Register"
          />

        {/* Initialize Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Initialize New Project Mission"
        subtitle="Set up project number, part name, and customer PO assignment."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Project Number / Code *</label>
            <input 
              type="text"
              required
              placeholder="KTD-"
              value={newProjectNumber}
              onChange={handleProjectNumberChange}
              className="w-full px-3 py-2 border border-hairline rounded-md font-mono text-caption text-ink"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Part / Tooling Component Name *</label>
            <input 
              type="text"
              required
              placeholder="e.g. Fender Panel Draw Die"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md text-caption text-ink"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Customer PO Number</label>
            <input 
              type="text"
              placeholder="e.g. PO-88992"
              value={newCustomerPo}
              onChange={(e) => setNewCustomerPo(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md font-mono text-caption text-ink"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Expected Contract / Project Order Value (₹)</label>
            <input 
              type="number"
              min="0"
              step="1000"
              placeholder="e.g. 250000 (How much money you will receive for this project)"
              value={newRevenue}
              onChange={(e) => setNewRevenue(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md text-caption text-ink"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Target Delivery Date</label>
            <input 
              type="date"
              value={newTargetDeliveryDate}
              onChange={(e) => setNewTargetDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 border border-hairline rounded-md text-caption text-ink bg-white"
            />
          </div>

          {customers && customers.length > 0 && (
            <div>
              <label className="block text-caption font-semibold text-zinc-700 mb-1">Customer / Client</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-hairline rounded-md text-caption text-ink bg-white"
              >
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
            <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>Cancel</Button>
            <Button type="submit">Create Project Mission</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Modal */}
      <Modal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Delete Project Confirmation"
        subtitle="This action is permanent and cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-caption text-zinc-700">
            Are you sure you want to permanently delete project <strong className="font-mono text-ink">{deletingProject?.projectNumber}</strong> ({deletingProject?.partName})?
          </p>
          <p className="text-micro text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            <strong>Warning:</strong> Deleting this project will remove all associated Bill of Materials (BOM), routings, job cards, and cost summaries from the system.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
            <Button variant="secondary" onClick={() => setDeletingProject(null)}>Cancel</Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              disabled={isDeleting}
              onClick={async () => {
                if (!deletingProject) return;
                setIsDeleting(true);
                try {
                  await api.delete(`projects/${deletingProject.id}`);
                  queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
                  success("Project Deleted", `Project ${deletingProject.projectNumber} has been permanently deleted.`);
                  setDeletingProject(null);
                } catch (err: any) {
                  error("Delete Failed", err?.response?.data?.message || err.message || "Failed to delete project");
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Confirm & Delete Project"}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </AppLayout>
  );
}
