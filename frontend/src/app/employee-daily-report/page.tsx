"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Cpu,
  Wrench,
  Search,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  Download,
  Activity,
} from 'lucide-react';

import { AppLayout } from '../../components/layout/AppLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import {
  useGlobalDailyReports,
  useDailyReportStats,
  useActiveRunningProjects,
} from '../../hooks/useDailyReports';
import { useMasterLookups } from '../../hooks/useMasterLookups';
import { UnifiedSheetEntry } from '../../components/reports/UnifiedSheetEntry';
import { InterSectionTransferModal } from '../../components/production/InterSectionTransferModal';

export default function EmployeeDailyReportPage() {
  const { options: sectionOptions } = useMasterLookups('PRODUCTION_SECTION');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SHEET' | 'DESIGNER' | 'MSDR' | 'MATRIX'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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

  // Export to CSV helper
  const exportToCSV = () => {
    if (!reports.length) return;
    const headers = [
      'Log Type',
      'Project Code',
      'Project Name',
      'Section',
      'Person Name',
      'Tool/Machine',
      'Operation/Stage',
      'Part/Drawing',
      'Start Time',
      'End Time',
      'Hours Spent',
      'Status',
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...reports.map((r: any) =>
          [
            r.logType || (r.designerName ? 'DESIGNER' : 'SHOPFLOOR'),
            `"${r.project?.projectNumber || ''}"`,
            `"${r.project?.title || ''}"`,
            `"${r.productionSection || r.workStage || ''}"`,
            `"${r.designerName || r.employee?.name || ''}"`,
            `"${r.machine?.machineName || ''}"`,
            `"${r.workStage || r.description || ''}"`,
            `"${r.partName || r.toolNo || ''}"`,
            `"${r.startTime || ''}"`,
            `"${r.endTime || ''}"`,
            r.hoursSpent || r.cuttingTime || 0,
            `"${r.status || 'COMPLETED'}"`,
          ].join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Reports_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="w-full flex flex-col space-y-6">
        
        {/* Page Header */}
        <PageHeader
          title="Employee Daily Report"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Employee Daily Report' },
          ]}
          actions={
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
              >
                Inter-Section Transfer
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4 mr-1.5" /> Export CSV
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('SHEET')}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Open Daily Report Sheet
              </Button>
            </div>
          }
        />

        {/* Filters Toolbar & Tab Navigation Bar */}
        <div className="p-4 rounded-md bg-canvas border border-hairline shadow-level-1 space-y-4">
          
          {/* Top Bar: Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Tab Buttons */}
            <div className="flex items-center p-1 rounded-sm bg-canvas border border-hairline w-full sm:w-auto overflow-x-auto gap-1">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-sm text-caption font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-primary text-on-primary'
                    : 'text-body-mid hover:text-ink'
                }`}
              >
                All Daily Reports ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('SHEET')}
                className={`px-3 py-1.5 rounded-sm text-caption font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'SHEET'
                    ? 'bg-primary text-on-primary'
                    : 'text-body-mid hover:text-ink'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Daily Report Sheet
              </button>
              <button
                onClick={() => setActiveTab('MATRIX')}
                className={`px-3 py-1.5 rounded-sm text-caption font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'MATRIX'
                    ? 'bg-primary text-on-primary'
                    : 'text-body-mid hover:text-ink'
                }`}
              >
                Project-Tool Matrix
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
              <input
                type="text"
                placeholder="Search logs, tools, drawing #, operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-sm bg-canvas border border-hairline text-body-sm text-ink placeholder:text-mute focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-hairline">
            {/* Running Project Filter */}
            <div>
              <label className="block text-caption font-medium text-mute mb-1">
                Filter by Running Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-9 px-3 rounded-sm bg-canvas border border-hairline text-body-sm text-ink focus:outline-none focus:border-primary"
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
              <label className="block text-caption font-medium text-mute mb-1">
                Filter by Section / Department
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full h-9 px-3 rounded-sm bg-canvas border border-hairline text-body-sm text-ink focus:outline-none focus:border-primary"
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
              <label className="block text-caption font-medium text-mute mb-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-9 px-3 rounded-sm bg-canvas border border-hairline text-body-sm text-ink focus:outline-none focus:border-primary"
              />
            </div>

            {/* Reset Filters button */}
            <div className="flex items-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedProjectId('ALL');
                  setSelectedSection('ALL');
                  setSearchTerm('');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area: Sheet Format, Matrix, or Unified Table View */}
        {activeTab === 'SHEET' ? (
          <UnifiedSheetEntry onComplete={() => refetch()} />
        ) : activeTab === 'MATRIX' ? (
          /* Project-Tool Matrix View */
          <div className="rounded-md bg-canvas border border-hairline shadow-level-1 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-display-xs font-semibold text-ink flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent-purple" /> Currently Running Projects & Tool Allocation Matrix
                </h3>
                <p className="text-body-sm text-mute mt-0.5">
                  Overview of active projects, assigned tooling, machines in operation, and logged hours today.
                </p>
              </div>
              <span className="text-caption px-2.5 py-1 rounded-sm bg-canvas text-accent-purple font-medium border border-hairline">
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
                    className="p-5 rounded-md bg-canvas border border-hairline shadow-level-1 hover:border-mute transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-caption font-medium font-mono px-2 py-0.5 rounded-sm bg-canvas border border-hairline text-ink">
                          {project.projectCode}
                        </span>
                        <h4 className="text-body-sm-strong text-ink mt-1.5">
                          {project.name}
                        </h4>
                      </div>
                      <Link
                        href={`/projects/${project.id}`}
                        className="p-1.5 text-mute hover:text-ink transition-colors"
                        title="View Project Workspace"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="text-body-sm text-mute space-y-1">
                      <p>
                        <span className="font-medium text-ink">Tool Name:</span>{' '}
                        {project.toolName || 'Custom Die / Mold Tooling'}
                      </p>
                      <p>
                        <span className="font-medium text-ink">Stage:</span>{' '}
                        <span className="px-2 py-0.5 text-caption rounded-sm bg-canvas border border-hairline text-accent-blue-info font-medium">
                          {project.currentStage}
                        </span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-hairline flex items-center justify-between text-body-sm">
                      <div>
                        <span className="text-mute block text-caption">Designer Hrs</span>
                        <span className="font-semibold text-accent-blue-info font-mono">{designHrs.toFixed(1)} hrs</span>
                      </div>
                      <div>
                        <span className="text-mute block text-caption">MSDR Hrs</span>
                        <span className="font-semibold text-accent-green font-mono">{msdrHrs.toFixed(1)} hrs</span>
                      </div>
                      <div>
                        <span className="text-mute block text-caption">Logs Today</span>
                        <span className="font-semibold text-accent-purple font-mono">{projectLogs.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Main Unified / Tabbed Table View */
          <div className="rounded-md bg-canvas border border-hairline shadow-level-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="bg-canvas border-b border-hairline text-eyebrow-uppercase-sm text-mute font-medium uppercase tracking-wider">
                    <th className="py-3.5 px-4">Log Type</th>
                    <th className="py-3.5 px-4">Project</th>
                    <th className="py-3.5 px-4">Section / Dept</th>
                    <th className="py-3.5 px-4">Employee / Designer</th>
                    <th className="py-3.5 px-4">Tool / Machine</th>
                    <th className="py-3.5 px-4">Operation / Stage</th>
                    <th className="py-3.5 px-4">Part / Drawing</th>
                    <th className="py-3.5 px-4 text-center">Start – End</th>
                    <th className="py-3.5 px-4 text-right">Hours Spent</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/60">
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-mute">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="w-6 h-6 animate-spin text-ink" />
                          <span>Loading employee daily logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-mute">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ClipboardList className="w-8 h-8 text-mute-soft" />
                          <span className="font-medium text-ink">
                            No daily report logs found for selected date & filters.
                          </span>
                          <span className="text-caption text-mute">
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
                          className="hover:bg-hairline/15 transition-colors"
                        >
                          {/* Log Type */}
                          <td className="py-3.5 px-4">
                            {isDesigner ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-caption font-medium bg-canvas text-accent-blue-info border border-hairline">
                                <Cpu className="w-3 h-3" /> Designer
                              </span>
                            ) : item.section === 'TOOL_ROOM_FITTING' || item.section === 'ASSEMBLY_SHOP' || item.section === 'ASSEMBLY' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-caption font-medium bg-canvas text-accent-purple border border-hairline">
                                <Layers className="w-3 h-3" /> Assembly
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-caption font-medium bg-canvas text-accent-green border border-hairline">
                                <Wrench className="w-3 h-3" /> MSDR
                              </span>
                            )}
                          </td>

                          {/* Project */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-medium text-ink">
                              {item.projectCode}
                            </div>
                            <div className="text-caption text-mute truncate max-w-[140px]">
                              {item.projectName}
                            </div>
                          </td>

                          {/* Section */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-sm text-caption font-medium bg-canvas text-ink border border-hairline">
                              {item.section}
                            </span>
                          </td>

                          {/* Person Name */}
                          <td className="py-3.5 px-4 font-medium text-ink">
                            {item.personName}
                          </td>

                          {/* Tool / Machine */}
                          <td className="py-3.5 px-4 text-mute">
                            <div className="font-medium text-ink">{item.machineOrTool}</div>
                          </td>

                          {/* Work Stage / Operation */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-ink">
                              {item.workStageOrOperation}
                            </div>
                            {item.description && (
                              <div className="text-caption text-mute truncate max-w-[180px]">
                                {item.description}
                              </div>
                            )}
                          </td>

                          {/* Part / Drawing */}
                          <td className="py-3.5 px-4 text-mute font-mono text-caption">
                            {item.partOrDrawing}
                          </td>

                          {/* Start - End Time */}
                          <td className="py-3.5 px-4 text-center font-mono text-mute text-caption">
                            {item.startTime} – {item.endTime}
                          </td>

                          {/* Hours Spent */}
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-ink">
                            {item.hoursSpent} hrs
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-sm text-caption font-medium bg-canvas text-accent-green border border-hairline">
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
      </div>
    </AppLayout>
  );
}
