'use client';

import React, { useState } from 'react';
import { useToolbarStore } from '@/store/useToolbarStore';
import { X, Paperclip, UploadCloud, Download, Trash2, FileText, Image as ImageIcon, File } from 'lucide-react';

interface AttachmentsModalProps {
  onClose: () => void;
}

export function UniversalAttachments({ onClose }: AttachmentsModalProps) {
  const { selection } = useToolbarStore();
  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState([
    { id: '1', name: 'specification_v2.pdf', size: '2.4 MB', type: 'application/pdf', date: new Date().toISOString() },
    { id: '2', name: 'schematic_diagram.png', size: '850 KB', type: 'image/png', date: new Date(Date.now() - 86400000).toISOString() }
  ]);
  
  if (!selection || selection.length === 0) return null;

  const doc = selection[0];
  const docNumber = doc.documentNumber || doc.routingNumber || doc.id;

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
        date: new Date().toISOString()
      }));
      setAttachments([...newFiles, ...attachments]);
    }
  };

  const deleteAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={16} className="text-red-400" />;
    if (type.includes('image')) return <ImageIcon size={16} className="text-blue-400" />;
    return <File size={16} className="text-zinc-400" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Paperclip size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Attachments</h2>
              <p className="text-xs text-zinc-400">Files for {docNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Dropzone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
              isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <UploadCloud size={24} />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">Upload Files</h3>
            <p className="text-xs text-zinc-400 mb-4">Drag and drop files here, or click to browse</p>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors">
              Select Files
            </button>
          </div>

          {/* File List */}
          <div>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Attached Files ({attachments.length})</h4>
            {attachments.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No attachments yet.</div>
            ) : (
              <div className="space-y-2">
                {attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center shrink-0">
                        {getIcon(file.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-200 line-clamp-1">{file.name}</div>
                        <div className="text-xs text-zinc-500">{file.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-white rounded-md hover:bg-white/10">
                        <Download size={14} />
                      </button>
                      <button onClick={() => deleteAttachment(file.id)} className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/20">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
