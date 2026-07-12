"use client";

import React, { useState, useEffect } from "react";
import { Plus, ArrowRight, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import { EmptyState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { LoadingState } from "../../../components/ui/LoadingState";
import { formatDate } from "../../../lib/formatters";
import { useProjects, useCreateProject } from "../../../hooks/useProjects";
import { useMasterData } from "../../../hooks/useMasterData";
import { useUsers } from "../../../hooks/useUsers";
import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const { success, error } = useToast();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: customers } = useMasterData('customers');
  const createProjectMutation = useCreateProject();
  const router = useRouter();

  const { data: usersResult } = useUsers();
  const users = usersResult?.data || [];

  // New Project Form State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectNumber, setNewProjectNumber] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newCustomerPo, setNewCustomerPo] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  if (customers && customers.length > 0 && !selectedCustomerId) {
    setSelectedCustomerId(customers[0].id);
  }

  useEffect(() => {
    if (showNewProjectModal) {
      if (customers && customers.length > 0) setSelectedCustomerId(customers[0].id);
    }
  }, [showNewProjectModal, customers]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProjectMutation.mutateAsync({
        projectNumber: newProjectNumber,
        partName: newPartName, 
        customerPoNumber: newCustomerPo,
        customerId: selectedCustomerId,
        plantId: "PL-01",
      } as any);
      setShowNewProjectModal(false);
    } catch (err: any) { 
      // Error handled by mutation hook
    }
  };

  const handleExportProjects = () => {
    if (!projects || projects.length === 0) return;
    
    const exportData = projects.map((p: any) => ({
      "Project Number": p.projectNumber,
      "Part Name": p.partName,
      "Customer": p.customer?.companyName || '-',
      "Status": p.status,
      "Current Stage": p.currentStage,
      "Priority": p.priority,
      "Target Delivery": p.targetDeliveryDate ? formatDate(p.targetDeliveryDate) : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    
    XLSX.writeFile(wb, `Projects_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Apple Spring Configuration
  const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <>
      <div className="flex-1 px-8 pt-8 pb-12 overflow-y-auto hide-scrollbar relative">
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-between items-end mb-10 relative z-10">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1 text-white">Active Projects</h1>
              <p className="text-[13px] text-zinc-400">All manufacturing missions currently in progress.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary"
                onClick={handleExportProjects}
              >
                <Download className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                Export Data
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowNewProjectModal(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Initialize Project
              </Button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {projectsLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <LoadingState message="Scanning Project Database..." />
              </motion.div>
            ) : !projects || projects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}>
                <EmptyState 
                  title="No Active Projects" 
                  description="Initialize a new project to start tracking production, cost, and logistics." 
                  actionLabel="Initialize Project"
                  onAction={() => setShowNewProjectModal(true)}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-12">
                {projects.filter(p => p.currentStage !== "CLOSED" && p.currentStage !== "CANCELLED").map((proj, idx) => (
                  <motion.div 
                    key={proj.id}
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)", rotateX: 0, rotateY: 0 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                  <div
                    onClick={() => router.push(`/projects/${proj.id}/overview`)}
                    className="p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer group flex flex-col h-[260px] relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
                    
                    {/* Hover Glow Light */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full z-0" />
                    
                    <div className="flex-1 z-10 flex flex-col">
                      <div className="flex justify-between items-start mb-5">
                        <div className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] font-semibold tracking-wide text-zinc-400 group-hover:text-zinc-300 transition-colors">
                          {proj.projectNumber}
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1.5 leading-tight group-hover:text-emerald-400 transition-colors">
                        {proj.partName}
                      </h3>
                      <p className="text-[13px] text-zinc-500 font-medium">{proj.customer?.companyName || "Customer Pending"}</p>
                    </div>

                    <div className="mt-auto pt-5 border-t border-white/[0.04] z-10 flex justify-between items-center">
                      <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        {proj.currentStage}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500">{formatDate(proj.targetDeliveryDate)}</span>
                    </div>
                  </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      {/* New Project Modal (Using Glass Modal) */}
      <Modal isOpen={showNewProjectModal} onClose={() => setShowNewProjectModal(false)} title="Initialize Mission" maxWidth="2xl">
        <form onSubmit={handleCreateProject} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <Input
              label="Project Number"
              value={newProjectNumber} 
              onChange={e => setNewProjectNumber(e.target.value)} 
              required 
            />
            <Input
              label="Part Name"
              value={newPartName} 
              onChange={e => setNewPartName(e.target.value)} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Select 
              label="Customer"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              options={(customers || []).map((c: any) => ({ label: c.companyName, value: c.id }))}
              required 
            />
          </div>
          <div className="flex justify-end pt-4 gap-3 border-t border-white/[0.04]">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setShowNewProjectModal(false)} 
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              isLoading={createProjectMutation.isPending}
            >
              Launch Project
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
