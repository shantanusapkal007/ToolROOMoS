"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Truck } from "lucide-react";

export default function DispatchTab({ params }: { params: Promise<{ id: string }> }) {
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

  const handleCreateDispatch = async () => {
    if (!project) return;
    try {
      await api.post(`projects/${project.id}/dispatches`, {
        dispatchNumber: `DISP-${Date.now().toString().slice(-4)}`,
        dispatchQty: 1, logisticsCost: 250,
      });
      loadProjectDetails(project.id);
    } catch (err: any) { alert(err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Logistics & Dispatch</h2>
            <p className="text-slate-400 mt-1">Manage Packing and Dispatch Notes.</p>
          </div>
          <button onClick={handleCreateDispatch} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium">Log Dispatch Note</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <Truck className="h-6 w-6 text-orange-400 mb-3" />
            <h3 className="font-semibold text-white">Dispatch Notes</h3>
            <p className="text-sm text-slate-500 mt-1">{project.dispatchNotes?.length || 0} dispatches completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
