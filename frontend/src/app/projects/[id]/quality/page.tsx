"use client";

import React, { useState } from 'react';
import { CheckSquare, AlertTriangle, FileText, ClipboardList, Plus, PlayCircle } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useProject } from "@/hooks/useProjects";
import { useProjectRouting } from "@/hooks/useEngineering";
import { useLogInspection, useCloseNcr } from "@/hooks/useQuality";
import { useMasterData } from "@/hooks/useMasterData";
import { formatDate } from "@/lib/formatters";

export default function QualityTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: routingOps } = useProjectRouting(projectId);
  const routingOperations = routingOps?.operations || [];
  
  const logInspectionMutation = useLogInspection(projectId);
  const closeNcrMutation = useCloseNcr(projectId);
  
  const [activeTab, setActiveTab] = useState<'INSPECTIONS' | 'NCRS'>('INSPECTIONS');
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  
  // Inspection Form State
  const [inspectionType, setInspectionType] = useState('IN_PROCESS');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [qty, setQty] = useState({ inspected: 0, passed: 0, rework: 0, scrap: 0 });
  const [remarks, setRemarks] = useState('');

  // NCR Form State
  const [selectedNcr, setSelectedNcr] = useState<any>(null);
  const [ncrDisposition, setNcrDisposition] = useState('REWORK');
  const [ncrRootCause, setNcrRootCause] = useState('');

  if (projectLoading || !project) return null;

  const inspections = project.inspectionHeaders || [];
  const ncrs = project.ncrReports || [];

  const handleLogInspection = async () => {
    let result = 'PASS';
    if (qty.scrap > 0) result = 'SCRAP';
    else if (qty.rework > 0) result = 'REWORK';
    
    try {
      await logInspectionMutation.mutateAsync({ 
        inspectionType,
        routingOperationId: inspectionType === 'IN_PROCESS' ? selectedOperation : undefined,
        inspectedQty: qty.inspected, 
        passedQty: qty.passed,
        reworkQty: qty.rework,
        scrapQty: qty.scrap,
        result, 
        remarks
      });
      setDrawerMode(null);
      // Reset form
      setQty({ inspected: 0, passed: 0, rework: 0, scrap: 0 });
      setRemarks('');
    } catch (err: any) {}
  };

  const handleCloseNcr = async () => {
    if (!selectedNcr) return;
    try {
      await closeNcrMutation.mutateAsync({
        ncrId: selectedNcr.id,
        data: { disposition: ncrDisposition, rootCause: ncrRootCause }
      });
      setDrawerMode(null);
      setSelectedNcr(null);
      setNcrDisposition('REWORK');
      setNcrRootCause('');
    } catch (err: any) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-emerald-400" /> Quality Assurance
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage inspections, NCRs, and quality metrics</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={() => setDrawerMode('INSPECT')} 
          >
            <Plus className="w-4 h-4 mr-2" /> Log Inspection
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-px">
        {['INSPECTIONS', 'NCRS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        {activeTab === 'INSPECTIONS' && (
          <SmartTable 
            data={inspections}
            isLoading={false}
            columns={[
              { key: 'inspectionNumber', label: 'Report No' },
              { key: 'inspectionType', label: 'Type' },
              { key: 'result', label: 'Result', render: (val) => (
                  <span className={`px-2 py-1 rounded text-xs font-bold ${val === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {val}
                  </span>
              )},
              { key: 'createdAt', label: 'Date', render: (val) => formatDate(val) },
              { key: 'inspectedQty', label: 'Inspected' },
              { key: 'passedQty', label: 'Passed' },
            ]}
          />
        )}
        
        {activeTab === 'NCRS' && (
          <SmartTable 
            data={ncrs}
            isLoading={false}
            columns={[
              { key: 'ncrNumber', label: 'NCR No' },
              { key: 'status', label: 'Status', render: (val) => (
                  <span className={`px-2 py-1 rounded text-xs font-bold ${val === 'OPEN' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {val}
                  </span>
              )},
              { key: 'description', label: 'Description' },
              { key: 'disposition', label: 'Disposition', render: (val) => val || '-' },
              { 
                key: 'actions', 
                label: '', 
                render: (_, row) => row.status === 'OPEN' ? (
                  <button onClick={() => { setSelectedNcr(row); setDrawerMode('CLOSE_NCR'); }} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-lg transition-colors flex items-center">
                    <CheckSquare className="w-3 h-3 mr-1" /> Resolve
                  </button>
                ) : null
              }
            ]}
          />
        )}
      </div>

      <PremiumDrawer
        isOpen={drawerMode === 'INSPECT'}
        onClose={() => setDrawerMode(null)}
        title="Log Inspection"
        subtitle="Record quality control measurements and decisions"
      >
        <div className="space-y-4 p-1">
          <Select label="Inspection Type" value={inspectionType} onChange={e => setInspectionType(e.target.value)}>
            <option value="IN_PROCESS">In-Process</option>
            <option value="FINAL_PDI">Final Pre-Dispatch</option>
            <option value="RECEIVING">Receiving (GRN)</option>
          </Select>

          {inspectionType === 'IN_PROCESS' && (
            <Select label="Routing Operation" value={selectedOperation} onChange={e => setSelectedOperation(e.target.value)}>
              <option value="">Select operation...</option>
              {routingOperations.map((op: any) => (
                <option key={op.id} value={op.id}>{op.operation?.operationName} (Seq {op.sequenceOrder})</option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Inspected Qty" type="number" value={qty.inspected} onChange={e => setQty({...qty, inspected: Number(e.target.value)})} />
            <Input label="Passed Qty" type="number" value={qty.passed} onChange={e => setQty({...qty, passed: Number(e.target.value)})} />
            <Input label="Rework Qty" type="number" value={qty.rework} onChange={e => setQty({...qty, rework: Number(e.target.value)})} />
            <Input label="Scrap Qty" type="number" value={qty.scrap} onChange={e => setQty({...qty, scrap: Number(e.target.value)})} />
          </div>

          <Input label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
          
          <div className="pt-6">
            <Button variant="primary" onClick={handleLogInspection} className="w-full">
              Submit Report
            </Button>
          </div>
        </div>
      </PremiumDrawer>

      <PremiumDrawer
        isOpen={drawerMode === 'CLOSE_NCR'}
        onClose={() => setDrawerMode(null)}
        title="Resolve NCR"
        subtitle={`Close Non-Conformance Report ${selectedNcr?.ncrNumber}`}
      >
        <div className="space-y-4 p-1">
          <Select label="Disposition" value={ncrDisposition} onChange={e => setNcrDisposition(e.target.value)}>
            <option value="REWORK">Rework</option>
            <option value="USE_AS_IS">Use As Is</option>
            <option value="SCRAP">Scrap</option>
            <option value="RETURN_TO_VENDOR">Return to Vendor</option>
          </Select>

          <Input label="Root Cause Analysis" value={ncrRootCause} onChange={e => setNcrRootCause(e.target.value)} />
          
          <div className="pt-6">
            <Button variant="primary" onClick={handleCloseNcr} className="w-full">
              Close NCR
            </Button>
          </div>
        </div>
      </PremiumDrawer>

    </div>
  );
}
