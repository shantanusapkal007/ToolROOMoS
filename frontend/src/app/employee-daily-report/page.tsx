"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Cpu,
  Wrench,
  Clock,
  Briefcase,
  Search,
  Filter,
  Plus,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Activity,
} from 'lucide-react';

import { Sidebar } from '../../components/layout/Sidebar';
import { PageHeader } from '../../components/layout/PageHeader';
import {
  useGlobalDailyReports,
  useDailyReportStats,
  useActiveRunningProjects,
} from '../../hooks/useDailyReports';
import { useMasterData } from '../../hooks/useMasterData';
import { useMasterLookups } from '../../hooks/useMasterLookups';

import { UnifiedSheetEntry } from '../../components/reports/UnifiedSheetEntry';
import { formatDate } from '../../lib/formatters';
import { InterSectionTransferModal } from '../../components/production/InterSectionTransferModal';

export default function EmployeeDailyReportPage() {
  const { options: sectionOptions } = useMasterLookups('PRODUCTION_SECTION');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SHEET' | 'DESIGNER' | 'MSDR' | 'MATRIX'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');



  // Queries
  const { data: reports = [], isLoading: reportsLoading, refetch } = useGlobalDailyReports({
    date: selectedDate,
    projectId: selectedProjectId,
    section: selectedSection,
    search: searchTerm,
    type: activeTab === 'DESIGNER' ? 'DESIGNER' : activeTab === 'MSDR' ? 'MSDR' : 'ALL',
  });

  const { data: stats } = useDailyReportStats(selectedDate);
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: machines = [] } = useMasterData('machines');

  // Filtered reports for specific tabs
  const designerReports = reports.filter((r) => r.type === 'DESIGNER');
  const msdrReports = reports.filter((r) => r.type === 'MSDR');

  // Export CSV functionality
  const exportToCSV = () => {
    if (reports.length === 0) return;
    const headers = [
      'Type',
      'Date',
      'Project Code',
      'Project Name',
      'Tool Name',
      'Section',
      'Employee / Designer',
      'Tool / Machine',
      'Operation / Stage',
      'Part / Drawing',
      'Start Time',
      'End Time',
      'Setup Hrs',
      'Cutting / Spent Hrs',
      'Total Hrs',
      'Qty',
      'Description',
      'Status',
    ];

    const rows = reports.map((r) => [
      r.type,
      new Date(r.logDate).toLocaleDateString(),
      `"${r.projectCode}"`,
      `"${r.projectName}"`,
      `"${r.projectToolName}"`,
      `"${r.section}"`,
      `"${r.personName}"`,
      `"${r.machineOrTool}"`,
      `"${r.workStageOrOperation}"`,
      `"${r.partOrDrawing}"`,
      r.startTime,
      r.endTime,
      r.setupTime,
      r.cuttingTime,
      r.hoursSpent,
      r.producedQty,
      `"${r.description?.replace(/"/g, '""') || ''}"`,
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Employee_Daily_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA] dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-[5rem] sm:pl-24 pr-4 sm:pr-8 py-6 space-y-6">
        
        {/* Page Header */}
        <PageHeader
          title="Employee Daily Report"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Employee Daily Report' },
          ]}
          actions={
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-900 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                Inter-Section Transfer
              </button>

              <button
                onClick={exportToCSV}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-xs backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-slate-500" /> Export CSV
              </button>

              <button
                onClick={() => setActiveTab('SHEET')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Open Daily Report Sheet
              </button>
            </div>
          }
        />



        {/* Filters Toolbar & Tab Navigation Bar */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/80 shadow-xs space-y-4">
          
          {/* Top Bar: Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Tab Pill Buttons */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                All Daily Reports ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('SHEET')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === 'SHEET'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Daily Report Sheet
              </button>
              <button
                onClick={() => setActiveTab('MATRIX')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'MATRIX'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Project-Tool Matrix
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs, tools, drawing #, operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
            {/* Running Project Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Filter by Running Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Active Running Projects</option>
                {runningProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode}] {p.name} {p.toolName ? `(${p.toolName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Filter by Section / Department
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Sections (Engineering & Shopfloor)</option>
                <option value="ENGINEERING">CAD/CAM Engineering & Design</option>
                {sectionOptions.map(sec => (
                  <option key={sec.id} value={sec.code}>{sec.label}</option>
                ))}
              </select>

            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Reset Filters button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedProjectId('ALL');
                  setSelectedSection('ALL');
                  setSearchTerm('');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-full h-9 px-3 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content Area: Sheet Format, Matrix, or Unified Table View */}
        {activeTab === 'SHEET' ? (
          <UnifiedSheetEntry onComplete={() => refetch()} />
        ) : activeTab === 'MATRIX' ? (
          /* Project-Tool Matrix View */
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" /> Currently Running Projects & Tool Allocation Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Overview of active projects, assigned tooling, machines in operation, and logged hours today.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/20">
                {runningProjects.length} Active Toolroom Projects
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {runningProjects.map((project) => {
                const projectLogs = reports.filter((r) => r.projectId === project.id);
                const designHrs = projectLogs
                  .filter((r) => r.type === 'DESIGNER')
                  .reduce((sum, r) => sum + r.hoursSpent, 0);
                const msdrHrs = projectLogs
                  .filter((r) => r.type === 'MSDR')
                  .reduce((sum, r) => sum + r.hoursSpent, 0);

                return (
                  <div
                    key={project.id}
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {project.projectCode}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {project.name}
                        </h4>
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="View Project Workspace"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <p>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Tool Name:</span>{' '}
                        {project.toolName || 'Custom Die / Mold Tooling'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Stage:</span>{' '}
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-600 font-medium">
                          {project.currentStage}
                        </span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Designer Hrs</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{designHrs.toFixed(1)} hrs</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">MSDR Hrs</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{msdrHrs.toFixed(1)} hrs</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Logs Today</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{projectLogs.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Main Unified / Tabbed Table View */
          <div className="rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Log Type</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Section / Dept</th>
                    <th className="py-3.5 px-4">Employee / Designer</th>
                    <th className="py-3.5 px-4">Tool / Machine</th>
                    <th className="py-3.5 px-4">Operation / Stage</th>
                    <th className="py-3.5 px-4">Part / Drawing</th>
                    <th className="py-3.5 px-4 text-center">Start – End</th>
                    <th className="py-3.5 px-4 text-right">Setup (h)</th>
                    <th className="py-3.5 px-4 text-right">Cutting / Spent (h)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>Loading employee daily logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            No daily report logs found for selected date & filters.
                          </span>
                          <span className="text-xs text-slate-400">
                            Click "Open Daily Report Sheet" to enter daily logs.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    reports.map((item) => {
                      const isDesigner = item.type === 'DESIGNER';
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Log Type */}
                          <td className="py-3.5 px-4 font-semibold">
                            {isDesigner ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <Cpu className="w-3 h-3" /> Designer
                              </span>
                            ) : item.section === 'TOOL_ROOM_FITTING' || item.section === 'ASSEMBLY_SHOP' || item.section === 'ASSEMBLY' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <Layers className="w-3 h-3" /> Assembly
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Wrench className="w-3 h-3" /> MSDR
                              </span>
                            )}
                          </td>

                          {/* Project */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {item.projectCode}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {item.projectName}
                            </div>
                          </td>

                          {/* Section */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {item.section}
                            </span>
                          </td>

                          {/* Person Name */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {item.personName}
                          </td>

                          {/* Tool / Machine */}
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            <div className="font-medium">{item.machineOrTool}</div>
                          </td>

                          {/* Work Stage / Operation */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {item.workStageOrOperation}
                            </div>
                            {item.description && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                                {item.description}
                              </div>
                            )}
                          </td>

                          {/* Part / Drawing */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                            {item.partOrDrawing}
                          </td>

                          {/* Start - End Time */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-700 dark:text-slate-300">
                            {item.startTime} – {item.endTime}
                          </td>

                          {/* Setup Hrs */}
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-amber-600 dark:text-amber-400">
                            {item.setupTime > 0 ? `${item.setupTime}h` : '–'}
                          </td>

                          {/* Cutting / Spent Hrs */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {item.hoursSpent} hrs
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* End of content */}
        <InterSectionTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
        />
      </main>
    </div>
  );
}
