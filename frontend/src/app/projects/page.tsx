"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { api } from "../../lib/api";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";

export default function ProjectsPage() {
  const { success, error } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // New Project Form State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectNumber, setNewProjectNumber] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newCustomerPo, setNewCustomerPo] = useState("");
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  useEffect(() => {
    loadProjects();
    loadCustomers();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("projects");
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get("master-data/customers");
      setCustomers(res.data || []);
      if (res.data?.length > 0) setSelectedCustomerId(res.data[0].id);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("projects", {
        projectNumber: newProjectNumber,
        partName: newPartName,
        customerPoNumber: newCustomerPo,
        customerId: selectedCustomerId,
        plantId: "PL-01", // Hardcoded fallback as per prototype
      });
      setShowNewProjectModal(false);
      success("Project Created", `Project ${newPartName} has been generated successfully.`);
      loadProjects();
    } catch (err: any) { error("Failed", err.message); }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative z-0 pl-16">
        <div className="flex-1 p-12 overflow-y-auto pl-32 animate-fade-in">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h1 className="text-h1 tracking-tight mb-2">Projects</h1>
              <p className="text-h5 text-slate-400">All active factory orders.</p>
            </div>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="glass-panel px-6 py-3 font-semibold hover:bg-white/10 flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Initialize Project
            </button>
          </div>

          {loading ? (
             <div className="text-slate-400">Loading projects...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div 
                  key={proj.id} 
                  onClick={() => router.push(`/projects/${proj.id}/overview`)}
                  className="glass-panel p-6 cursor-pointer group hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] flex flex-col justify-between"
                >
                  <div className="mb-8">
                    <p className="text-xs font-bold text-slate-500 tracking-widest mb-1">{proj.projectNumber}</p>
                    <h3 className="text-h4 font-semibold text-white group-hover:text-blue-400 transition-colors">{proj.partName}</h3>
                    <p className="text-sm text-slate-400 mt-2">{proj.customer?.name || "Customer Pending"}</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-4">
                    <div className="flex items-center text-xs font-medium text-slate-300">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                      {proj.currentStage}
                    </div>
                    <span className="text-xs text-slate-500">{new Date(proj.deliveryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-8 animate-slide-up">
            <h2 className="text-h3 font-bold mb-6 text-white tracking-tight">Initialize Mission</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Project No.</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-all outline-none" value={newProjectNumber} onChange={e => setNewProjectNumber(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Part Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-all outline-none" value={newPartName} onChange={e => setNewPartName(e.target.value)} required />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-6 py-3 mr-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">Launch Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
