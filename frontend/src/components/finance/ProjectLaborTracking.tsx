"use client";

import React, { useState } from 'react';
import { Users, Clock, DollarSign, Cpu, FileSpreadsheet, Layers, ArrowUpRight, Wrench } from 'lucide-react';
import { useMasterData } from '../../hooks/useMasterData';
import { useGlobalDailyReports } from '../../hooks/useDailyReports';
import { formatCurrency } from '../../lib/formatters';

interface ProjectLaborTrackingProps {
  projectId: string;
  designLogs?: any[];
  msdrs?: any[];
  tasks?: any[];
}

export const ProjectLaborTracking: React.FC<ProjectLaborTrackingProps> = ({
  projectId,
  designLogs: initialDesignLogs,
  msdrs: initialMsdrs,
  tasks = []
}) => {
  const [activeTab, setActiveTab] = useState<'WORKERS' | 'MACHINES' | 'ALL'>('ALL');

  // Fetch Master Data for Employees and Machines to get official hourly cost rates
  const { data: employees = [] } = useMasterData('employees');
  const { data: machines = [] } = useMasterData('machines');

  // Fetch Global Daily Reports for this project if not passed directly
  const { data: globalReportsResponse = [] } = useGlobalDailyReports({ projectId });

  const extractReports = (res: any) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const reports = extractReports(globalReportsResponse);

  // Map employee rates (Fallback to 550 INR/hr if unspecified)
  const employeeRateMap = new Map<string, number>();
  employees.forEach((emp: any) => {
    const rate = Number(emp.hourlyRate || emp.rate || 550);
    if (emp.id) employeeRateMap.set(emp.id, rate);
    if (emp.name) employeeRateMap.set(emp.name.toLowerCase(), rate);
    if (emp.employeeName) employeeRateMap.set(emp.employeeName.toLowerCase(), rate);
    if (emp.employeeCode) employeeRateMap.set(emp.employeeCode.toLowerCase(), rate);
  });

  // Map machine rates (Fallback to 1200 INR/hr for CNC/VMC/EDM if unspecified)
  const machineRateMap = new Map<string, number>();
  machines.forEach((mac: any) => {
    const rate = Number(mac.hourlyRate || mac.rate || 1200);
    if (mac.id) machineRateMap.set(mac.id, rate);
    if (mac.machineCode) machineRateMap.set(mac.machineCode.toLowerCase(), rate);
    if (mac.machineName) machineRateMap.set(mac.machineName.toLowerCase(), rate);
  });

  // --- 1. WORKER LABOR COST CALCULATIONS ---
  const workerMap = new Map<string, {
    id: string;
    name: string;
    roleOrDept: string;
    logsCount: number;
    hours: number;
    rate: number;
    totalCost: number;
  }>();

  reports.forEach((item: any) => {
    const workerName = item.personName || item.employee?.name || 'Operator / Specialist';
    const workerKey = workerName.toLowerCase();
    const hours = Number(item.hoursSpent || (Number(item.setupTime || 0) + Number(item.cuttingTime || 0)) || 0);

    let rate = employeeRateMap.get(item.personId) || employeeRateMap.get(workerKey) || 550;
    if (item.type === 'DESIGNER' && rate === 550) rate = 650; // Standard CAD designer fallback rate

    const existing = workerMap.get(workerKey) || {
      id: item.personId || workerKey,
      name: workerName,
      roleOrDept: item.section || (item.type === 'DESIGNER' ? 'ENGINEERING' : 'SHOPFLOOR'),
      logsCount: 0,
      hours: 0,
      rate,
      totalCost: 0,
    };

    existing.logsCount += 1;
    existing.hours += hours;
    existing.totalCost += hours * rate;
    workerMap.set(workerKey, existing);
  });

  const workerRows = Array.from(workerMap.values());
  const totalWorkerHours = workerRows.reduce((acc, r) => acc + r.hours, 0);
  const totalWorkerCost = workerRows.reduce((acc, r) => acc + r.totalCost, 0);

  // --- 2. MACHINE USAGE COST CALCULATIONS ---
  const machineMap = new Map<string, {
    id: string;
    codeOrName: string;
    section: string;
    logsCount: number;
    setupHours: number;
    runningHours: number;
    totalHours: number;
    rate: number;
    totalCost: number;
  }>();

  // Process only shopfloor MSDR daily reports for machines
  reports.filter((item: any) => item.type === 'MSDR').forEach((item: any) => {
    const machineName = item.machineOrTool || item.machine?.machineCode || 'Shopfloor Machine';
    const machineKey = machineName.toLowerCase();
    const setupHrs = Number(item.setupTime || 0);
    const cuttingHrs = Number(item.cuttingTime || item.hoursSpent || 0);
    const totalHrs = setupHrs + cuttingHrs;

    const rate = machineRateMap.get(machineKey) || 1200; // Standard CNC / VMC hourly rate

    const existing = machineMap.get(machineKey) || {
      id: machineKey,
      codeOrName: machineName,
      section: item.section || 'MACHINE_SHOP',
      logsCount: 0,
      setupHours: 0,
      runningHours: 0,
      totalHours: 0,
      rate,
      totalCost: 0,
    };

    existing.logsCount += 1;
    existing.setupHours += setupHrs;
    existing.runningHours += cuttingHrs;
    existing.totalHours += totalHrs;
    existing.totalCost += totalHrs * rate;
    machineMap.set(machineKey, existing);
  });

  const machineRows = Array.from(machineMap.values());
  const totalMachineHours = machineRows.reduce((acc, r) => acc + r.totalHours, 0);
  const totalMachineCost = machineRows.reduce((acc, r) => acc + r.totalCost, 0);

  const grandTotalOperationalCost = totalWorkerCost + totalMachineCost;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-zinc-950">
              Daily Report Operational Financial Cost Tracking
            </h4>
            <p className="text-xs text-zinc-500 font-medium">
              Real-time worker labor and machine usage cost rollup derived directly from Employee Daily Reports.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right bg-zinc-50 p-3 rounded-xl border border-zinc-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Total Logged Operational Expense
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600">
            {formatCurrency(grandTotalOperationalCost)}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Worker Labor Cost */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80">
              Worker / Labor Expense
            </span>
            <div className="text-lg font-bold font-mono text-blue-900 mt-0.5">
              {formatCurrency(totalWorkerCost)}
            </div>
            <span className="text-[11px] text-blue-700 font-medium">
              {totalWorkerHours.toFixed(1)} hrs logged across {workerRows.length} workers
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 2: Machine Usage Cost */}
        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600/80">
              Machine Usage Expense
            </span>
            <div className="text-lg font-bold font-mono text-purple-900 mt-0.5">
              {formatCurrency(totalMachineCost)}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">
              {totalMachineHours.toFixed(1)} hrs across {machineRows.length} machines
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Cpu className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Card 3: Combined Operational Summary */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">
              Total Logged Daily Reports
            </span>
            <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
              {reports.length} Logs Recorded
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              {(totalWorkerHours + totalMachineHours).toFixed(1)} Combined Op Hours
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileSpreadsheet className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          All Daily Cost Trackers
        </button>
        <button
          onClick={() => setActiveTab('WORKERS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'WORKERS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-zinc-500 hover:text-blue-700 hover:bg-blue-50'
          }`}
        >
          Worker Labor Costs ({workerRows.length})
        </button>
        <button
          onClick={() => setActiveTab('MACHINES')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'MACHINES'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-zinc-500 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          Machine Usage Costs ({machineRows.length})
        </button>
      </div>

      {/* WORKER LABOR BREAKDOWN TABLE */}
      {(activeTab === 'ALL' || activeTab === 'WORKERS') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Worker Labor Cost Breakdown (Daily Reports)</span>
            </h5>
            <span className="text-[11px] font-mono text-blue-700 font-bold">
              Subtotal: {formatCurrency(totalWorkerCost)}
            </span>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Worker / Specialist</th>
                  <th className="p-3">Department / Section</th>
                  <th className="p-3 text-center">Daily Logs</th>
                  <th className="p-3 text-center">Hours Worked</th>
                  <th className="p-3 text-right">Hourly Rate (₹/hr)</th>
                  <th className="p-3 text-right">Calculated Labor Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans">
                {workerRows.length > 0 ? (
                  workerRows.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-bold text-zinc-950">{row.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                          {row.roleOrDept}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-zinc-700">{row.logsCount}</td>
                      <td className="p-3 text-center font-mono font-bold text-blue-700">{row.hours.toFixed(1)} hrs</td>
                      <td className="p-3 text-right font-mono text-zinc-800">₹{row.rate.toFixed(2)}/hr</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(row.totalCost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-400 font-medium">
                      No worker hours recorded in daily reports for this project yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MACHINE USAGE BREAKDOWN TABLE */}
      {(activeTab === 'ALL' || activeTab === 'MACHINES') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Machine Usage Financial Cost Breakdown (Daily Reports)</span>
            </h5>
            <span className="text-[11px] font-mono text-purple-700 font-bold">
              Subtotal: {formatCurrency(totalMachineCost)}
            </span>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Machine Code / Equipment</th>
                  <th className="p-3">Production Section</th>
                  <th className="p-3 text-center">Shift Logs</th>
                  <th className="p-3 text-center">Setup Hrs</th>
                  <th className="p-3 text-center">Run / Cutting Hrs</th>
                  <th className="p-3 text-center">Total Machine Hrs</th>
                  <th className="p-3 text-right">Machine Rate (₹/hr)</th>
                  <th className="p-3 text-right">Calculated Machine Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans">
                {machineRows.length > 0 ? (
                  machineRows.map((row) => (
                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3 font-bold text-zinc-950">{row.codeOrName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {row.section}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-zinc-700">{row.logsCount}</td>
                      <td className="p-3 text-center font-mono text-amber-600">{row.setupHours.toFixed(1)}h</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">{row.runningHours.toFixed(1)}h</td>
                      <td className="p-3 text-center font-mono font-bold text-purple-700">{row.totalHours.toFixed(1)} hrs</td>
                      <td className="p-3 text-right font-mono text-zinc-800">₹{row.rate.toFixed(2)}/hr</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(row.totalCost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-zinc-400 font-medium">
                      No machine hours recorded in daily reports for this project yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
