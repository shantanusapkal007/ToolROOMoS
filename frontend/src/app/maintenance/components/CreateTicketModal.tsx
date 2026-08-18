"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useCreateMaintenanceTicket } from '../../../hooks/useMaintenance';
import { useProjects } from '../../../hooks/useProjects';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Combobox } from '../../../components/ui/Combobox';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  Wrench,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Layers,
  Tag,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMachineId?: string;
  preselectedProjectId?: string;
}

const FALLBACK_MACHINES = [
  { id: '8e1f1982-00cb-480c-848b-1fa172a2bc91', machineCode: 'MCH-VMC-01', machineName: 'HAAS VF-4SS 5-Axis High Speed VMC', department: 'MACHINE_SHOP' },
  { id: '9bc03a85-704f-434f-851d-af9c67c3f55b', machineCode: 'MCH-CNCT-01', machineName: 'DMG MORI NLX 2500 Live Tool CNC Lathe', department: 'MACHINE_SHOP' },
  { id: '41bc6c4b-c259-494d-a373-5f4ef41c2e3e', machineCode: 'MCH-CMM-01', machineName: 'Zeiss ACCURA 3D Coordinate Measuring Machine', department: 'QUALITY' },
  { id: 'd8c43fb2-f18a-408d-aeec-cfe88c224e35', machineCode: 'MCH-RDRILL-01', machineName: 'Kao Ming KMR-2000D Heavy Radial Drill', department: 'PRODUCTION' },
  { id: 'b612eedb-8950-48ed-ab45-3c822d4e1c74', machineCode: 'MCH-TPRESS-01', machineName: 'AIDA 100-Ton Hydraulic Die Spotting Press', department: 'FITTING' },
];

const FALLBACK_TECHNICIANS = [
  { id: '307be3c5-ef3c-47da-8229-21d64d63beb6', name: 'System Admin', role: 'Lead Maintenance Engineer' },
  { id: 'bae7d3dc-1102-412c-8c11-8bc1d74dfd18', name: 'Production Operator', role: 'Operator / Machinist' },
  { id: '3fb1e78e-dc2c-4388-89ef-b6af65088351', name: 'Purchase Officer', role: 'Spare Parts Procurement' },
];

const BREAKDOWN_CATEGORIES = [
  { value: 'MECHANICAL', label: 'Mechanical (Spindle / Bearing / Leadscrew / Chuck / ATC)' },
  { value: 'ELECTRICAL', label: 'Electrical (Servo Drive / Power Supply / Motor / Panel)' },
  { value: 'HYDRAULIC', label: 'Hydraulic (Pressure Drop / Pump / Valve / Oil Leak)' },
  { value: 'PNEUMATIC', label: 'Pneumatic (Air Pressure / Solenoid / Regulator / Cylinder)' },
  { value: 'SOFTWARE', label: 'Software / CNC (Controller Alarm / Sensor / Limit Switch)' },
  { value: 'TOOLING_JAM', label: 'Tooling Jam (Tool Breakage / Workpiece Collision / Clamp)' },
  { value: 'PREVENTIVE', label: 'Preventive Servicing & Calibration Routine' },
];

