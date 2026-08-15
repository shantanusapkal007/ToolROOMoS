"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Cpu,
  Wrench,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  Download,
  Activity,
} from 'lucide-react';

import { AppLayout } from '../../components/layout/AppLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  useGlobalDailyReports,
  useDailyReportStats,
  useActiveRunningProjects,
} from '../../hooks/useDailyReports';
import { useMasterLookups } from '../../hooks/useMasterLookups';
import { UnifiedSheetEntry } from '../../components/reports/UnifiedSheetEntry';
import { ProjectToolMatrix } from '../../components/reports/ProjectToolMatrix';
import { InterSectionTransferModal } from '../../components/production/InterSectionTransferModal';

export default function EmployeeDailyReportPage() {
  const { options: sectionOptions } = useMasterLookups('PRODUCTION_SECTION');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SHEET' | 'MATRIX'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Queries
  const { data: reports = [], isLoading: reportsLoading, refetch } = useGlobalDailyReports({
    date: selectedDate,
    projectId: selectedProjectId,
    section: selectedSection,
    search: searchTerm,
    type: 'ALL',
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
                leftIcon={<Download className="w-4 h-4" />}
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
            </div>
          }
        />

        {/* Filters Toolbar & Tab Navigation Bar */}
        <div className="p-4 rounded-[12px] bg-white border border-border-gray shadow-subtle space-y-4">
          {/* Top Bar: Tabs & Unified Local Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Unified Reusable Tab Group */}
            <Tabs
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab)}
              tabs={[
                { id: 'ALL', label: 'All Daily Reports', count: reports.length },
                {
                  id: 'SHEET',
                  label: 'Daily Report Sheet',
                  icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
                },
                { id: 'MATRIX', label: 'Project-Tool Matrix' },
              ]}
            />

            {/* Unified Search Input (Local context) */}
            <SearchInput
              context="local"
              placeholder="Search logs, tools, drawing #, operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              containerClassName="w-full sm:w-80"
            />
          </div>

          {/* Filter Controls Row — strict 8pt grid with 36px aligned form controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-border-gray items-end">
            {/* Running Project Filter */}
            <Select
              label="Filter by Running Project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              size="sm"
            >
              <option value="ALL">All Active Running Projects</option>
              {runningProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.projectCode}] {p.name} {p.toolName ? `(${p.toolName})` : ''}
                </option>
              ))}
            </Select>

            {/* Section Filter */}
            <Select
              label="Filter by Section / Department"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              size="sm"
            >
              <option value="ALL">All Sections (Engineering & Shopfloor)</option>
              <option value="ENGINEERING">CAD/CAM Engineering & Design</option>
              {sectionOptions.map((sec) => (
                <option key={sec.id} value={sec.code}>
                  {sec.label}
                </option>
              ))}
            </Select>

            {/* Date Filter */}
            <div className="w-full flex flex-col">
              <label className="block text-caption font-medium text-ink mb-1.5">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-border-gray hover:border-cool-gray/50 focus:border-primary rounded-[10px] text-body-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-150 shadow-subtle"
              />
            </div>

            {/* Reset Filters button */}
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedProjectId('ALL');
                  setSelectedSection('ALL');
                  setSearchTerm('');
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-full h-9"
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
          <ProjectToolMatrix onOpenTransferModal={() => setIsTransferModalOpen(true)} />
        ) : (
          /* Main Unified / Tabbed Table View */
          <div className="rounded-[12px] bg-white border border-border-gray shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-border-gray text-eyebrow-uppercase-sm text-silver-blue font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Log Type</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Section / Dept</th>
                    <th className="py-3 px-4">Employee / Designer</th>
                    <th className="py-3 px-4">Tool / Machine</th>
                    <th className="py-3 px-4">Operation / Stage</th>
                    <th className="py-3 px-4">Part / Drawing</th>
                    <th className="py-3 px-4 text-center">Start – End</th>
                    <th className="py-3 px-4 text-right">Hours Spent</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray/60">
                  {reportsLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-silver-blue">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="w-6 h-6 animate-spin text-primary" />
                          <span>Loading employee daily logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-silver-blue">
                        <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                          <div className="h-12 w-12 rounded-full bg-neutral-100/80 flex items-center justify-center text-silver-blue mb-1">
                            <ClipboardList className="w-6 h-6" />
                          </div>
                          <span className="text-display-xs font-semibold text-ink">
                            No daily report logs found
                          </span>
                          <span className="text-caption text-silver-blue">
                            Use the Daily Report Sheet tab above to enter logs.
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
                          className="hover:bg-neutral-50/60 transition-colors"
                        >
                          {/* Log Type */}
                          <td className="py-3 px-4">
                            {isDesigner ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-caption font-medium bg-primary-subtle text-primary border border-primary/20">
                                <Cpu className="w-3 h-3" /> Designer
                              </span>
                            ) : item.section === 'TOOL_ROOM_FITTING' || item.section === 'ASSEMBLY_SHOP' || item.section === 'ASSEMBLY' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-caption font-medium bg-primary-subtle text-primary border border-primary/20">
                                <Layers className="w-3 h-3" /> Assembly
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-caption font-medium bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20">
                                <Wrench className="w-3 h-3" /> MSDR
                              </span>
                            )}
                          </td>

                          {/* Project */}
                          <td className="py-3 px-4">
                            <div className="font-mono font-medium text-ink">
                              {item.projectCode}
                            </div>
                            <div className="text-caption text-silver-blue truncate max-w-[140px]">
                              {item.projectName}
                            </div>
                          </td>

                          {/* Section */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-[6px] text-caption font-medium bg-neutral-100/60 text-ink border border-border-gray">
                              {item.section}
                            </span>
                          </td>

                          {/* Person Name */}
                          <td className="py-3 px-4 font-medium text-ink">
                            {item.personName}
                          </td>

                          {/* Tool / Machine */}
                          <td className="py-3 px-4 text-silver-blue">
                            <div className="font-medium text-ink">{item.machineOrTool}</div>
                          </td>

                          {/* Work Stage / Operation */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-ink">
                              {item.workStageOrOperation}
                            </div>
                            {item.description && (
                              <div className="text-caption text-silver-blue truncate max-w-[180px]">
                                {item.description}
                              </div>
                            )}
                          </td>

                          {/* Part / Drawing */}
                          <td className="py-3 px-4 text-silver-blue font-mono text-caption">
                            {item.partOrDrawing}
                          </td>

                          {/* Start - End Time */}
                          <td className="py-3 px-4 text-center font-mono text-silver-blue text-caption">
                            {item.startTime} – {item.endTime}
                          </td>

                          {/* Hours Spent */}
                          <td className="py-3 px-4 text-right font-mono font-semibold text-ink">
                            {item.hoursSpent} hrs
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={item.status || 'COMPLETED'} size="sm" />
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
