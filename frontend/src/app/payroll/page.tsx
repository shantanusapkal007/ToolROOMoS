"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Save, 
  X, 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  FileText,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';

interface ProjectContribution {
  projectId: string;
  projectNumber: string;
  partName: string;
  customerName: string;
  hours: number;
  taskCount: number;
  activities: any[];
}

interface EmployeePayrollData {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  employeeType: 'INTERNAL' | 'EXTERNAL';
  department: { id: string; name: string } | null;
  hourlyRate: number;
  totalHours: number;
  standardHours: number;
  baseSalaryCalculated: number;
  actualSalary: number;
  variance: number;
  isCustomSalary: boolean;
  remarks: string;
  projectCount: number;
  projects: ProjectContribution[];
  workLogs: any[];
}

export default function MonthlyPayrollPage() {
  const [monthYear, setMonthYear] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });

  const [dateRangeType, setDateRangeType] = useState<'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [payrollData, setPayrollData] = useState<{
    monthYear: string;
    summary: {
      totalEmployees: number;
      totalHoursWorked: number;
      totalBaseSalary: number;
      totalActualSalary: number;
      totalVariance: number;
    };
    employees: EmployeePayrollData[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEmpType, setSelectedEmpType] = useState<string>('ALL');

  // Editing Actual Salary
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editingActualSalary, setEditingActualSalary] = useState<number | string>('');
  const [editingRemarks, setEditingRemarks] = useState<string>('');
  const [savingSalary, setSavingSalary] = useState<boolean>(false);

  // Selected Employee for Detailed Work Logs View
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<EmployeePayrollData | null>(null);

  const { success, error } = useToast();

  useEffect(() => {
    fetchPayrollData();
  }, [monthYear, startDate, endDate, dateRangeType]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      let queryUrl = `/hr/monthly-payroll?`;
      if (dateRangeType === 'custom' && startDate && endDate) {
        queryUrl += `startDate=${startDate}&endDate=${endDate}`;
      } else {
        queryUrl += `monthYear=${monthYear}`;
      }
      const res: any = await api.get(queryUrl);
      // The Axios interceptor already unwraps response.data.
      // The backend returns { monthYear, summary, employees } directly.
      // Handle both wrapped ({ data: { ... } }) and unwrapped responses.
      const data = res?.data || res;
      setPayrollData(data);
    } catch (err: any) {
      console.error('Failed to fetch monthly payroll data', err);
      error('Load Failed', err?.message || 'Failed to fetch monthly payroll and work data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActualSalary = async (employeeId: string) => {
    setSavingSalary(true);
    try {
      const numericVal = Number(editingActualSalary);
      if (isNaN(numericVal) || numericVal < 0) {
        throw new Error('Please enter a valid salary amount.');
      }

      await api.post('/hr/monthly-salary', {
        employeeId,
        monthYear,
        actualSalary: numericVal,
        remarks: editingRemarks,
      });

      success('Salary Updated', `Saved actual monthly salary of ₹${numericVal.toLocaleString()} for this month.`);
      setEditingEmpId(null);
      fetchPayrollData();
    } catch (err: any) {
      error('Update Failed', err?.message || 'Failed to update actual salary');
    } finally {
      setSavingSalary(false);
    }
  };

  const handleExportCSV = () => {
    if (!payrollData || !payrollData.employees) return;
    const headers = [
      'Employee Code',
      'Name',
      'Designation',
      'Department',
      'Employee Type',
      'Hourly Rate (INR)',
      'Total Hours Worked',
      'Projects Worked On',
      'Calculated Base Salary (INR)',
      'Actual Monthly Salary (INR)',
      'Variance (INR)',
      'Status'
    ];

    const rows = payrollData.employees.map(emp => [
      `"${emp.employeeCode}"`,
      `"${emp.name}"`,
      `"${emp.designation}"`,
      `"${emp.department?.name || 'N/A'}"`,
      `"${emp.employeeType}"`,
      emp.hourlyRate,
      emp.totalHours,
      `"${emp.projects.map(p => p.projectNumber).join(', ')}"`,
      emp.baseSalaryCalculated,
      emp.actualSalary,
      emp.variance,
      emp.isCustomSalary ? 'Custom Override' : 'Calculated'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Payroll_Report_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Export Completed', 'Monthly payroll CSV downloaded successfully.');
  };

  // Departments list for filtering
  const departmentsList = useMemo(() => {
    if (!payrollData?.employees) return [];
    const depts = new Set<string>();
    payrollData.employees.forEach(e => {
      if (e.department?.name) depts.add(e.department.name);
    });
    return Array.from(depts);
  }, [payrollData]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!payrollData?.employees) return [];
    return payrollData.employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.projects.some(p => p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.partName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDepartment === 'ALL' || emp.department?.name === selectedDepartment;
      const matchesType = selectedEmpType === 'ALL' || emp.employeeType === selectedEmpType;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [payrollData, searchQuery, selectedDepartment, selectedEmpType]);

  // Format month title
  const monthDisplayTitle = useMemo(() => {
    if (dateRangeType === 'custom' && startDate && endDate) {
      return `${startDate} to ${endDate}`;
    }
    const [yyyy, mm] = monthYear.split('-');
    const dateObj = new Date(Number(yyyy), Number(mm) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [monthYear, dateRangeType, startDate, endDate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-6">
        
        {/* Header */}
        <PageHeader
          title="Employee Monthly Salary & Project Work"
          subtitle="Global monthly overview of work performed across all projects, base calculated rates, and editable actual payouts."
          actions={
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2.5 bg-black/5 hover:bg-black/10 text-zinc-900 border border-black/10 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Download className="h-4 w-4 mr-2 text-emerald-600" />
                Export Payroll CSV
              </button>
            </div>
          }
        />

        {/* Editable Month Span Bar */}
        <div className="bg-white/60 dark:bg-zinc-900/60 border border-black/10 rounded-2xl p-5 mb-8 backdrop-blur-xl shadow-elevation relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 via-blue-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Active Month Span
                </span>
                <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight mt-0.5">
                  {monthDisplayTitle}
                </h2>
              </div>
            </div>

            {/* Editable Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-black/5 p-1 rounded-xl border border-black/10">
                <button
                  onClick={() => setDateRangeType('month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRangeType === 'month' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  Month Picker
                </button>
                <button
                  onClick={() => setDateRangeType('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRangeType === 'custom' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                >
                  Custom Range
                </button>
              </div>

              {dateRangeType === 'month' ? (
                <div className="flex items-center space-x-2 bg-black/5 px-3 py-2 rounded-xl border border-black/10">
                  <span className="text-xs font-semibold text-zinc-500">Select Month:</span>
                  <input 
                    type="month"
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="bg-transparent font-bold text-xs text-zinc-900 focus:outline-none cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-black/5 px-3 py-2 rounded-xl border border-black/10">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs text-zinc-900 font-medium focus:outline-none cursor-pointer"
                  />
                  <span className="text-xs text-zinc-400">to</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs text-zinc-900 font-medium focus:outline-none cursor-pointer"
                  />
                </div>
              )}

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center space-x-1.5">
                {[-1, 0].map(offset => {
                  const d = new Date();
                  d.setMonth(d.getMonth() + offset);
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const key = `${y}-${m}`;
                  const label = d.toLocaleDateString('en-US', { month: 'short' });
                  return (
                    <button
                      key={key}
                      onClick={() => { setDateRangeType('month'); setMonthYear(key); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${monthYear === key && dateRangeType === 'month' ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-black/5 border-black/5 text-zinc-600 hover:bg-black/10'}`}
                    >
                      {label} {y}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary KPI Cards */}
        {payrollData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <SummaryCard 
              title="Total Workforce"
              value={payrollData.summary.totalEmployees.toString()}
              subtext="Employees & Contractors"
              icon={<Users className="w-5 h-5 text-blue-500" />}
              accentColor="blue"
            />
            <SummaryCard 
              title="Total Worked Hours"
              value={`${payrollData.summary.totalHoursWorked} hrs`}
              subtext="Across all projects"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              accentColor="amber"
            />
            <SummaryCard 
              title="Calculated Base Salary"
              value={`₹${payrollData.summary.totalBaseSalary.toLocaleString()}`}
              subtext="Rate × Actual Worked Hours"
              icon={<Calculator className="w-5 h-5 text-slate-500" />}
              accentColor="slate"
            />
            <SummaryCard 
              title="Actual Monthly Payout"
              value={`₹${payrollData.summary.totalActualSalary.toLocaleString()}`}
              subtext="Persisted Payout Total"
              icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
              accentColor="emerald"
            />
            <SummaryCard 
              title="Net Variance"
              value={`${payrollData.summary.totalVariance >= 0 ? '+' : ''}₹${payrollData.summary.totalVariance.toLocaleString()}`}
              subtext="Actual vs Base Difference"
              icon={payrollData.summary.totalVariance >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-rose-500" />}
              accentColor={payrollData.summary.totalVariance >= 0 ? "emerald" : "rose"}
            />
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search employee name, code, designation, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-zinc-900 text-xs focus:outline-none focus:border-emerald-500 transition-colors shadow-sm backdrop-blur-md"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-xs shadow-sm backdrop-blur-md">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-medium">Dept:</span>
              <select 
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-white/60 border border-black/10 rounded-xl px-3 py-2 text-xs shadow-sm backdrop-blur-md">
              <span className="text-zinc-500 font-medium">Type:</span>
              <select 
                value={selectedEmpType}
                onChange={(e) => setSelectedEmpType(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="INTERNAL">Internal</option>
                <option value="EXTERNAL">External / Contract</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Payroll & Work Table */}
        <div className="bg-white/70 border border-black/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl">
          {loading ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-zinc-500">Aggregating actual work done across all projects for {monthDisplayTitle}...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-black/[0.03] text-zinc-500 border-b border-black/5 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Department & Role</th>
                    <th className="px-6 py-4 text-center">Hourly Rate</th>
                    <th className="px-6 py-4">Actual Work Hours</th>
                    <th className="px-6 py-4">Projects Contributed</th>
                    <th className="px-6 py-4 text-right">Calculated Base Salary</th>
                    <th className="px-6 py-4 text-right">Actual Salary (Editable)</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-zinc-400 italic">
                        No employees found matching filter for {monthDisplayTitle}.
                      </td>
                    </tr>
                  ) : filteredEmployees.map(emp => {
                    const isEditing = editingEmpId === emp.id;
                    const isOvertime = emp.totalHours > emp.standardHours;

                    return (
                      <tr 
                        key={emp.id} 
                        className="hover:bg-black/[0.02] transition-colors group"
                      >
                        {/* Employee Code & Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border ${emp.employeeType === 'EXTERNAL' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                              {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 text-sm flex items-center space-x-2">
                                <span>{emp.name}</span>
                                {emp.isCustomSalary && (
                                  <span className="bg-amber-500/10 text-amber-700 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-500/20">
                                    Override
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                                <span>{emp.employeeCode}</span>
                                <span>•</span>
                                <span className={emp.employeeType === 'EXTERNAL' ? 'text-purple-600 font-medium' : 'text-blue-600 font-medium'}>
                                  {emp.employeeType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department & Role */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-zinc-800">{emp.designation}</div>
                          <div className="text-zinc-500 text-[11px]">{emp.department?.name || 'Unassigned'}</div>
                        </td>

                        {/* Hourly Rate */}
                        <td className="px-6 py-4 text-center">
                          <span className="font-mono font-bold text-zinc-800">₹{emp.hourlyRate}</span>
                          <span className="text-zinc-400 text-[10px]"> / hr</span>
                        </td>

                        {/* Actual Work Hours */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between space-x-2">
                              <span className={`font-mono font-extrabold text-sm ${emp.totalHours > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                {emp.totalHours} hrs
                              </span>
                              <span className="text-[10px] text-zinc-400">/ {emp.standardHours}h std</span>
                            </div>

                            {/* Hours Progress Bar */}
                            <div className="w-36 h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isOvertime ? 'bg-amber-500' : emp.totalHours > 0 ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                                style={{ width: `${Math.min(100, (emp.totalHours / emp.standardHours) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Projects Contributed */}
                        <td className="px-6 py-4">
                          {emp.projects.length === 0 ? (
                            <span className="text-zinc-400 italic text-[11px]">No logged project work</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {emp.projects.slice(0, 3).map((p, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedEmployeeDetail(emp)}
                                  className="inline-flex items-center space-x-1 bg-black/5 hover:bg-emerald-500/10 text-zinc-800 hover:text-emerald-700 px-2 py-1 rounded-md text-[11px] font-medium border border-black/5 hover:border-emerald-500/30 transition-colors cursor-pointer"
                                  title={`${p.partName} (${p.customerName}): ${p.hours} hrs`}
                                >
                                  <span className="font-bold font-mono">{p.projectNumber}</span>
                                  <span className="text-[10px] text-zinc-500">({p.hours}h)</span>
                                </button>
                              ))}
                              {emp.projects.length > 3 && (
                                <button
                                  onClick={() => setSelectedEmployeeDetail(emp)}
                                  className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 hover:bg-emerald-500/20"
                                >
                                  +{emp.projects.length - 3} more
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Calculated Base Salary */}
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-zinc-900 text-sm">
                            ₹{emp.baseSalaryCalculated.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {emp.totalHours > 0 ? `${emp.totalHours}h × ₹${emp.hourlyRate}` : `Std Base`}
                          </div>
                        </td>

                        {/* Actual Monthly Salary (EDITABLE) */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex flex-col items-end space-y-2">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-zinc-900 text-xs">₹</span>
                                <input 
                                  type="number"
                                  value={editingActualSalary}
                                  onChange={(e) => setEditingActualSalary(e.target.value)}
                                  className="w-28 bg-white border border-emerald-500 rounded-lg px-2.5 py-1 text-zinc-900 text-xs font-bold font-mono focus:outline-none shadow-sm"
                                  placeholder="Enter Salary"
                                  autoFocus
                                />
                              </div>
                              <input 
                                type="text"
                                value={editingRemarks}
                                onChange={(e) => setEditingRemarks(e.target.value)}
                                placeholder="Remarks / Bonus Note"
                                className="w-36 bg-white border border-black/10 rounded-md px-2 py-0.5 text-[10px] text-zinc-700 focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono font-extrabold text-emerald-600 text-base">
                                  ₹{emp.actualSalary.toLocaleString()}
                                </span>
                              </div>

                              {/* Variance Badge */}
                              {emp.variance !== 0 && (
                                <span className={`text-[10px] font-mono font-bold ${emp.variance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {emp.variance > 0 ? `+₹${emp.variance.toLocaleString()} Bonus` : `-₹${Math.abs(emp.variance).toLocaleString()} Deduction`}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleSaveActualSalary(emp.id)}
                                disabled={savingSalary}
                                className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                title="Save Actual Salary"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingEmpId(null)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setEditingEmpId(emp.id);
                                  setEditingActualSalary(emp.actualSalary);
                                  setEditingRemarks(emp.remarks || '');
                                }}
                                className="px-2.5 py-1.5 bg-black/5 hover:bg-black/10 text-zinc-700 rounded-lg text-xs font-semibold inline-flex items-center space-x-1 transition-all cursor-pointer"
                                title="Edit Monthly Actual Salary"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Edit Salary</span>
                              </button>

                              <button
                                onClick={() => setSelectedEmployeeDetail(emp)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                                title="View Work Details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Work Breakdown Modal */}
        {selectedEmployeeDetail && (
          <Modal
            isOpen={!!selectedEmployeeDetail}
            onClose={() => setSelectedEmployeeDetail(null)}
            title={`Project Work Logs - ${selectedEmployeeDetail.name}`}
            maxWidth="3xl"
          >
            <div className="space-y-6">
              
              {/* Employee Summary Card */}
              <div className="bg-black/5 border border-black/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-zinc-900 text-lg">{selectedEmployeeDetail.name}</span>
                    <span className="text-xs font-mono bg-zinc-200 px-2 py-0.5 rounded font-bold text-zinc-700">{selectedEmployeeDetail.employeeCode}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{selectedEmployeeDetail.designation} • {selectedEmployeeDetail.department?.name || 'General'}</p>
                </div>

                <div className="flex items-center space-x-6 text-right">
                  <div>
                    <div className="text-xs text-zinc-400">Total Worked</div>
                    <div className="font-mono font-extrabold text-zinc-900 text-base">{selectedEmployeeDetail.totalHours} hrs</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Projects</div>
                    <div className="font-mono font-extrabold text-emerald-600 text-base">{selectedEmployeeDetail.projectCount}</div>
                  </div>
                </div>
              </div>

              {/* Projects Breakdown List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Project Contributions Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedEmployeeDetail.projects.map((proj, idx) => (
                    <div key={idx} className="bg-white border border-black/10 rounded-xl p-3.5 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {proj.projectNumber}
                        </span>
                        <span className="font-mono font-extrabold text-xs text-zinc-900">{proj.hours} hrs</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-900">{proj.partName}</div>
                      <div className="text-[11px] text-zinc-500">Customer: {proj.customerName}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between border-t border-black/5 pt-1.5">
                        <span>{proj.taskCount} work activity entries</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Activity Logs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Detailed Work Logs ({selectedEmployeeDetail.workLogs.length})</h4>
                <div className="bg-white border border-black/10 rounded-xl max-h-60 overflow-y-auto divide-y divide-black/5 text-xs">
                  {selectedEmployeeDetail.workLogs.length === 0 ? (
                    <div className="p-4 text-center text-zinc-400 italic">No individual log entries found for this month.</div>
                  ) : selectedEmployeeDetail.workLogs.map((log, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between gap-3 hover:bg-black/[0.01]">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-900">{log.activityType}</span>
                          <span className="text-[10px] font-mono text-zinc-500 bg-black/5 px-1.5 py-0.5 rounded">{log.projectNumber}</span>
                          <span className="text-[10px] text-zinc-400">{new Date(log.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-600 text-[11px]">{log.description}</p>
                      </div>
                      <div className="font-mono font-bold text-zinc-900 text-xs shrink-0">
                        {log.hours} hrs
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-black/10 flex justify-end">
                <button
                  onClick={() => setSelectedEmployeeDetail(null)}
                  className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Close Work Logs
                </button>
              </div>

            </div>
          </Modal>
        )}

        </div>
      </main>
    </div>
  );
}

// Inline Helper Components
function SummaryCard({ title, value, subtext, icon, accentColor }: { 
  title: string; 
  value: string; 
  subtext: string; 
  icon: React.ReactNode;
  accentColor: string;
}) {
  return (
    <div className="bg-white/60 border border-black/10 rounded-2xl p-5 backdrop-blur-xl shadow-elevation relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-zinc-500">{title}</span>
        <div className="p-2 rounded-xl bg-black/5 border border-black/5">
          {icon}
        </div>
      </div>
      <div className="text-xl font-extrabold text-zinc-900 tracking-tight font-mono mb-1">
        {value}
      </div>
      <div className="text-[11px] text-zinc-400">
        {subtext}
      </div>
    </div>
  );
}

function Calculator(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2"/>
      <line x1="8" x2="16" y1="6" y2="6"/>
      <line x1="16" x2="16" y1="14" y2="18"/>
      <path d="M16 10h.01"/>
      <path d="M12 10h.01"/>
      <path d="M8 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M8 14h.01"/>
      <path d="M12 18h.01"/>
      <path d="M8 18h.01"/>
    </svg>
  );
}
