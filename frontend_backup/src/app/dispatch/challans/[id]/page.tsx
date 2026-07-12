'use client';

import { useStandardToolbar } from '@/hooks/useStandardToolbar';
import { useToolbarStore } from '@/store/useToolbarStore';


import React from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { Printer, Download, ArrowLeft, ChevronRight, Send, Truck, Undo2, XCircle, FileText, CheckCircle } from 'lucide-react';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { DocumentActions, DocumentAction } from '@/components/layout/DocumentActions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export default function DeliveryChallanDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();

  useStandardToolbar({
    featureId: 'doc-detail',
    onSave: () => console.log('Document saved successfully.'),
    onPrint: () => window.print(),
    onExport: () => console.log('Exporting document...'),
    onHistory: () => useToolbarStore.getState().setHistoryOpen(true),
    onAttachments: () => useToolbarStore.getState().setAttachmentsOpen(true),
  });

  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const backUrl = projectId 
    ? `/projects/${projectId.replace('PRJ-', '')}/dispatch`
    : '/dispatch/challans';

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-1.5 text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded-lg transition-all border border-white/[0.04] hover:border-white/[0.08]"
        title={projectId ? "Back to Project" : "Back to Challans"}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center text-[12px] font-medium text-zinc-500">
        {projectId ? (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/projects')}>Projects</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(`/projects/${projectId.replace('PRJ-', '')}/overview`)}>{projectId}</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push(backUrl)}>Dispatch</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">Delivery Challan</span>
          </>
        ) : (
          <>
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/dispatch/challans')}>Dispatch</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="hover:text-zinc-300 cursor-pointer" onClick={() => router.push('/dispatch/challans')}>Challans</span>
            <ChevronRight className="w-3 h-3 mx-1.5 text-zinc-700" />
            <span className="text-emerald-400 font-semibold">{resolvedParams.id}</span>
          </>
        )}
      </div>
    </div>
  );
  
  const challan = {
    no: `DC/26-27/${resolvedParams.id.padStart(3, '0')}`,
    date: '2026-07-08',
    customer: 'Tata Motors Limited',
    customerAddress: 'Pimpri, Pune, Maharashtra 411018\nGSTIN: 27AABCT1234D1Z5',
    project: 'PRJ-901',
    vehicle: 'MH 12 AB 1234',
    transport: 'VRL Logistics',
    lrNo: 'LR-99882211',
    driver: 'Santosh (9876543210)',
    remarks: 'Deliver to Gate No 4',
  };

  const items = [
    { sNo: 1, part: 'Core Pin (CP-04)', qty: '50 Nos', weight: '12.5 kg', pkg: 'Box 1', remarks: 'As per PO' },
    { sNo: 2, part: 'Ejector Pin (EJ-12)', qty: '100 Nos', weight: '5.0 kg', pkg: 'Box 2', remarks: '-' },
  ];

  const { toast } = useToast();
  const status: string = 'Draft'; // Mock status

  const documentActions: DocumentAction[] = [
    {
      id: 'issue',
      label: 'Issue',
      icon: Send,
      variant: 'primary',
      visible: status === 'Draft',
      confirmation: 'Issue this Delivery Challan?',
      onClick: () => toast('success', 'Challan Issued', 'Ready for dispatch')
    },
    {
      id: 'dispatch',
      label: 'Mark Dispatched',
      icon: Truck,
      variant: 'success',
      visible: status === 'Issued',
      onClick: () => toast('success', 'Dispatched', 'Material has left the facility')
    },
    {
      id: 'return',
      label: 'Record Return',
      icon: Undo2,
      visible: status === 'Dispatched',
      onClick: () => toast('info', 'Return', 'Not implemented')
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: XCircle,
      variant: 'danger',
      visible: status === 'Draft' || status === 'Issued',
      onClick: () => toast('error', 'Challan Cancelled', 'Document cancelled')
    }
  ];

  return (
    <>
      <div className="h-full flex flex-col w-full relative">
        <div className="flex items-center justify-between px-4 pt-4 hide-on-print">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Delivery Challan: {challan.no}</h2>
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

        <div className="flex gap-6 text-sm font-medium border-b border-white/10 px-4 pb-px mt-6 hide-on-print">
          <button className="pb-2.5 text-emerald-400 border-b-2 border-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Print Preview</button>
          <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Related Documents</button>
          <button className="text-zinc-600 hover:text-zinc-300 pb-2.5 transition-colors">Gate Pass</button>
        </div>
      <div className="h-full flex flex-col pt-4 pb-4 px-4 gap-3 overflow-auto custom-scrollbar">
        
        {/* A4 Paper Container */}
        <div id="printable-challan" className="w-[210mm] min-h-[297mm] bg-white text-black p-8 mx-auto shadow-2xl shrink-0 print:shadow-none relative">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">TOOLROOM<span className="font-light">OS</span></h1>
              <div className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">Manufacturing Division</div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold uppercase tracking-widest mb-1">Delivery Challan</h2>
              <div className="text-sm">Original for Consignee</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-0 border-2 border-black text-sm mb-6">
            <div className="border-r border-b border-black p-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">To (Consignee)</div>
              <div className="font-bold text-base">{challan.customer}</div>
              <div className="mt-1">
                Plot 45, MIDC Industrial Area<br/>
                Pune, Maharashtra 411026
              </div>
            </div>
            <div className="border-b border-black p-3">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Challan No.</div>
                  <div className="font-bold text-lg">{challan.no}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</div>
                  <div className="font-bold">{challan.date}</div>
                </div>
              </div>
            </div>
            <div className="border-r border-black p-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dispatch Mode</div>
              <div className="font-bold">{challan.transport}</div>
              <div className="text-xs text-gray-500 mt-1">Vehicle: MH-12-AB-1234</div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reference</div>
                  <div className="font-bold">PO-9921 / {challan.project}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prepared By</div>
                  <div className="font-bold">Dispatch Dept.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm border-collapse border-2 border-black mb-6">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="border-r border-black py-2 px-2 text-center w-12">S.No</th>
                <th className="border-r border-black py-2 px-2 text-left">Description of Goods</th>
                <th className="border-r border-black py-2 px-2 text-center w-24">Pkg</th>
                <th className="border-r border-black py-2 px-2 text-right w-24">Qty</th>
                <th className="border-r border-black py-2 px-2 text-right w-24">Weight</th>
                <th className="py-2 px-2 text-left w-32">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.sNo} className="border-b border-black last:border-b-0 min-h-[400px]">
                  <td className="border-r border-black py-3 px-2 text-center align-top">{item.sNo}</td>
                  <td className="border-r border-black py-3 px-2 font-bold align-top">{item.part}</td>
                  <td className="border-r border-black py-3 px-2 text-center align-top">{item.pkg}</td>
                  <td className="border-r border-black py-3 px-2 text-right font-bold align-top">{item.qty}</td>
                  <td className="border-r border-black py-3 px-2 text-right align-top">{item.weight}</td>
                  <td className="py-3 px-2 align-top">{item.remarks}</td>
                </tr>
              ))}
              <tr>
                <td className="border-r border-black h-[200px]"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          {/* Footer Grid */}
          <div className="grid grid-cols-3 border-2 border-black text-sm h-32">
            <div className="border-r border-black p-3 flex flex-col justify-between">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Receiver's Seal & Signature</div>
              <div className="text-[10px] text-gray-400">Goods received in good condition.</div>
            </div>
            <div className="border-r border-black p-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</div>
              <div className="mt-1 font-bold">{challan.remarks}</div>
            </div>
            <div className="p-3 flex flex-col justify-between items-end text-right">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Authorized Signatory</div>
              <div className="font-bold">For ToolRoomOS</div>
            </div>
          </div>

        </div>
      </div>
      </div>
    </>
  );
}
