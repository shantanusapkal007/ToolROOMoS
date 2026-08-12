"use client";

import React, { useState } from 'react';
import { X, Wrench, Clock, Settings, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useActiveRunningProjects, useCreateGlobalMsdrLog } from '../../hooks/useDailyReports';

import { useMasterData } from '../../hooks/useMasterData';

interface MsdrLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MsdrLogModal({ isOpen, onClose }: MsdrLogModalProps) {
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: machines = [] } = useMasterData('machines');
  const { data: employees = [] } = useMasterData('employees');
  const createMsdrLogMutation = useCreateGlobalMsdrLog();

  const [formData, setFormData] = useState({
    projectId: '',
    productionSection: 'MACHINE_SHOP',
    machineId: '',
    employeeId: '',
    reportDate: new Date().toISOString().split('T')[0],
    toolNo: '',
    detNo: '',
    description: '',
    rawMatlSize: '',
    finishMatlSize: '',
    producedQty: 1,
    startTime: '08:30',
    endTime: '17:30',
    setupTime: 0.5,
    cuttingTime: 7.5,
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
    const totalHrs = Number((diffMinutes / 60).toFixed(1));
    setFormData((prev) => ({
      ...prev,
      startTime: startStr,
      endTime: endStr,
      cuttingTime: totalHrs,
      setupTime: 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.machineId || !formData.employeeId) return;

    createMsdrLogMutation.mutate(
      {
        projectId: formData.projectId,
        productionSection: formData.productionSection,
        machineId: formData.machineId,
        employeeId: formData.employeeId,
        reportDate: formData.reportDate,
        toolNo: formData.toolNo,
        detNo: formData.detNo,
        description: formData.description || `Machining on tool ${formData.toolNo || 'N/A'}`,
        rawMatlSize: formData.rawMatlSize,
        finishMatlSize: formData.finishMatlSize,
        producedQty: Number(formData.producedQty) || 1,
        startTime: formData.startTime,
        endTime: formData.endTime,
        setupTime: Number(formData.setupTime) || 0,
        cuttingTime: Number(formData.cuttingTime) || 0,
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
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Submit Shopfloor MSDR Log
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                    Machine & Fitting Log
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Record machining, setup, G-code cutting, wirecut & assembly operations for running tools.
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
            {/* Running Project & Production Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Running Project <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
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
                  Production Section / Shop
                </label>
                <select
                  value={formData.productionSection}
                  onChange={(e) => setFormData({ ...formData, productionSection: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                >
                  <option value="MACHINE_SHOP">Machine Shop</option>
                  <option value="PRESS_SHOP">Press Shop & Tryout</option>
                  <option value="TOOL_ROOM_FITTING">Tool Room Fitting & Assembly</option>
                  <option value="FABRICATION_INDIAN">Fabrication (India)</option>
                  <option value="FABRICATION_EXPORT">Fabrication (Foreign)</option>
                  <option value="QUALITY_INSPECTION">Quality & CMM Inspection</option>
                </select>
              </div>
            </div>

            {/* Machine / Tool & Operator / Employee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Machine / Equipment <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                >
                  <option value="">-- Select Tool / Machine --</option>
                  {machines.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      [{m.machineCode}] {m.machineName} ({m.machineType || 'Tool'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Operator / Machinist <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                >
                  <option value="">-- Select Operator --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department?.departmentName || 'Production'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tool # & Det # */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tool No / Die Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. TL-2024-08"
                  value={formData.toolNo}
                  onChange={(e) => setFormData({ ...formData, toolNo: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Det No / Component
                </label>
                <input
                  type="text"
                  placeholder="e.g. DET-01, Punch Block"
                  value={formData.detNo}
                  onChange={(e) => setFormData({ ...formData, detNo: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Produced Qty
                </label>
                <input
                  type="number"
                  value={formData.producedQty}
                  onChange={(e) => setFormData({ ...formData, producedQty: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                  className="w-full h-10 px-3.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Time Tracking: Start, End, Setup & Cutting Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-[12px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" /> Start
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-500" /> End
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Hours Spent (h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cuttingTime}
                  onChange={(e) => setFormData({ ...formData, cuttingTime: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                  className="w-full h-9 px-3 rounded-[12px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Description & Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Operation Details & Machining Description
              </label>
              <textarea
                rows={2}
                placeholder="Details of operation: CNC roughing, VMC finishing, Wire EDM cutting, Surface grinding, Bench fitting..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-[12px] bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all resize-none"
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
                disabled={createMsdrLogMutation.isPending}
                className="px-6 py-2.5 rounded-[12px] text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-subtle hover:shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {createMsdrLogMutation.isPending ? (
                  <span>Saving MSDR...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Save MSDR Log
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