const QUICK_SYMPTOMS = [
  'Abnormal Spindle Vibration',
  'Servo Axis Error 401',
  'Hydraulic Pressure Drop',
  'Tool Changer Jammed (ATC)',
  'Coolant Pump Malfunction',
  'E-Stop Tripped / Safety Interlock',
  'Positioning Deviation / Backlash',
];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  preselectedMachineId = '',
  preselectedProjectId = '',
}) => {
  const { success, error } = useToast();
  const [machineId, setMachineId] = useState(preselectedMachineId);
  const [projectId, setProjectId] = useState(preselectedProjectId);
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [assignedToId, setAssignedToId] = useState('');
  const [category, setCategory] = useState('MECHANICAL');
  const [lotoApplied, setLotoApplied] = useState(false);
  const [downtimeStartedAt, setDowntimeStartedAt] = useState('');

  // Set default downtimeStartedAt to current ISO local time
  useEffect(() => {
    if (isOpen && !downtimeStartedAt) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDowntimeStartedAt(now.toISOString().slice(0, 16));
    }
  }, [isOpen, downtimeStartedAt]);

  const createTicket = useCreateMaintenanceTicket();
  const { data: projects = [] } = useProjects();

  // Fetch Machines with fallback
  const { data: rawMachines } = useQuery({
    queryKey: ['machines-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/master-data/machines?limit=100');
        const data = res?.data !== undefined ? res.data : res;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
      } catch (err) {}
      return FALLBACK_MACHINES;
    },
  });

  // Fetch Technicians with fallback
  const { data: rawUsers } = useQuery({
    queryKey: ['technicians-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/master-data/employees?limit=100');
        const data = res?.data !== undefined ? res.data : res;
        if (Array.isArray(data) && data.length > 0) return data;
        if (data && Array.isArray(data.data) && data.data.length > 0) return data.data;
      } catch (err) {}
      return FALLBACK_TECHNICIANS;
    },
  });

  // Machine Options
  const machineOptions = useMemo(() => {
    const list = (rawMachines && rawMachines.length > 0 ? rawMachines : FALLBACK_MACHINES) as any[];
    return list.map((m: any) => ({
      value: m.id || m.machineCode,
      label: `[${m.machineCode}] ${m.machineName || 'Machine Asset'}${m.department ? ` • ${m.department}` : ''}`,
    }));
  }, [rawMachines]);

  // Project Options
  const projectOptions = useMemo(() => {
    return projects.map((p: any) => {
      const custName =
        (typeof p.customer === 'object' && p.customer !== null ? p.customer.companyName : p.customer) ||
        p.customerName ||
        p.clientName;
      return {
        value: p.id,
        label: `[${p.projectNumber || 'PRJ'}] ${p.partName || p.description || p.name || 'Tool Project'}${
          custName ? ` (${custName})` : ''
        }`,
      };
    });
  }, [projects]);

  // Technician Options
  const technicianOptions = useMemo(() => {
    const list = (rawUsers && rawUsers.length > 0 ? rawUsers : FALLBACK_TECHNICIANS) as any[];
    return list.map((u: any) => ({
      value: u.id,
      label: `${u.name || u.employeeName || u.email || 'Technician'}${
        u.role || u.designation ? ` — ${u.role || u.designation}` : ''
      }`,
    }));
  }, [rawUsers]);

  const handleSetCurrentTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setDowntimeStartedAt(now.toISOString().slice(0, 16));
  };

  const handleAppendSymptom = (symptom: string) => {
    setIssueDescription((prev) => {
      if (!prev.trim()) return symptom;
      if (prev.includes(symptom)) return prev;
      return `${prev.trim()}, ${symptom}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId) {
      error('Machine Required', 'Please select a shopfloor machine asset.');
      return;
    }
    if (!issueDescription.trim()) {
      error('Description Required', 'Please provide breakdown symptoms or issue description.');
      return;
    }

    try {
      await createTicket.mutateAsync({
        machineId,
        projectId: projectId || undefined,
        issueDescription: issueDescription.trim(),
        priority,
        assignedToId: assignedToId || undefined,
        category: category || undefined,
        downtimeStartedAt: downtimeStartedAt ? new Date(downtimeStartedAt).toISOString() : new Date().toISOString(),
        lotoApplied,
      });

      success('Breakdown Ticket Logged', 'Machine breakdown ticket submitted and asset marked under maintenance.');

      // Reset form
      setMachineId('');
      setProjectId('');
      setIssueDescription('');
      setPriority('NORMAL');
      setAssignedToId('');
      setCategory('MECHANICAL');
      setLotoApplied(false);
      setDowntimeStartedAt('');

      onClose();
    } catch (err: any) {
      error('Failed to Report Breakdown', err?.message || 'Error submitting maintenance ticket.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Machine Breakdown / Maintenance Ticket"
      subtitle="Log asset breakdown for instant technician dispatch, downtime calculation, and digital LOTO safety tracking."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* 1. Machine Asset Selection (Required) */}
        <div>
          <Select
            label="Machine / Shopfloor Asset"
            required
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            size="md"
          >
            <option value="">Select breakdown machine asset...</option>
            {machineOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* 2. Related Tooling Project (Optional) */}
        <div>
          <Select
            label="Related Project / Running Tool (Optional)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            size="md"
          >
            <option value="">Search affected tooling project or workpiece...</option>
            {projectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* 3. Assignee Technician & Breakdown Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Assignee Technician / Engineer"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              size="md"
            >
              <option value="">Assign maintenance technician...</option>
              {technicianOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Breakdown Category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              size="md"
            >
              {BREAKDOWN_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* 4. Downtime Started At */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
              Downtime Started At
            </label>
            <button
              type="button"
              onClick={handleSetCurrentTime}
              className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Clock className="w-3 h-3" /> Set to Current Time
            </button>
          </div>
          <input
            type="datetime-local"
            value={downtimeStartedAt}
            onChange={(e) => setDowntimeStartedAt(e.target.value)}
            className="w-full h-10 bg-canvas border border-border-gray px-3 text-xs text-ink rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
            required
          />
        </div>

        {/* 5. Priority Level Selector */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
            Breakdown Severity & Priority Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'LOW', label: 'LOW', desc: 'Minor / Operational', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
              { id: 'NORMAL', label: 'NORMAL', desc: 'Standard Breakdown', color: 'border-blue-300 bg-blue-50 text-blue-700' },
              { id: 'HIGH', label: 'HIGH', desc: 'Line Bottleneck', color: 'border-amber-300 bg-amber-50 text-amber-700' },
              { id: 'CRITICAL', label: 'CRITICAL', desc: 'Total Stoppage / Danger', color: 'border-red-400 bg-red-50 text-red-700 font-bold' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id as any)}
                className={`py-2 px-2.5 rounded-[10px] border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  priority === p.id
                    ? `${p.color} shadow-xs ring-1 ring-primary/40`
                    : 'bg-canvas border-border-gray text-cool-gray hover:text-ink hover:bg-neutral-100'
                }`}
              >
                <span className="font-bold text-[11px]">{p.label}</span>
                <span className="text-[9.5px] opacity-80">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Digital LOTO (Lockout / Tagout) Safety Isolation */}
        <div
          onClick={() => setLotoApplied(!lotoApplied)}
          className={`p-3.5 rounded-[12px] border transition-all cursor-pointer flex items-start gap-3 ${
            lotoApplied
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
              : 'bg-canvas border-border-gray hover:border-cool-gray/60 text-ink'
          }`}
        >
          <div
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              lotoApplied ? 'bg-amber-600 text-white' : 'border border-border-gray bg-white'
            }`}
          >
            {lotoApplied && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Apply Digital LOTO (Lockout / Tagout) Isolation Safety Lock</span>
            </div>
            <p className="text-[11px] text-cool-gray">
              Isolates electrical and pneumatic feeds. Automatically tags machine with digital safety lock until cleared.
            </p>
          </div>
        </div>

        {/* 7. Quick Symptom Chips */}
        <div>
          <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-cool-gray" /> Quick Symptom Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SYMPTOMS.map((symptom) => (
              <button
                key={symptom}
                type="button"
                onClick={() => handleAppendSymptom(symptom)}
                className="px-2 py-1 rounded-[6px] bg-canvas hover:bg-primary/10 hover:text-primary border border-border-gray text-[10.5px] font-medium text-ink transition-colors cursor-pointer"
              >
                + {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Issue Description (Required) */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1 uppercase tracking-wider">
            Issue Description & Error Symptoms <span className="text-red-500">*</span>
          </label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            required
            rows={3}
            placeholder="Describe the breakdown symptoms, error codes on CNC controller, mechanical noises, or potential hazards..."
            className="w-full bg-canvas border border-border-gray rounded-[10px] p-3 text-xs text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle resize-none"
          />
        </div>

        {/* 9. Actions Footer */}
        <div className="pt-3 border-t border-border-gray flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={createTicket.isPending}
            disabled={!machineId || !issueDescription.trim()}
          >
            {createTicket.isPending ? 'Logging Breakdown...' : 'Submit Breakdown Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
