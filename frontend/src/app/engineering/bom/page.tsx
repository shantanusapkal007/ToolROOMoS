"use client";

import React, { useState, useEffect } from 'react';
import { Layers, ChevronRight } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { useProjects } from "@/hooks/useProjects";
import { useMasterData } from "@/hooks/useMasterData";
import { useToolbarStore } from "@/store/useToolbarStore";
import { BomConverter } from "@/components/engineering/BomConverter";
import { useUpdateBOM } from "@/hooks/useEngineering";
import { useToast } from "@/components/ui/Toast";

export default function GlobalBomPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: materials } = useMasterData('materials');
  const { success, error } = useToast();
  
  const { mountFeature, unmountFeature } = useToolbarStore();

  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Setup toolbar
  useEffect(() => {
    mountFeature('global-bom', { export: true }, {
      export: () => console.log("Export"),
    });
    return () => unmountFeature('global-bom');
  }, [mountFeature, unmountFeature]);

  const activeProjects = projects?.filter((p: any) => p.status !== 'CLOSED' && p.status !== 'CANCELLED') || [];

  const columns = [
    { key: 'projectNumber', label: 'Project Number' },
    { key: 'partName', label: 'Project Name' },
    { key: 'currentStage', label: 'Stage' },
    { 
      key: 'actions', 
      label: '', 
      render: (val: any, row: any) => (
        <button
          onClick={() => setSelectedProject(row)}
          className="text-xs font-bold text-amber-500 hover:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-lg transition-colors flex items-center"
        >
          Manage BOM <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      ) 
    }
  ];

  if (isLoading) {
    return <div className="p-6 text-white text-center">Loading BOM registry...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Layers className="w-6 h-6 mr-3 text-amber-500" />
            Bill of Materials
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage material requirements across all active projects
          </p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        <SmartTable 
          data={activeProjects}
          columns={columns}
          isLoading={isLoading}
        />
      </div>

      <PremiumDrawer
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={`BOM: ${selectedProject?.projectNumber || ''}`}
        subtitle={selectedProject?.partName}
        width="xl"
      >
        {selectedProject && (
          <BomWrapper 
            project={selectedProject} 
            materials={materials || []} 
            onClose={() => setSelectedProject(null)}
            onSuccess={() => {
              success("BOM Saved", "BOM updated successfully.");
              setSelectedProject(null);
            }}
            onError={(msg: string) => error("Error", msg)}
          />
        )}
      </PremiumDrawer>
    </div>
  );
}

function BomWrapper({ project, materials, onClose, onSuccess, onError }: any) {
  const updateBOMMutation = useUpdateBOM(project.id);
  
  const handleSaveBOM = async (rows: any[]) => {
    try {
      const items = rows.map(r => ({
        materialId: r.matchedMaterialId || r.materialId, // Fallback in case of old modal
        requiredQty: r.quantity || r.requiredQty,
        estimatedCost: r.basicCost || r.estimatedCost || 0,
        rawSize: r.rawMaterialSize || r.rawSize || '',
        calculatedWeight: r.totalWeight || r.calculatedWeight || 0,
        dimensions: r.length && r.width && r.height ? `${r.length}x${r.width}x${r.height}` : undefined,
        hsnCode: r.hsnCode || undefined,
        gstPercent: r.gstPercent || undefined
      }));
      await updateBOMMutation.mutateAsync({ items });
      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to save BOM");
    }
  };

  return (
    <div className="h-full flex flex-col pt-4">
      <BomConverter 
        projectId={project.id}
        project={project}
        materials={materials}
        onSaveBOM={handleSaveBOM}
      />
    </div>
  );
}
