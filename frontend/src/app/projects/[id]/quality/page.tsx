"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { CheckSquare } from "lucide-react";

import { useToast } from "../../../../components/ui/Toast";

export default function QualityTab({ params }: { params: Promise<{ id: string }> }) {
  const { error } = useToast();
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
      await api.post(`projects/${project.id}/inspections`, { inspectedQty: 1, passedQty: 1, result: "PASS" });
      loadProjectDetails(project.id);
    } catch (err: any) { error("Inspection Failed", err.message); }
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
            <CheckSquare className="h-6 w-6 text-green-400 mb-3" />
            <h3 className="font-semibold text-white">Inspection Reports</h3>
            <p className="text-sm text-slate-500 mt-1">{project.inspectionHeaders?.length || 0} inspections logged</p>
          </div>
        </div>
      </div>
    </div>
  );
}
