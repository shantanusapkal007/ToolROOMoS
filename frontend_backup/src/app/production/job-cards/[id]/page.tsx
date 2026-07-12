'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { Printer, Download, ArrowLeft, ChevronRight, Play, Pause, PauseCircle, CheckCircle, History } from 'lucide-react';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export function JobCardFormContent({ jobCardId, projectId }: { jobCardId: string; projectId?: string | null }) {
  useStandardToolbar({
    featureId: 'doc-detail',
    onSave: () => console.log('Document saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => console.log('Exporting document...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const jobCard = {
    no: `JC/2026/${jobCardId.padStart(3, '0')}`,
    project: 'PRJ-901',
    part: 'Base Plate',
    material: 'Aluminium Grade 7075 (B-40501)',
    issueDate: '2026-07-08',
    targetDate: '2026-07-15',
  };

  const operations = [
    { op: '10', desc: 'Raw Material Cutting', machine: 'Bandsaw', operator: 'Rajeev', target: '2026-07-09' },
    { op: '20', desc: 'Rough Milling', machine: 'VMC-01', operator: 'Ramesh', target: '2026-07-10' },
    { op: '30', desc: 'Heat Treatment', machine: 'Outsource', operator: '-', target: '2026-07-12' },
    { op: '40', desc: 'Finish Grinding', machine: 'SG-02', operator: 'Amit', target: '2026-07-14' },
    { op: '50', desc: 'Final Inspection', machine: 'CMM', operator: 'QC', target: '2026-07-15' },
  ];

  const { toast } = useToast();
  const status: string = 'Ready'; // Mock status

  const documentActions: DocumentAction[] = [
    {
      id: 'start',
      label: 'Start',
      icon: Play,
      variant: 'primary',
      visible: status === 'Ready',
      onClick: () => toast('success', 'Job Started', 'Status changed to Running')
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: Pause,
      variant: 'secondary',
      visible: status === 'Running',
      onClick: () => toast('info', 'Job Paused', 'Status changed to Hold')
    },
    {
      id: 'complete',
      label: 'Complete',
      icon: CheckCircle,
      variant: 'success',
      visible: status === 'Running',
      onClick: () => toast('success', 'Job Completed', 'Status changed to Completed')
    },
    {
      id: 'hold',
      label: 'Hold',
      icon: PauseCircle,
      variant: 'danger',
      visible: status === 'Ready' || status === 'Running',
      onClick: () => toast('info', 'Job Hold', 'Status changed to Hold')
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      visible: status === 'Completed',
      onClick: () => toast('info', 'History', 'Not implemented')
    }
  ];

  return (
      <div className="h-full flex flex-col w-full relative bg-transparent">
        <div className="flex items-center justify-between px-4 pt-4 hide-on-print relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Job Card: {jobCard.no}</h2>
            <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase mt-0.5">
              <span className="text-blue-400">{status}</span>
              <DocumentActions actions={documentActions} />
              {projectId && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">Project: {projectId}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 text-sm font-medium border-b border-white/10 px-4 pb-px mt-6 hide-on-print relative z-10">
          <button className="pb-2.5 transition-colors text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            Printable View
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar flex justify-center pb-10 pt-6 relative z-10">
        
        {/* Printable Area (A4 Proportions) */}
        <div className="w-full max-w-[210mm] bg-white text-black min-h-[297mm] shadow-2xl p-10 font-sans" id="printable-job-card">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">JOB CARD</h1>
              <p className="text-sm font-semibold text-gray-600 mt-1">{jobCard.no}</p>
            </div>
            <div className="text-right">
              {/* Fake Barcode representation */}
              <div className="font-barcode text-5xl mb-1">*JC2026001*</div>
              <p className="text-xs text-gray-500 font-mono">{jobCard.no}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold text-gray-600">Project</span>
              <span className="font-bold">{jobCard.project}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold text-gray-600">Issue Date</span>
              <span className="font-bold">{jobCard.issueDate}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold text-gray-600">Part Name</span>
              <span className="font-bold">{jobCard.part}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1">
              <span className="font-semibold text-gray-600">Target Date</span>
              <span className="font-bold">{jobCard.targetDate}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-1 col-span-2">
              <span className="font-semibold text-gray-600">Material Issued</span>
              <span className="font-bold uppercase">{jobCard.material}</span>
            </div>
          </div>

          {/* Operations Table */}
          <h2 className="text-lg font-bold mb-3 border-b-2 border-black pb-1 uppercase tracking-wider">Operations Routing</h2>
          
          <table className="w-full text-sm border-collapse mb-8">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-black">
                <th className="py-2 px-2 text-left w-12">Op#</th>
                <th className="py-2 px-2 text-left">Description</th>
                <th className="py-2 px-2 text-left w-24">Machine</th>
                <th className="py-2 px-2 text-left w-24">Operator</th>
                <th className="py-2 px-2 text-left w-24">Target</th>
                <th className="py-2 px-2 text-center w-24">Inspector</th>
                <th className="py-2 px-2 text-center w-24">Sign</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="py-3 px-2 font-bold text-gray-500">{op.op}</td>
                  <td className="py-3 px-2 font-bold">{op.desc}</td>
                  <td className="py-3 px-2">{op.machine}</td>
                  <td className="py-3 px-2">{op.operator}</td>
                  <td className="py-3 px-2">{op.target}</td>
                  <td className="py-3 px-2 border-l border-gray-300"></td>
                  <td className="py-3 px-2 border-l border-gray-300"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Remarks Section */}
          <div className="border-2 border-black p-4 min-h-[150px]">
            <h3 className="font-bold text-sm mb-2 text-gray-600 uppercase tracking-wider">Quality / Rework Remarks</h3>
            <div className="border-b border-dashed border-gray-300 mt-6"></div>
            <div className="border-b border-dashed border-gray-300 mt-6"></div>
            <div className="border-b border-dashed border-gray-300 mt-6"></div>
          </div>

          <div className="mt-8 flex justify-between text-xs font-semibold text-gray-500 uppercase">
            <span>Generated via ToolRoomOS</span>
            <span>Auth: __________________</span>
          </div>

        </div>
      </div>
      </div>
  );
}

export default function JobCardDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  return <JobCardFormContent jobCardId={resolvedParams.id} projectId={projectId} />;
}
