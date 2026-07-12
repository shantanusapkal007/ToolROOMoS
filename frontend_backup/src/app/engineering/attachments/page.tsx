'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProjectBOM, useProjectRouting } from '@/hooks/useEngineering';
import { useProjects } from '@/hooks/useProjects';
import { Paperclip, UploadCloud, Download, Trash2, FileText, Image as ImageIcon, File, Sparkles, FolderOpen } from 'lucide-react';

export default function AttachmentsPage({ overrideProjectId }: { overrideProjectId?: string }) {
  const searchParams = useSearchParams();
  const projectId = overrideProjectId || searchParams.get('project');

  const { data: projectsData } = useProjects();
  const projects = projectsData || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (!projectId && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].projectNumber);
    }
  }, [projects, projectId, selectedProjectId]);

  const activeProjectId = projectId || selectedProjectId;

  const { data: bomRes } = useProjectBOM(activeProjectId || '');
  const { data: routingRes } = useProjectRouting(activeProjectId || '');

  const bom = bomRes?.data || null;
  const routing = routingRes?.data || null;

  const [attachments, setAttachments] = useState([
    { id: '1', name: 'BOM_Material_Spec_v3.pdf', size: '2.4 MB', type: 'application/pdf', category: 'BOM', date: '2026-07-08' },
    { id: '2', name: 'assembly_drawing_3d.dwg', size: '14.8 MB', type: 'application/octet-stream', category: 'BOM', date: '2026-07-08' },
    { id: '3', name: 'VMC_setup_instructions.pdf', size: '1.2 MB', type: 'application/pdf', category: 'Routing', date: '2026-07-09' },
    { id: '4', name: 'rough_milling_toolpath.nc', size: '320 KB', type: 'text/plain', category: 'Routing', date: '2026-07-09' }
  ]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((f, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
        type: f.type,
        category: 'BOM',
        date: new Date().toISOString().split('T')[0]
      }));
      setAttachments([...newFiles, ...attachments]);
    }
  };

  const deleteAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={18} className="text-red-400" />;
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return <ImageIcon size={18} className="text-blue-400" />;
    return <File size={18} className="text-zinc-400" />;
  };

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      
      {/* Project Selector for Global View */}
      {!projectId && projects.length > 0 && (
        <div className="flex justify-end shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5 backdrop-blur-md">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Project:</span>
            <select 
              value={activeProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-zinc-200 outline-none cursor-pointer focus:ring-0"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.projectNumber} className="bg-zinc-950 text-zinc-200">
                  {p.projectNumber} - {p.partName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dropzone & Upload Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
              isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.01]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <UploadCloud size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Upload Engineering Files</h3>
            <p className="text-xs text-zinc-500 mb-6 max-w-[200px]">Drag and drop blueprints, CAD files, or spec sheets here</p>
            <button className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 rounded-lg text-xs font-bold transition-all">
              Select Files
            </button>
          </div>

          <div className="glass-panel p-5 space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Active Document Links</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-zinc-400">BOM Release:</span>
                <span className="font-semibold text-zinc-200">{bom?.documentNumber || 'NOT FOUND'}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-zinc-400">Routing Release:</span>
                <span className="font-semibold text-zinc-200">{routing?.routingNumber || 'NOT FOUND'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Engineering Library</h3>
              </div>
              <span className="text-xs font-semibold text-zinc-500">{attachments.length} Files</span>
            </div>

            <div className="divide-y divide-white/5 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
              {attachments.map((file) => (
                <div key={file.id} className="py-3.5 flex items-center justify-between group hover:bg-white/[0.01] transition-all rounded px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center">
                      {getIcon(file.type)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{file.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span className="text-emerald-400/80">{file.category}</span>
                        <span>•</span>
                        <span>Uploaded {file.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] rounded border border-white/5 text-zinc-400" title="Download">
                      <Download size={14} />
                    </button>
                    <button onClick={() => deleteAttachment(file.id)} className="p-1.5 hover:text-red-400 bg-white/[0.03] hover:bg-red-500/10 rounded border border-white/5 text-zinc-500" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {attachments.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  No attachments loaded for this engineering scope.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
