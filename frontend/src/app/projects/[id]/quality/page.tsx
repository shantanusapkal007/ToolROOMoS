"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { CheckSquare } from "lucide-react";

import { useToast } from "../../../../components/ui/Toast";

export default function QualityTab({ params }: { params: Promise<{ id: string }> }) {
  const { addToast } = useToast();
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

  const handlePassInspection = async () => {
    if (!project) return;
    try {
      await api.post(`projects/${project.id}/inspections`, { inspectedQty: 1, passedQty: 1, result: "PASS", inspectionType: "IN_PROCESS" });
      loadProjectDetails(project.id);
      addToast({ title: "Success", message: "In-process inspection logged.", type: "success" });
    } catch (err: any) { addToast({ title: "Inspection Failed", message: err.message, type: "error" }); }
  };

  const handleLogPDI = async () => {
    if (!project) return;
    try {
      await api.post(`projects/${project.id}/inspections`, { inspectedQty: 1, passedQty: 1, result: "PASS", inspectionType: "FINAL_PDI" });
      loadProjectDetails(project.id);
      addToast({ title: "Success", message: "PDI Report generated.", type: "success" });
    } catch (err: any) { addToast({ title: "PDI Failed", message: err.message, type: "error" }); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Quality Assurance</h2>
            <p className="text-slate-400 mt-1">Manage Quality Inspections and NCRs.</p>
          </div>
          <button onClick={handlePassInspection} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium">Log Quality PASS</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <CheckSquare className="h-6 w-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white">In-Process Inspections</h3>
            <p className="text-sm text-slate-500 mt-1">{project.inspectionHeaders?.filter((i:any) => i.inspectionType === 'IN_PROCESS').length || 0} inspections logged</p>
          </div>
          
          {/* PDI Report Card */}
          <div className="bg-[#050A14] border border-blue-500/20 p-6 rounded-xl hover:bg-blue-500/5 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center border border-blue-500/20 mb-3">
                <CheckSquare className="h-6 w-6 text-blue-400" />
              </div>
              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded tracking-wider">FINAL STAGE</span>
            </div>
            <h3 className="font-semibold text-white text-lg relative z-10">Pre-Dispatch Inspection</h3>
            <p className="text-sm text-slate-400 mt-2 mb-6 relative z-10">Generate the final PDI Report before shipping the assembly to the customer.</p>
            
            <button 
              onClick={() => handleLogPDI()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center relative z-10"
            >
              Generate PDI Report
            </button>
          </div>
        </div>

        {/* Inspection History */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-white mb-6">Inspection History</h3>
          <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-black/40 border-b border-white/5">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty Inspected</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {project.inspectionHeaders?.map((ins: any) => (
                  <tr key={ins.id} className="hover:bg-white/5">
                    <td className="p-4 text-sm text-slate-300">{new Date(ins.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${ins.inspectionType === 'FINAL_PDI' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {ins.inspectionType?.replace('_', ' ') || 'IN PROCESS'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-white">{ins.inspectedQty}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${ins.result === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ins.result}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!project.inspectionHeaders || project.inspectionHeaders.length === 0) && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-500">No inspections logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
