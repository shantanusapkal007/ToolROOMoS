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
  Cpu,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetType?: 'MACHINE' | 'DIE_TOOL';
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

const MACHINE_CATEGORIES = [
  { value: 'MECHANICAL', label: 'Mechanical (Spindle / Bearing / Leadscrew / Chuck / ATC)' },
  { value: 'ELECTRICAL', label: 'Electrical (Servo Drive / Power Supply / Motor / Panel)' },
  { value: 'HYDRAULIC', label: 'Hydraulic (Pressure Drop / Pump / Valve / Oil Leak)' },
  { value: 'PNEUMATIC', label: 'Pneumatic (Air Pressure / Solenoid / Regulator / Cylinder)' },
  { value: 'SOFTWARE', label: 'Software / CNC (Controller Alarm / Sensor / Limit Switch)' },
  { value: 'TOOLING_JAM', label: 'Tooling Jam (Tool Breakage / Workpiece Collision / Clamp)' },
  { value: 'PREVENTIVE', label: 'Preventive Servicing & Calibration Routine' },
];

const DIE_FAILURE_MODES = [
  { value: 'PUNCH_BREAKAGE', label: 'Punch Breakage (Punch Snapped / Chipped / Sheared)' },
  { value: 'DIE_INSERT_CRACK', label: 'Die Insert / Cavity Crack (Stress Fracture / Chipping)' },
  { value: 'STRIPPER_EJECTOR_JAM', label: 'Stripper Plate / Ejector Pin Jam (Stuck / Pin Broken)' },
  { value: 'GUIDE_PILLAR_BUSH_WEAR', label: 'Guide Post & Bushing Wear (Scoring / Clearance Play)' },
  { value: 'SPRING_GAS_STRUT_FAILURE', label: 'Spring / Nitrogen Cylinder Failure (Lost Pressure / Broken)' },
  { value: 'PRESS_DIE_COLLISION_SMASH', label: 'Press Die Smash / Misfeed Crash (Double Blank Impact)' },
  { value: 'BURR_CLEARANCE_WEAR', label: 'Cutting Edge Burr / Clearance Loss (Blunt Edges)' },
  { value: 'FORMING_PAD_GALLING', label: 'Forming Radius Galling / Scuffing (Material Pickup)' },
  { value: 'PREVENTIVE_SHARPENING', label: 'Scheduled Tool Regrinding & Sharpening Routine' },
  { value: 'OTHER', label: 'Other Tooling Breakdown' },
];

const DIE_ACTIONS_REQUIRED = [
  { value: 'WIRE_CUT_NEW_PUNCH', label: 'Wire EDM: Cut & Fit New Replacement Punch' },
  { value: 'REGRIND_SHARPEN', label: 'Surface Grinder: Regrind & Sharpen Cutting Edges' },
  { value: 'CNC_REMILL_INSERT', label: 'CNC VMC: Re-machine / Fabricate New Die Insert' },
  { value: 'WELD_REMILL', label: 'Laser / TIG Weld Repair & Re-machine Profile' },
  { value: 'REPLACE_SPRINGS', label: 'Replace Broken Nitrogen / Die Springs' },
  { value: 'POLISH_FIT_DEBURR', label: 'Bench Fitting: Polish Draw Radius & Re-bed Tool' },
  { value: 'REPLACE_GUIDE_PILLARS', label: 'Replace Guide Posts & Bronze Bushings' },
  { value: 'OTHER', label: 'Other Toolroom Corrective Action' },
];

const QUICK_MACHINE_SYMPTOMS = [
  'Abnormal Spindle Vibration',
  'Servo Axis Error 401',
  'Hydraulic Pressure Drop',
  'Tool Changer Jammed (ATC)',
  'Coolant Pump Malfunction',
  'E-Stop Tripped / Safety Interlock',
  'Positioning Deviation / Backlash',
];

