"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { LoadingState } from "../../components/ui/LoadingState";
import { formatDate } from "../../lib/formatters";
import { useProjects, useCreateProject } from "../../hooks/useProjects";
import { useMasterData } from "../../hooks/useMasterData";
import { useUsers } from "../../hooks/useUsers";
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

  // Apple Spring Configuration
  const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative z-0 pl-24 pt-4 pr-4 pb-4">
        <div className="flex-1 p-12 overflow-y-auto hide-scrollbar relative">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-between items-end mb-16 relative z-10"
          >
            <div>
              <h1 className="text-display font-bold tracking-tight mb-2 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">Active Projects</h1>
              <p className="text-body-large text-zinc-400">All manufacturing missions currently in progress.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNewProjectModal(true)}
              className="glass-button px-6 py-4 font-semibold flex items-center shadow-elevation"
            >
              <Plus className="h-5 w-5 mr-3 text-blue-400" />
              Initialize Project
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {projectsLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingState message="Scanning Project Database..." />
              </motion.div>
            ) : !projects || projects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
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
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-12"
              >
                {projects.filter(p => p.currentStage !== "CLOSED" && p.currentStage !== "CANCELLED").map((proj, idx) => (
                  <motion.div 
                    key={proj.id}
                    initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02, 
                      boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)" 
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/projects/${proj.id}/overview`)}
                    className="glass-panel p-8 cursor-pointer group flex flex-col h-[280px] relative overflow-hidden"
                  >
                    {/* Hover Glow Light */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full" />
                    
                    <div className="flex-1 z-10 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-micro text-zinc-300">
                          {proj.projectNumber}
                        </div>
                        <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <h3 className="text-heading font-bold text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 transition-all">
                        {proj.partName}
                      </h3>
                      <p className="text-body text-zinc-400">{proj.customer?.companyName || "Customer Pending"}</p>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/10 z-10 flex justify-between items-center">
                      <div className="flex items-center text-caption text-zinc-300">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 mr-3 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        {proj.currentStage}
                      </div>
                      <span className="text-micro text-zinc-500">{formatDate(proj.targetDeliveryDate)}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* New Project Modal (Using Glass Modal) */}
      <AnimatePresence>
        {showNewProjectModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={spring}
              className="glass-modal w-full max-w-2xl p-10 relative !overflow-visible"
            >
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 blur-[100px] pointer-events-none rounded-full" />
              
              <h2 className="text-heading-xl font-bold mb-8 text-white tracking-tight relative z-10">Initialize Mission</h2>
              
              <form onSubmit={handleCreateProject} className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-micro text-zinc-400 mb-3">PROJECT NUMBER</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-body text-white focus:border-blue-500 focus:bg-black/40 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                      value={newProjectNumber} 
                      onChange={e => setNewProjectNumber(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-micro text-zinc-400 mb-3">PART NAME</label>
                    <input 
                      type="text" 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-body text-white focus:border-blue-500 focus:bg-black/40 focus:ring-1 focus:ring-blue-500 transition-all outline-none" 
                      value={newPartName} 
                      onChange={e => setNewPartName(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-micro text-zinc-400 mb-3">CUSTOMER</label>
                    <select 
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-body text-white focus:border-blue-500 focus:bg-black/40 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none" 
                      value={selectedCustomerId}
                      onChange={e => setSelectedCustomerId(e.target.value)}
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
                <div className="flex justify-end pt-8 gap-4 border-t border-white/10">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={() => setShowNewProjectModal(false)} 
                    className="glass-button px-6 py-3 text-white font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-colors"
                  >
                    Launch Project
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
