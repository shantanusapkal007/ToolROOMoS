"use client";

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProject } from "../../hooks/useProjects";
import { useProjectBOM, useProjectRouting } from "../../hooks/useEngineering";
import { Folder, FileText, UploadCloud, Download, Trash2, Search, File, Image as ImageIcon, ChevronRight, FolderOpen, FileSpreadsheet, Printer } from "lucide-react";

type DocCategory = 'all' | 'engineering' | 'purchase' | 'production' | 'quality' | 'dispatch' | 'custom';

export default function DocumentsBrowser() {
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get('project');
  const rawId = projectIdParam ? projectIdParam.replace('PRJ-', '') : '';
  
  const { data: project, isLoading } = useProject(rawId);
  const projectId = projectIdParam || '';
  
  const { data: bomRes } = useProjectBOM(projectId);
  const { data: routingRes } = useProjectRouting(projectId);

  const bom = bomRes?.data || null;
  const routing = routingRes?.data || null;

  if (!projectIdParam) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 h-full">
        <Folder className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a project to view its documents.</p>
      </div>
    );
  }

  const [activeCategory, setActiveCategory] = useState<DocCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [customFiles, setCustomFiles] = useState([
    { id: 'c1', name: 'Customer_PO_2026.pdf', size: '1.2 MB', type: 'application/pdf', category: 'custom' as const, date: '2026-07-01' },
    { id: 'c2', name: 'Part_Drawing_Rev3.dwg', size: '8.4 MB', type: 'application/octet-stream', category: 'custom' as const, date: '2026-07-05' },
  ]);

  // Auto-generated document index from real data
  const autoDocuments = useMemo(() => {
    const docs: Array<{ id: string; name: string; size: string; type: string; category: DocCategory; date: string; status?: string }> = [];

    if (bom) {
      docs.push({
        id: `bom-${bom.id}`,
        name: `BOM — ${bom.documentNumber || 'Draft'}`,
        size: `${bom.items?.length || 0} items`,
        type: 'engineering/bom',
        category: 'engineering',
        date: bom.updatedAt ? new Date(bom.updatedAt).toLocaleDateString() : 'N/A',
        status: bom.approvalStatus,
      });
    }

    if (routing) {
      docs.push({
        id: `routing-${routing.id}`,
        name: `Machine Routing — ${routing.routingNumber || 'Draft'}`,
        size: `${routing.operations?.length || 0} ops`,
        type: 'engineering/routing',
        category: 'engineering',
        date: routing.updatedAt ? new Date(routing.updatedAt).toLocaleDateString() : 'N/A',
        status: routing.approvalStatus,
      });
    }

    // Placeholder entries for other categories (these would come from real APIs in production)
    if (project) {
      docs.push(
        { id: 'po-placeholder', name: 'Purchase Orders', size: 'Linked via Purchase Module', type: 'link', category: 'purchase', date: '-' },
        { id: 'grn-placeholder', name: 'Goods Receipt Notes', size: 'Linked via Inventory Module', type: 'link', category: 'purchase', date: '-' },
        { id: 'jc-placeholder', name: 'Job Cards', size: 'Linked via Production Module', type: 'link', category: 'production', date: '-' },
        { id: 'msdr-placeholder', name: 'MSDR Logs', size: 'Linked via Production Module', type: 'link', category: 'production', date: '-' },
        { id: 'insp-placeholder', name: 'Inspection Reports', size: 'Linked via Quality Module', type: 'link', category: 'quality', date: '-' },
        { id: 'ncr-placeholder', name: 'NCR Reports', size: 'Linked via Quality Module', type: 'link', category: 'quality', date: '-' },
        { id: 'dc-placeholder', name: 'Delivery Challans', size: 'Linked via Dispatch Module', type: 'link', category: 'dispatch', date: '-' },
        { id: 'inv-placeholder', name: 'Tax Invoices', size: 'Linked via Dispatch Module', type: 'link', category: 'dispatch', date: '-' },
      );
    }

    return docs;
  }, [bom, routing, project]);

  const allDocs = [...autoDocuments, ...customFiles.map(f => ({ ...f, status: undefined }))];

  const filteredDocs = useMemo(() => {
    return allDocs.filter(doc => {
      const matchCategory = activeCategory === 'all' || doc.category === activeCategory;
      const matchSearch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allDocs, activeCategory, searchQuery]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((f, i) => ({
        id: `upload-${Date.now()}-${i}`,
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        type: f.type,
        category: 'custom' as const,
        date: new Date().toLocaleDateString(),
      }));
      setCustomFiles(prev => [...newFiles, ...prev]);
    }
  };

  const deleteFile = (id: string) => {
    setCustomFiles(prev => prev.filter(f => f.id !== id));
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={16} className="text-red-400" />;
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return <ImageIcon size={16} className="text-blue-400" />;
    if (type === 'engineering/bom') return <FileSpreadsheet size={16} className="text-emerald-400" />;
    if (type === 'engineering/routing') return <FileSpreadsheet size={16} className="text-blue-400" />;
    if (type === 'link') return <FolderOpen size={16} className="text-zinc-400" />;
    return <File size={16} className="text-zinc-400" />;
  };

  const categories: { id: DocCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All Documents', count: allDocs.length },
    { id: 'engineering', label: 'Engineering', count: allDocs.filter(d => d.category === 'engineering').length },
    { id: 'purchase', label: 'Purchase', count: allDocs.filter(d => d.category === 'purchase').length },
    { id: 'production', label: 'Production', count: allDocs.filter(d => d.category === 'production').length },
    { id: 'quality', label: 'Quality', count: allDocs.filter(d => d.category === 'quality').length },
    { id: 'dispatch', label: 'Dispatch', count: allDocs.filter(d => d.category === 'dispatch').length },
    { id: 'custom', label: 'Uploads', count: customFiles.length },
  ];

  if (isLoading || !project) return null;

  return (
    <div className="flex-1 h-full flex flex-col animate-fade-in min-h-0">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 mr-3 text-pink-400">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Document Browser</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Unified Project Documents — {project.projectNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border border-white/5 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 pl-8 pr-3 py-2 outline-none focus:border-white/10 w-52"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Sidebar Categories */}
        <div className="w-48 shrink-0 space-y-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeCategory === cat.id 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] font-mono opacity-60">{cat.count}</span>
            </button>
          ))}

          {/* Upload Zone */}
          <div 
            className={`mt-4 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all ${
              isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-5 h-5 text-zinc-500 mb-2" />
            <span className="text-[10px] text-zinc-500 font-bold">Drop files here</span>
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/[0.01] border border-white/5 rounded-2xl">
          <div className="divide-y divide-white/5">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="py-3 px-5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                    {getIcon(doc.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                      {doc.status && (
                        <>
                          <span>•</span>
                          <span className={`${doc.status === 'APPROVED' ? 'text-emerald-400' : doc.status === 'PENDING' ? 'text-amber-400' : 'text-zinc-400'}`}>
                            {doc.status}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.category === 'custom' && (
                    <button onClick={() => deleteFile(doc.id)} className="p-1.5 hover:text-red-400 bg-white/[0.03] hover:bg-red-500/10 rounded border border-white/5 text-zinc-500" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button className="p-1.5 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded border border-white/5 text-zinc-400" title="Download">
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ))}

            {filteredDocs.length === 0 && (
              <div className="py-16 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">
                No documents found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
