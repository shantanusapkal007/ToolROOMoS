"use client";

import React, { useState } from 'react';
import { X, Cpu, Clock, CheckCircle, FileText, Play } from 'lucide-react';
import { useActiveRunningProjects, useCreateGlobalDesignerLog } from '../../hooks/useDailyReports';

import { useMasterData } from '../../hooks/useMasterData';

interface DesignerLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DesignerLogModal({ isOpen, onClose }: DesignerLogModalProps) {
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: employees = [] } = useMasterData('employees');
  const createDesignerLogMutation = useCreateGlobalDesignerLog();

  const [formData, setFormData] = useState({
    projectId: '',
    designerName: '',
    designerId: '',
    workStage: '3D CAD Modeling',
    cadTool: 'SolidWorks',
    partName: '',
    drawingNumber: '',
    revision: 'R0',
    description: '',
    workDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    hoursSpent: 2,
    status: 'COMPLETED',
    cadFileUrl: '',
    remarks: '',
  });

  if (!isOpen) return null;

  const handleStartTimeChange = (val: string) => {
    const newForm = { ...formData, startTime: val };
    calcHours(newForm.startTime, newForm.endTime);
  };

  const handleEndTimeChange = (val: string) => {
    const newForm = { ...formData, endTime: val };
    calcHours(newForm.startTime, newForm.endTime);
  };

  const calcHours = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return;
    const [sH, sM] = startStr.split(':').map(Number);
    const [eH, eM] = endStr.split(':').map(Number);
    let diffMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    const hrs = Number((diffMinutes / 60).toFixed(1));
    setFormData((prev) => ({ ...prev, startTime: startStr, endTime: endStr, hoursSpent: hrs }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) return;

    createDesignerLogMutation.mutate(
      {
        projectId: formData.projectId,
        designerName: formData.designerName || 'Lead Designer',
        designerId: formData.designerId || undefined,
        workStage: `${formData.cadTool} - ${formData.workStage}`,
        partName: formData.partName,
        drawingNumber: formData.drawingNumber,
        revision: formData.revision,
        description: formData.description || `Design work for ${formData.partName || 'Tooling'}`,
        workDate: formData.workDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hoursSpent: Number(formData.hoursSpent) || 2,
        status: formData.status,
        cadFileUrl: formData.cadFileUrl,
        remarks: formData.remarks,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Apple-level Translucent Glass Panel */}
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[12px] border border-white/20 dark:border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden transition-all">
        {/* Glow accent header line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-primary-subtle0/10 text-primary dark:text-blue-400 border border-blue-500/20">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Submit Designer Daily Log
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-subtle0/10 text-primary dark:text-blue-400 border border-blue-500/20 font-medium">
                    CAD / CAM
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record design iterations, 3D modeling, drawing release & toolpath logs.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Running Project & Designer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Running Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="">-- Select Active Project --</option>
                  {runningProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode}] {p.name} {p.toolName ? `(${p.toolName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Designer / Lead Engineer
                </label>
                <select
                  value={formData.designerId}
                  onChange={(e) => {
                    const emp = employees.find((x: any) => x.id === e.target.value);
                    setFormData({
                      ...formData,
                      designerId: e.target.value,
                      designerName: emp ? emp.name : formData.designerName,
                    });
                  }}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="">-- Select Designer --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department?.departmentName || 'Engineering'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Work Stage & CAD Tool */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Design Stage / Activity
                </label>
                <select
                  value={formData.workStage}
                  onChange={(e) => setFormData({ ...formData, workStage: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="2D Conceptual Design">2D Conceptual Layout</option>
                  <option value="3D CAD Modeling">3D Solid Modeling & Tool Design</option>
                  <option value="Electrode Design">Electrode Design & Extract</option>
                  <option value="CAM Toolpath Generation">CAM CNC Toolpathing & G-Code</option>
                  <option value="Drawing Release & Detailing">2D Detail Drawing Release</option>
                  <option value="FEA & Mold Flow Simulation">FEA & Mold Flow Simulation</option>
                  <option value="Design Revision / ECN">ECN Design Modification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Software Tool Used
                </label>
                <select
                  value={formData.cadTool}
                  onChange={(e) => setFormData({ ...formData, cadTool: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="SolidWorks">SolidWorks 2024</option>
                  <option value="Siemens UG NX">Siemens UG NX</option>
                  <option value="AutoCAD">AutoCAD Mechanical</option>
                  <option value="Autodesk PowerMill">Autodesk PowerMill</option>
                  <option value="MasterCAM">MasterCAM</option>
                  <option value="CATIA V5">CATIA V5</option>
                </select>
              </div>
            </div>

            {/* Part Name & Drawing Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Part / Insert / Core Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cavity Block A, Punch Plate, Core Insert 01"
                  value={formData.partName}
                  onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Drawing # / Rev
                </label>
                <input
                  type="text"
                  placeholder="DRW-1044 (R0)"
                  value={formData.drawingNumber}
                  onChange={(e) => setFormData({ ...formData, drawingNumber: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Time Tracking: Start Time, End Time & Hours Spent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[12px] bg-primary-subtle0/5 dark:bg-primary-subtle0/10 border border-blue-500/20">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" /> Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Calculated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hoursSpent}
                  onChange={(e) => setFormData({ ...formData, hoursSpent: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                  className="w-full h-9 px-3 rounded-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-primary dark:text-blue-400 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description & CAD File Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Summary & Design Notes
              </label>
              <textarea
                rows={2}
                placeholder="Describe design modifications, electrode extractions, or CAM toolpath adjustments..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-[12px] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createDesignerLogMutation.isPending}
                className="px-6 py-2.5 rounded-[12px] text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-subtle hover:shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {createDesignerLogMutation.isPending ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Save Designer Log
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