const QUICK_DIE_SYMPTOMS = [
  'Punch snapped during 250T stamping stroke',
  'Excessive burr on blanked edge (>0.2mm)',
  'Die plate insert cracked near pilot hole',
  'Stripper plate jammed with stamped strip',
  'Die smash damage due to double sheet misfeed',
  'Nitrogen gas cylinder pressure lost',
  'Pilot pin bent / sheared',
  'Galling on draw punch radius',
];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  initialTargetType = 'MACHINE',
  preselectedMachineId = '',
  preselectedProjectId = '',
}) => {
  const { success, error } = useToast();
  const [targetType, setTargetType] = useState<'MACHINE' | 'DIE_TOOL'>(initialTargetType);
  const [machineId, setMachineId] = useState(preselectedMachineId);
  const [projectId, setProjectId] = useState(preselectedProjectId);
  const [dieToolName, setDieToolName] = useState('');
  const [toolNumber, setToolNumber] = useState('');
  const [brokenComponent, setBrokenComponent] = useState('');
  const [strokeCountAtFailure, setStrokeCountAtFailure] = useState<string>('');
  const [failureMode, setFailureMode] = useState('PUNCH_BREAKAGE');
  const [actionRequired, setActionRequired] = useState('WIRE_CUT_NEW_PUNCH');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [assignedToId, setAssignedToId] = useState('');
  const [category, setCategory] = useState('MECHANICAL');
  const [lotoApplied, setLotoApplied] = useState(false);
  const [downtimeStartedAt, setDowntimeStartedAt] = useState('');

  // Sync initialTargetType when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetType(initialTargetType);
    }
  }, [isOpen, initialTargetType]);

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

  const handleSelectProject = (projId: string) => {
    setProjectId(projId);
    if (projId) {
      const p = projects.find((item: any) => item.id === projId);
      if (p) {
        setDieToolName(p.partName || p.description || p.name || 'Stamping Die');
        setToolNumber(p.projectNumber || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'MACHINE' && !machineId) {
      error('Machine Required', 'Please select a shopfloor machine asset.');
      return;
    }
    if (targetType === 'DIE_TOOL' && !dieToolName.trim() && !projectId) {
      error('Die / Tool Required', 'Please select or enter the Die / Tool name.');
      return;
    }
    if (!issueDescription.trim()) {
      error('Description Required', 'Please provide breakdown symptoms or issue description.');
      return;
    }

    try {
      await createTicket.mutateAsync({
        targetType,
        machineId: machineId || undefined,
        projectId: projectId || undefined,
        dieToolName: targetType === 'DIE_TOOL' ? (dieToolName.trim() || undefined) : undefined,
        toolNumber: targetType === 'DIE_TOOL' ? (toolNumber.trim() || undefined) : undefined,
        brokenComponent: targetType === 'DIE_TOOL' ? (brokenComponent.trim() || undefined) : undefined,
        strokeCountAtFailure: targetType === 'DIE_TOOL' && strokeCountAtFailure ? Number(strokeCountAtFailure) : undefined,
        failureMode: targetType === 'DIE_TOOL' ? failureMode : undefined,
        actionRequired: targetType === 'DIE_TOOL' ? actionRequired : undefined,
        issueDescription: issueDescription.trim(),
        priority,
        assignedToId: assignedToId || undefined,
        category: targetType === 'DIE_TOOL' ? 'DIE_TOOLING' : (category || undefined),
        downtimeStartedAt: downtimeStartedAt ? new Date(downtimeStartedAt).toISOString() : new Date().toISOString(),
        lotoApplied: targetType === 'MACHINE' ? lotoApplied : false,
      });

      success(
        targetType === 'DIE_TOOL' ? 'Die Breakage Ticket Logged' : 'Breakdown Ticket Logged',
        targetType === 'DIE_TOOL'
          ? 'Die maintenance order recorded for toolroom corrective action.'
          : 'Machine breakdown ticket submitted and asset marked under maintenance.'
      );

      // Reset form
      setMachineId('');
      setProjectId('');
      setDieToolName('');
      setToolNumber('');
      setBrokenComponent('');
      setStrokeCountAtFailure('');
      setIssueDescription('');
      setPriority('NORMAL');
      setAssignedToId('');
      setCategory('MECHANICAL');
      setLotoApplied(false);
      setDowntimeStartedAt('');

      onClose();
    } catch (err: any) {
      error('Failed to Report Maintenance', err?.message || 'Error submitting maintenance ticket.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetType === 'DIE_TOOL' ? "Report Die / Press Tool Breakage" : "Report Machine Breakdown"}
      subtitle={
        targetType === 'DIE_TOOL'
          ? "Log toolroom die damage, punch breakage, insert cracking, or scheduled regrinding for immediate corrective action."
          : "Log asset breakdown for instant technician dispatch, downtime calculation, and digital LOTO safety tracking."
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Target Asset Type Switcher (Machine vs Die / Tool) */}
        <div>
          <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider">
            Maintenance Asset Target
          </label>
          <div className="grid grid-cols-2 gap-2 bg-canvas p-1 rounded-[12px] border border-border-gray">
            <button
              type="button"
              onClick={() => setTargetType('MACHINE')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                targetType === 'MACHINE'
                  ? 'bg-white text-ink shadow-subtle border border-border-gray font-bold'
                  : 'text-cool-gray hover:text-ink'
              }`}
            >
              <Cpu className="w-4 h-4 text-primary" />
              <span>Machine Asset (CNC / VMC / Press / Drill)</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('DIE_TOOL')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                targetType === 'DIE_TOOL'
                  ? 'bg-white text-amber-700 shadow-subtle border border-amber-300 font-bold'
                  : 'text-cool-gray hover:text-ink'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Die / Press Tool Breakage</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DIE & PRESS TOOL BREAKAGE FIELDS                               */}
        {/* ------------------------------------------------------------- */}
        {targetType === 'DIE_TOOL' && (
          <div className="space-y-3 bg-amber-500/5 p-4 rounded-[12px] border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Tooling & Die Damage Parameters</span>
              </div>
              <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
                Toolroom Corrective Order
              </span>
            </div>

            {/* Die / Tool Project Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Select
                  label="Select Tooling Project (Optional)"
                  value={projectId}
                  onChange={(e) => handleSelectProject(e.target.value)}
                  size="md"
                >
                  <option value="">Choose active tooling project...</option>
                  {projectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Die / Tool Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Progressive Stamping Die - Lower Bracket"
                  value={dieToolName}
                  onChange={(e) => setDieToolName(e.target.value)}
                  className="w-full h-10 bg-white border border-border-gray px-3 text-xs text-ink rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>
            </div>

            {/* Broken Component & Tool # & Stroke Count */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Broken Component / Det #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Station 4 Piercing Punch Det #12"
                  value={brokenComponent}
                  onChange={(e) => setBrokenComponent(e.target.value)}
                  className="w-full h-10 bg-white border border-border-gray px-3 text-xs text-ink rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Tool Identification #
                </label>
                <input
                  type="text"
                  placeholder="e.g. TOOL-2026-042"
                  value={toolNumber}
                  onChange={(e) => setToolNumber(e.target.value)}
                  className="w-full h-10 bg-white border border-border-gray px-3 text-xs text-ink font-mono rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Stroke / Hit Count at Failure
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={strokeCountAtFailure}
                  onChange={(e) => setStrokeCountAtFailure(e.target.value)}
                  className="w-full h-10 bg-white border border-border-gray px-3 text-xs text-ink font-mono rounded-[10px] focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>
            </div>

            {/* Broken Component Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-semibold text-cool-gray">Quick Components:</span>
              {[
                'Piercing Punch',
                'Blanking Die Insert',
                'Bending Blade',
                'Stripper Plate Pin',
                'Guide Bushing',
                'Forming Cavity Insert',
                'Nitrogen Gas Cylinder',
              ].map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setBrokenComponent(comp)}
                  className="px-2 py-0.5 rounded-[6px] bg-white hover:bg-amber-100 hover:text-amber-900 border border-border-gray text-[10px] font-medium text-ink transition-colors cursor-pointer"
                >
                  + {comp}
                </button>
              ))}
            </div>

            {/* Die Breakdown Mode & Toolroom Action Required */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Select
                  label="Die Failure Mode / Breakage Type"
                  required
                  value={failureMode}
                  onChange={(e) => setFailureMode(e.target.value)}
                  size="md"
                >
                  {DIE_FAILURE_MODES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  label="Toolroom Action Required"
                  required
                  value={actionRequired}
                  onChange={(e) => setActionRequired(e.target.value)}
                  size="md"
                >
                  {DIE_ACTIONS_REQUIRED.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Press Machine (Optional) */}
            <div>
              <Select
                label="Press Machine where Die was Running (Optional)"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                size="md"
              >
                <option value="">Select press machine (if breakdown occurred on press)...</option>
                {machineOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MACHINE ASSET BREAKDOWN FIELDS                                */}
        {/* ------------------------------------------------------------- */}
        {targetType === 'MACHINE' && (
          <div className="space-y-3">
            {/* Machine Asset Selection (Required) */}
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

            {/* Related Tooling Project (Optional) */}
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

            {/* Machine Category */}
            <div>
              <Select
                label="Breakdown Category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                size="md"
              >
                {MACHINE_CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Digital LOTO (Lockout / Tagout) Safety Isolation */}
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
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* COMMON FIELDS: ASSIGNEE, DOWNTIME, PRIORITY, DESCRIPTION     */}
        {/* ------------------------------------------------------------- */}

        {/* Assignee Technician & Downtime Started At */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label={targetType === 'DIE_TOOL' ? "Assign Toolroom Fitter / Die Maker" : "Assign Maintenance Technician"}
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              size="md"
            >
              <option value="">Assign specialist technician...</option>
              {technicianOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

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
                <Clock className="w-3 h-3" /> Set Current Time
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
        </div>

        {/* Priority Level Selector */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wider">
            Breakdown Severity & Priority Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'LOW', label: 'LOW', desc: 'Minor / Normal Wear', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
              { id: 'NORMAL', label: 'NORMAL', desc: 'Standard Tooling Job', color: 'border-blue-300 bg-blue-50 text-blue-700' },
              { id: 'HIGH', label: 'HIGH', desc: 'Press Line Bottleneck', color: 'border-amber-300 bg-amber-50 text-amber-700' },
              { id: 'CRITICAL', label: 'CRITICAL', desc: 'Total Press Stoppage / Crash', color: 'border-red-400 bg-red-50 text-red-700 font-bold' },
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

        {/* Quick Symptom Chips */}
        <div>
          <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-cool-gray" />
            <span>{targetType === 'DIE_TOOL' ? 'Quick Die Symptoms' : 'Quick Machine Symptoms'}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(targetType === 'DIE_TOOL' ? QUICK_DIE_SYMPTOMS : QUICK_MACHINE_SYMPTOMS).map((symptom) => (
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

        {/* Issue Description (Required) */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1 uppercase tracking-wider">
            Breakdown & Damage Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            required
            rows={3}
            placeholder={
              targetType === 'DIE_TOOL'
                ? "Describe the punch breakage, chipped insert profile, sheared pilot, or abnormal stamping burr..."
                : "Describe the breakdown symptoms, error codes on CNC controller, mechanical noises, or potential hazards..."
            }
            className="w-full bg-canvas border border-border-gray rounded-[10px] p-3 text-xs text-ink placeholder:text-mute focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle resize-none"
          />
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-border-gray flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={createTicket.isPending}
            disabled={
              (targetType === 'MACHINE' && !machineId) ||
              (targetType === 'DIE_TOOL' && !dieToolName.trim() && !projectId) ||
              !issueDescription.trim()
            }
          >
            {createTicket.isPending
              ? 'Logging Maintenance...'
              : targetType === 'DIE_TOOL'
              ? 'Submit Die Breakage Ticket'
              : 'Submit Breakdown Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
