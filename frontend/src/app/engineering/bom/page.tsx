"use client";

import React, { useState } from 'react';
import { Layers, ChevronRight } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { useProjects } from "@/hooks/useProjects";
import { useMasterData } from "@/hooks/useMasterData";
import { BomConverter } from "@/components/engineering/BomConverter";
import { useUpdateBOM } from "@/hooks/useEngineering";
import { useToast } from "@/components/ui/Toast";
import { ProcurementService } from "@/services/procurement.service";
import { useRouter } from "next/navigation";

export default function GlobalBomPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: materials } = useMasterData('materials');
  const { success, error } = useToast();
  
  const [selectedProject, setSelectedProject] = useState<any>(null);
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
    return <div className="p-6 text-zinc-900 text-center">Loading BOM registry...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center">
            <Layers className="w-6 h-6 mr-3 text-amber-500" />
            Bill of Materials
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage material requirements across all active projects
          </p>
        </div>
      </div>

      <div className="bg-black/5 border border-black/5 rounded-2xl overflow-hidden backdrop-blur-xl">
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
  const router = useRouter();
  const { success } = useToast();
  const updateBOMMutation = useUpdateBOM(project.id);
  
  const handleSaveBOM = async (rows: any[]) => {
    try {
      const items = rows.map(r => ({
        materialId: r.matchedMaterialId || r.materialId,
        requiredQty: r.quantity || r.requiredQty,
        estimatedCost: r.basicCost || r.estimatedCost || 0,
        rawSize: r.rawMaterialSize || r.rawSize || '',
        calculatedWeight: r.totalWeight || r.calculatedWeight || 0,
        dimensions: r.length && r.width && r.height ? `${r.length}x${r.width}x${r.height}` : undefined,
        hsnCode: r.hsnCode || undefined,
        gstPercent: r.gstPercent || undefined,
        customFields: {
          srNo: r.srNo,
          partName: r.partName,
          finishSize: r.finishSize,
          rawMaterialSize: r.rawMaterialSize,
          length: r.length,
          width: r.width,
          height: r.height,
          apWeight: r.apWeight,
          totalWeight: r.totalWeight,
          basicCost: r.basicCost
        }
      }));
      await updateBOMMutation.mutateAsync({ items });
      onSuccess();
    } catch (err: any) {
      onError(err.message || "Failed to save BOM");
      throw err;
    }
  };

  const handleProceedToPO = async (rows: any[]) => {
    try {
      await handleSaveBOM(rows);

      const poItems = rows.map((r, idx) => ({
        materialId: r.matchedMaterialId || undefined,
        orderedQty: Number(r.quantity) || 1,
        agreedRate: Number(r.rate) || 0,
        basicValue: Number(r.basicCost) || 0,
        dimensions: r.rawMaterialSize || (r.length && r.width && r.height ? `${r.length} x ${r.width} x ${r.height}` : ''),
        hsnCode: r.hsnCode || '',
        gstPercent: Number(r.gstPercent) || 18,
        remarks: r.partName || r.description || `BOM Item #${r.srNo || idx + 1}`,
        customFields: {
          toolNo: r.toolNo || project?.projectNumber || 'PRJ-TOOL',
          detNo: String(r.srNo || idx + 1),
          length: String(r.length || ''),
          width: String(r.width || ''),
          height: String(r.height || ''),
          materialGrade: r.materialInput || 'MS',
          apWt: Number(r.apWeight) || 0,
          totalWt: Number(r.totalWeight) || 0,
          gstAmount: Number(r.basicCost ? r.basicCost * 0.18 : 0),
          lineTotal: Number(r.basicCost ? r.basicCost * 1.18 : 0)
        }
      }));

      const generatedPoNum = `PO/${project?.projectNumber || 'TOOL'}/${Date.now().toString().slice(-4)}`;

      const poPayload = {
        projectId: project.id,
        poNumber: generatedPoNum,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        remarks: `Auto-generated PO from BOM (${rows.length} Items)`,
        customFields: {
          rmSlipNo: `RM-${project?.projectNumber || 'SLIP'}-${Date.now().toString().slice(-4)}`,
          vendorName: 'Primary Raw Material Supplier',
          isAutoGeneratedFromBOM: true,
        },
        items: poItems,
      };

      let poCreated = false;
      try {
        await ProcurementService.createPurchaseOrder(project.id, poPayload);
        poCreated = true;
      } catch (e1) {
        try {
          await ProcurementService.createMultiProjectPo(poPayload);
          poCreated = true;
        } catch (e2: any) {
          console.error("Auto PO generation error:", e2);
          onError(e2?.response?.data?.message || e2?.message || "Failed to create PO");
        }
      }

      if (poCreated) {
        success("Purchase Order Generated Automatically!", `Created PO ${generatedPoNum}.`);
      }

      onClose();
      router.push('/purchase-orders');

    } catch (e) {
      // Handled in handleSaveBOM
    }
  };

  return (
    <div className="h-full flex flex-col pt-4">
      <BomConverter 
        projectId={project.id}
        project={project}
        materials={materials}
        onSaveBOM={handleSaveBOM}
        onProceedToPO={handleProceedToPO}
      />
    </div>
  );
}

