'use client';

import React, { useState } from 'react';
import { useToolbarStore } from '@/store/useToolbarStore';
import { X, UploadCloud, Database, CheckCircle, AlertTriangle } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
}

export function UniversalImport({ onClose }: ImportModalProps) {
  const { activeFeature } = useToolbarStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState('');
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
      setFileName(e.dataTransfer.files[0].name);
      setTimeout(() => setStep(2), 500); // Simulate processing
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl flex flex-col min-h-[400px] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Import Data</h2>
              <p className="text-xs text-zinc-400">Excel / CSV Migration Tool</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          
          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <StepIndicator current={step} step={1} label="Upload" />
            <div className={`h-px w-12 ${step >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
            <StepIndicator current={step} step={2} label="Mapping" />
            <div className={`h-px w-12 ${step >= 3 ? 'bg-indigo-500' : 'bg-white/10'}`} />
            <StepIndicator current={step} step={3} label="Validation" />
          </div>

          {/* Steps */}
          {step === 1 && (
            <div 
              className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Select Excel or CSV File</h3>
              <p className="text-sm text-zinc-400 mb-6 max-w-sm">Drag and drop your export file here, or click to browse your computer.</p>
              <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all">
                Browse Files
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mb-4">
                <div className="text-sm text-zinc-300 mb-1">File: <span className="text-white font-medium">{fileName}</span></div>
                <div className="text-xs text-zinc-500">Found 152 rows. We automatically mapped 4 out of 5 columns.</div>
              </div>

              <div className="flex-1 border border-white/10 rounded-lg overflow-hidden bg-black/40">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-2 font-medium text-zinc-400">CSV Header</th>
                      <th className="px-4 py-2 font-medium text-zinc-400">Database Field</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-4 py-2 text-zinc-300">Part Number</td>
                      <td className="px-4 py-2 text-indigo-400">documentNumber</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-zinc-300">Description</td>
                      <td className="px-4 py-2 text-indigo-400">description</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-zinc-300">Cost</td>
                      <td className="px-4 py-2 text-zinc-500 italic">-- Select Field --</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white glass-button">Back</button>
                <button onClick={() => setStep(3)} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-lg shadow-indigo-500/20 transition-all">
                  Run Validation
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Validation Successful</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                152 rows are ready to be imported. 0 duplicates detected. All mappings match standard schema.
              </p>
              
              <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-left flex items-start gap-3 mb-8">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-200">
                  Importing will create new records. This action cannot be undone. Are you sure you want to proceed?
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 text-sm text-zinc-400 hover:text-white glass-button">Back</button>
                <button onClick={onClose} className="px-6 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 transition-all font-medium">
                  Complete Import
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, step, label }: { current: number, step: number, label: string }) {
  const isCompleted = current > step;
  const isActive = current === step;
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        isCompleted ? 'bg-indigo-500 text-white' : 
        isActive ? 'border-2 border-indigo-500 text-indigo-400' : 
        'border-2 border-white/10 text-zinc-500'
      }`}>
        {isCompleted ? <CheckCircle size={12} /> : step}
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
    </div>
  );
}
