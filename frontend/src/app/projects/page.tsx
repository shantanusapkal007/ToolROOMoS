"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
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
  const [deletingProject, setDeletingProject] = useState<any | null>(null);
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
          className="font-bold text-zinc-900 font-mono hover:text-blue-600 cursor-pointer"
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
        <span className="text-micro font-bold px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
          {val?.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'targetDeliveryDate',
      label: 'Target Delivery',
      render: (val: string) => (
        <span className="font-mono text-zinc-500">
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
          <span className="text-micro font-bold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200">
            OVERDUE
          </span>
        ) : (
          <span className="text-micro font-bold px-2 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
            ON TRACK
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeletingProject(row);
          }}
          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
          title="Delete Project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative pl-16">
        <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-6">
          
          {/* Header */}
          <PageHeader 
            title="Active Projects Pipeline"
            description="All manufacturing missions currently in progress across shopfloor stages."
            icon={<Briefcase />}
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Projects' }]}
            actions={
              <div className="flex items-center gap-2">
                <Button 
                  variant="secondary" 
                  size="md"
                  onClick={() => exportPremiumProjects(projects)}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Excel</span>
                </Button>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={() => setShowNewProjectModal(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span>Initialize Project</span>
                </Button>
              </div>
            }
          />

          {/* Analytical KPI Summary Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">Active Missions</span>
                <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">{activeProjects.length}</div>
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">On Track</span>
                <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{onTrackCount}</div>
              </div>
              <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">Overdue Alerts</span>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">{delayedProjects.length}</div>
              </div>
              <div className="w-8 h-8 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="enterprise-card p-4 flex items-center justify-between">
              <div>
                <span className="text-micro font-semibold uppercase text-zinc-500">Total Records</span>
                <div className="text-2xl font-bold font-mono text-zinc-900 mt-1">{projects.length}</div>
              </div>
              <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600">
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
            exportFilename="Projects_Register"
          />

        </div>
      </main>

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
              className="w-full px-3 py-2 border border-zinc-200 rounded-md font-mono text-caption text-zinc-900"
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
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-caption text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Customer PO Number</label>
            <input 
              type="text"
              placeholder="e.g. PO-88992"
              value={newCustomerPo}
              onChange={(e) => setNewCustomerPo(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md font-mono text-caption text-zinc-900"
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
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-caption text-zinc-900"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-zinc-700 mb-1">Target Delivery Date</label>
            <input 
              type="date"
              value={newTargetDeliveryDate}
              onChange={(e) => setNewTargetDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-caption text-zinc-900 bg-white"
            />
          </div>

          {customers && customers.length > 0 && (
            <div>
              <label className="block text-caption font-semibold text-zinc-700 mb-1">Customer / Client</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md text-caption text-zinc-900 bg-white"
              >
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
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
            Are you sure you want to permanently delete project <strong className="font-mono text-zinc-900">{deletingProject?.projectNumber}</strong> ({deletingProject?.partName})?
          </p>
          <p className="text-micro text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            <strong>Warning:</strong> Deleting this project will remove all associated Bill of Materials (BOM), routings, job cards, and cost summaries from the system.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
            <Button variant="secondary" onClick={() => setDeletingProject(null)}>Cancel</Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
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
  );
}
