"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Cpu,
  Wrench,
  Search,
  Plus,
  ArrowUpRight,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Activity,
  Boxes,
  Eye,
  Grid,
  LayoutGrid,
  Sliders,
  ChevronRight,
  X,
  FileSpreadsheet,
  Building2,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { useToast } from '../ui/Toast';
import {
  useGlobalDailyReports,
  useActiveRunningProjects,
  useCreateGlobalDesignerLog,
  useCreateGlobalMsdrLog,
} from '@/hooks/useDailyReports';
import {
  GlobalDailyReportItem,
  ActiveRunningProject,
} from '@/services/daily-reports.service';
import { useProjects } from '@/hooks/useProjects';
import { useMasterLookups } from '@/hooks/useMasterLookups';

export interface WorkcenterStageColumn {
  id: string;
  key: string;
  name: string;
  shortName: string;
  category: 'DESIGN' | 'MACHINING' | 'ASSEMBLY' | 'QUALITY' | 'PROCUREMENT';
  icon: React.ReactNode;
}

const TOOLROOM_WORKCENTERS: WorkcenterStageColumn[] = [
  {
    id: 'design',
    key: 'ENGINEERING',
    name: 'CAD/CAM Design',
    shortName: 'Design',
    category: 'DESIGN',
    icon: <Cpu className="w-3.5 h-3.5" />,
  },
  {
    id: 'procurement',
    key: 'PROCUREMENT',
    name: 'Raw Stock / Sizing',
    shortName: 'Stock/RM',
    category: 'PROCUREMENT',
    icon: <Boxes className="w-3.5 h-3.5" />,
  },
  {
    id: 'vmc_milling',
    key: 'MACHINE_SHOP',
    name: 'CNC / VMC Milling',
    shortName: 'VMC / CNC',
    category: 'MACHINING',
    icon: <Wrench className="w-3.5 h-3.5" />,
  },
  {
    id: 'wire_cut_edm',
    key: 'WIRE_CUT',
    name: 'EDM / Wire-Cut',
    shortName: 'Wire/EDM',
    category: 'MACHINING',
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  {
    id: 'lathe_grinding',
    key: 'LATHE_GRINDING',
    name: 'Lathe & Grinding',
    shortName: 'Lathe/Grind',
    category: 'MACHINING',
    icon: <Sliders className="w-3.5 h-3.5" />,
  },
  {
    id: 'fitting_assembly',
    key: 'TOOL_ROOM_FITTING',
    name: 'Toolroom Fitting',
    shortName: 'Assembly',
    category: 'ASSEMBLY',
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    id: 'quality_trial',
    key: 'QUALITY',
    name: 'CMM & Tool Trial',
    shortName: 'QC / Trial',
    category: 'QUALITY',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
];

interface CellDrilldownData {
  project: ActiveRunningProject | any;
  workcenter: WorkcenterStageColumn;
  logs: GlobalDailyReportItem[];
  totalHours: number;
}

interface QuickLogModalData {
  project: ActiveRunningProject | any;
  logType: 'DESIGNER' | 'MSDR';
  section: string;
}

interface ProjectToolMatrixProps {
  onOpenTransferModal?: (project?: any) => void;
}

export function ProjectToolMatrix({ onOpenTransferModal }: ProjectToolMatrixProps) {
  const { success, error } = useToast();
  const [viewMode, setViewMode] = useState<'GRID' | 'CARDS' | 'WORKCENTERS'>('GRID');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'TODAY' | '7_DAYS' | '30_DAYS' | 'ALL'>('ALL');
  const [selectedCellDrilldown, setSelectedCellDrilldown] = useState<CellDrilldownData | null>(null);
  const [quickLogTarget, setQuickLogTarget] = useState<QuickLogModalData | null>(null);

  // Form states for quick log modal
  const [quickDesignerName, setQuickDesignerName] = useState('');
  const [quickWorkStage, setQuickWorkStage] = useState('3D Solid Modeling');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickHours, setQuickHours] = useState('4.0');
  const [quickMachineName, setQuickMachineName] = useState('VMC-01');

  // Mutations
  const createDesignerLogMutation = useCreateGlobalDesignerLog();
  const createMsdrLogMutation = useCreateGlobalMsdrLog();

  // Queries
  const { data: runningProjects = [] } = useActiveRunningProjects();
  const { data: allProjects = [] } = useProjects();
  const { data: globalLogs = [], refetch: refetchLogs } = useGlobalDailyReports({
    type: 'ALL',
  });
  const { options: employeeOptions } = useMasterLookups('EMPLOYEE');

  // Filter logs by selected time range
  const filteredLogs = useMemo(() => {
    if (timeRange === 'ALL') return globalLogs;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return globalLogs.filter((log) => {
      const logDateStr = log.logDate ? log.logDate.split('T')[0] : '';
      if (!logDateStr) return true;

      if (timeRange === 'TODAY') {
        return logDateStr === todayStr;
      }
      if (timeRange === '7_DAYS') {
        const logDate = new Date(logDateStr);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeRange === '30_DAYS') {
        const logDate = new Date(logDateStr);
        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [globalLogs, timeRange]);

  // Combine and deduplicate projects list with rich details
  const projectsList = useMemo(() => {
    const combinedMap = new Map<string, any>();

    // Start with runningProjects
    runningProjects.forEach((p) => {
      combinedMap.set(p.id, {
        id: p.id,
        projectCode: p.projectCode,
        name: p.name,
        toolName: p.toolName || p.name,
        category: p.category || 'TOOLING',
        currentStage: p.currentStage || 'PRODUCTION',
      });
    });

    // Merge with allProjects
    allProjects.forEach((p: any) => {
      const existing = combinedMap.get(p.id);
      const customerName =
        (typeof p.customer === 'object' && p.customer !== null
          ? p.customer.companyName || p.customer.name
          : p.customer) ||
        p.customerName ||
        p.clientName ||
        'Standard Client';

      combinedMap.set(p.id, {
        id: p.id,
        projectCode: p.projectNumber || existing?.projectCode || 'TOOL',
        name: p.partName || p.description || p.name || existing?.name || 'Tool Project',
        toolName: p.partName || p.name || existing?.toolName || 'Tool Die',
        category: p.category || existing?.category || 'TOOLING',
        currentStage: p.currentStage || existing?.currentStage || 'PRODUCTION',
        customer: String(customerName),
        targetDate: p.targetDate || p.deliveryDate || null,
        totalEstimatedCost: p.estimatedCost || 0,
      });
    });

    let list = Array.from(combinedMap.values());

    // Apply Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.projectCode?.toLowerCase().includes(term) ||
          p.name?.toLowerCase().includes(term) ||
          p.toolName?.toLowerCase().includes(term) ||
          (typeof p.customer === 'string' && p.customer.toLowerCase().includes(term)) ||
          p.currentStage?.toLowerCase().includes(term)
      );
    }

    // Apply Stage Filter
    if (selectedStageFilter !== 'ALL') {
      list = list.filter((p) => p.currentStage === selectedStageFilter);
    }

    return list;
  }, [runningProjects, allProjects, searchTerm, selectedStageFilter]);

  // Map of project logs per workcenter
  const matrixData = useMemo(() => {
    const map = new Map<string, Record<string, GlobalDailyReportItem[]>>();

    projectsList.forEach((p) => {
      const workcenterLogs: Record<string, GlobalDailyReportItem[]> = {};
      TOOLROOM_WORKCENTERS.forEach((wc) => {
        workcenterLogs[wc.id] = [];
      });

      const pLogs = filteredLogs.filter(
        (l) =>
          l.projectId === p.id ||
          l.projectCode === p.projectCode ||
          (p.projectCode && l.projectCode && l.projectCode.toLowerCase() === p.projectCode.toLowerCase())
      );

      pLogs.forEach((log) => {
        const secUpper = (log.section || '').toUpperCase();
        const typeUpper = (log.type || '').toUpperCase();
        const opUpper = (log.workStageOrOperation || '').toUpperCase();
        const machUpper = (log.machineOrTool || '').toUpperCase();

        if (typeUpper === 'DESIGNER' || secUpper === 'ENGINEERING') {
          workcenterLogs['design'].push(log);
        } else if (
          secUpper.includes('WIRE') ||
          secUpper.includes('EDM') ||
          machUpper.includes('WIRE') ||
          machUpper.includes('EDM') ||
          opUpper.includes('WIRE') ||
          opUpper.includes('SPARK')
        ) {
          workcenterLogs['wire_cut_edm'].push(log);
        } else if (
          secUpper.includes('FITTING') ||
          secUpper.includes('ASSEMBLY') ||
          opUpper.includes('FITTING') ||
          opUpper.includes('ASSEMBLY') ||
          opUpper.includes('POLISH') ||
          opUpper.includes('BENCH')
        ) {
          workcenterLogs['fitting_assembly'].push(log);
        } else if (
          secUpper.includes('LATHE') ||
          secUpper.includes('GRIND') ||
          machUpper.includes('LATHE') ||
          machUpper.includes('GRIND') ||
          opUpper.includes('TURNING') ||
          opUpper.includes('GRINDING')
        ) {
          workcenterLogs['lathe_grinding'].push(log);
        } else if (
          secUpper.includes('QUALITY') ||
          secUpper.includes('INSPECTION') ||
          secUpper.includes('CMM') ||
          opUpper.includes('CMM') ||
          opUpper.includes('TRIAL') ||
          opUpper.includes('INSPECT')
        ) {
          workcenterLogs['quality_trial'].push(log);
        } else if (secUpper.includes('PROCUREMENT') || secUpper.includes('RAW') || opUpper.includes('CUTTING')) {
          workcenterLogs['procurement'].push(log);
        } else {
          // Default shopfloor machining (VMC / Milling / CNC)
          workcenterLogs['vmc_milling'].push(log);
        }
      });

      map.set(p.id, workcenterLogs);
    });

    return map;
  }, [projectsList, filteredLogs]);

  // Aggregate Toolroom Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalActiveTools = projectsList.length;
    let totalToolHours = 0;
    let designStageCount = 0;
    let machiningStageCount = 0;
    let assemblyStageCount = 0;
    let qualityStageCount = 0;

    projectsList.forEach((p) => {
      const stg = (p.currentStage || '').toUpperCase();
      if (stg.includes('DESIGN') || stg.includes('ENGINEERING')) designStageCount++;
      else if (stg.includes('PRODUCTION') || stg.includes('MACHINING') || stg.includes('FABRICATION')) machiningStageCount++;
      else if (stg.includes('ASSEMBLY') || stg.includes('FITTING')) assemblyStageCount++;
      else if (stg.includes('QUALITY') || stg.includes('TRIAL') || stg.includes('INSPECTION')) qualityStageCount++;
      else machiningStageCount++;
    });

    filteredLogs.forEach((l) => {
      totalToolHours += Number(l.hoursSpent) || 0;
    });

    return {
      totalActiveTools,
      totalToolHours: totalToolHours.toFixed(1),
      designStageCount,
      machiningStageCount,
      assemblyStageCount,
      qualityStageCount,
    };
  }, [projectsList, filteredLogs]);

  // Handle cell click drilldown
  const handleCellClick = (project: any, wc: WorkcenterStageColumn) => {
    const pLogs = matrixData.get(project.id)?.[wc.id] || [];
    const totalHours = pLogs.reduce((sum, l) => sum + (Number(l.hoursSpent) || 0), 0);
    setSelectedCellDrilldown({
      project,
      workcenter: wc,
      logs: pLogs,
      totalHours,
    });
  };

  // Handle quick log submit
  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogTarget) return;

    try {
      if (quickLogTarget.logType === 'DESIGNER') {
        await createDesignerLogMutation.mutateAsync({
          projectId: quickLogTarget.project.id,
          designerName: quickDesignerName || 'Toolroom Designer',
          workStage: quickWorkStage,
          partName: quickLogTarget.project.toolName || quickLogTarget.project.name,
          drawingNumber: `${quickLogTarget.project.projectCode}-DWG-01`,
          description: quickDescription || 'CAD/CAM 3D Engineering & Tool Path programming',
          hoursSpent: Number(quickHours) || 4,
          workDate: new Date().toISOString().split('T')[0],
          status: 'COMPLETED',
        });
      } else {
        await createMsdrLogMutation.mutateAsync({
          projectId: quickLogTarget.project.id,
          employeeId: employeeOptions[0]?.id || 'emp-01',
          productionSection: quickLogTarget.section || 'MACHINE_SHOP',
          reportDate: new Date().toISOString().split('T')[0],
          description: quickDescription || `Machining & tooling operation for ${quickLogTarget.project.toolName}`,
          toolNo: quickLogTarget.project.projectCode,
          cuttingTime: Number(quickHours) || 4,
          setupTime: 0.5,
          producedQty: 1,
        });
      }

      setQuickLogTarget(null);
      setQuickDescription('');
      refetchLogs();
    } catch (err: any) {
      error('Log Submission Failed', err.message || 'Error recording log.');
    }
  };

  // Export Matrix Data to CSV
  const handleExportMatrixCSV = () => {
    if (!projectsList.length) return;

    const headers = [
      'Tool No / Project Code',
      'Tool / Part Name',
      'Customer',
      'Current Stage',
      ...TOOLROOM_WORKCENTERS.map((wc) => `${wc.name} (Hrs)`),
      'Total Toolroom Hours',
    ];

    const rows = projectsList.map((p) => {
      const pWorkcenters = matrixData.get(p.id) || {};
      let pTotalHrs = 0;

      const wcHours = TOOLROOM_WORKCENTERS.map((wc) => {
        const logs = pWorkcenters[wc.id] || [];
        const hrs = logs.reduce((sum, l) => sum + (Number(l.hoursSpent) || 0), 0);
        pTotalHrs += hrs;
        return hrs > 0 ? hrs.toFixed(1) : '0.0';
      });

      return [
        `"${p.projectCode}"`,
        `"${p.name || p.toolName}"`,
        `"${p.customer || 'Standard Client'}"`,
        `"${p.currentStage}"`,
        ...wcHours,
        pTotalHrs.toFixed(1),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Project_Tool_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Matrix Exported', 'Project-Tool allocation matrix downloaded as CSV.');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* 1. High-Contrast Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Active Tools</span>
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-ink font-mono mt-2">{summaryMetrics.totalActiveTools}</p>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">In CAD/CAM</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-ink font-mono mt-2">{summaryMetrics.designStageCount}</p>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">In Machining</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-ink font-mono mt-2">{summaryMetrics.machiningStageCount}</p>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">In Fitting</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-ink font-mono mt-2">{summaryMetrics.assemblyStageCount}</p>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">In QC / Trial</span>
            <div className="w-6 h-6 rounded-md bg-semantic-success-subtle text-semantic-success-dark flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-ink font-mono mt-2">{summaryMetrics.qualityStageCount}</p>
        </div>

        <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle flex flex-col justify-between border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cool-gray uppercase tracking-wider">Logged Hours</span>
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-primary font-mono mt-2">{summaryMetrics.totalToolHours} <span className="text-xs text-cool-gray font-normal">hrs</span></p>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white border border-border-gray rounded-[12px] p-4 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-canvas border border-border-gray rounded-[10px] shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-white text-primary shadow-subtle border border-border-gray/80'
                  : 'text-cool-gray hover:text-ink'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matrix Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white text-primary shadow-subtle border border-border-gray/80'
                  : 'text-cool-gray hover:text-ink'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tool Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('WORKCENTERS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'WORKCENTERS'
                  ? 'bg-white text-primary shadow-subtle border border-border-gray/80'
                  : 'text-cool-gray hover:text-ink'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Workcenters</span>
            </button>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3 flex-wrap flex-1 justify-end">
            <SearchInput
              context="local"
              placeholder="Search Tool #, Project, Part, Operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              containerClassName="w-full sm:w-72"
            />

            <Select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              size="sm"
              className="w-40"
            >
              <option value="ALL">All Stages</option>
              <option value="ENGINEERING">Design / Engineering</option>
              <option value="PROCUREMENT">Procurement / RM</option>
              <option value="PRODUCTION">Machining & Wire-Cut</option>
              <option value="ASSEMBLY">Fitting & Assembly</option>
              <option value="QUALITY_CHECK">Quality / Trial</option>
              <option value="COMPLETED">Ready / Completed</option>
            </Select>

            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              size="sm"
              className="w-36"
            >
              <option value="ALL">All Logged Time</option>
              <option value="TODAY">Logs Today</option>
              <option value="7_DAYS">Past 7 Days</option>
              <option value="30_DAYS">Past 30 Days</option>
            </Select>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportMatrixCSV}
              title="Download Project-Tool Matrix CSV"
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Main Matrix View Modes */}
      {projectsList.length === 0 ? (
        <div className="bg-canvas border border-border-gray rounded-[12px] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-ink">No Toolroom Projects Found</h4>
          <p className="text-xs text-cool-gray max-w-md mx-auto">
            No active project tools match your current search or stage filter. Adjust your filter criteria or register a new tooling project.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedStageFilter('ALL');
              setTimeRange('ALL');
            }}
          >
            Clear Matrix Filters
          </Button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* ------------------------------------------------------------- */
        /* A. MATRIX GRID VIEW (Cross-Section Workcenter Table)          */
        /* ------------------------------------------------------------- */
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-canvas text-ink font-semibold tracking-tight border-b border-border-gray sticky top-0 z-10 text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 w-64 uppercase text-cool-gray">Tool / Project Info</th>
                  <th className="py-3 px-2 text-center w-24 uppercase text-cool-gray">Stage</th>
                  {TOOLROOM_WORKCENTERS.map((wc) => (
                    <th key={wc.id} className="py-3 px-2.5 text-center uppercase text-cool-gray whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {wc.icon}
                        <span>{wc.shortName}</span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right uppercase text-cool-gray whitespace-nowrap">Total Hrs</th>
                  <th className="py-3 px-3 text-center w-28 uppercase text-cool-gray">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray/70">
                {projectsList.map((project) => {
                  const pWorkcenters = matrixData.get(project.id) || {};
                  let projectTotalHours = 0;

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Tool & Project Info */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[11px]">
                            {project.projectCode}
                          </span>
                          <div className="truncate max-w-[180px]">
                            <p className="font-semibold text-ink text-xs truncate" title={project.toolName || project.name}>
                              {project.toolName || project.name}
                            </p>
                            <p className="text-[10.5px] text-cool-gray truncate">{project.customer || 'Standard Tool'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Current Stage */}
                      <td className="py-3 px-2 text-center">
                        <StatusBadge status={project.currentStage || 'PRODUCTION'} size="sm" />
                      </td>

                      {/* Matrix Workcenter Cells */}
                      {TOOLROOM_WORKCENTERS.map((wc) => {
                        const logs = pWorkcenters[wc.id] || [];
                        const hours = logs.reduce((sum, l) => sum + (Number(l.hoursSpent) || 0), 0);
                        projectTotalHours += hours;
                        const hasActivity = logs.length > 0;
                        const activeOperators = Array.from(new Set(logs.map((l) => l.personName))).filter(Boolean);

                        return (
                          <td key={wc.id} className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleCellClick(project, wc)}
                              className={`w-full py-1.5 px-2 rounded-[8px] border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                hasActivity
                                  ? 'bg-primary/5 hover:bg-primary/15 border-primary/25 text-ink hover:scale-[1.02] shadow-xs'
                                  : 'bg-transparent hover:bg-neutral-100/60 border-dashed border-border-gray/80 text-mute opacity-60 hover:opacity-100'
                              }`}
                              title={
                                hasActivity
                                  ? `${wc.name}: ${hours.toFixed(1)} hrs logged across ${logs.length} operations. Click for details.`
                                  : `No logged operations for ${wc.name}. Click to log or view.`
                              }
                            >
                              {hasActivity ? (
                                <>
                                  <span className="font-mono font-bold text-primary text-[11px]">
                                    {hours.toFixed(1)} <span className="text-[9px] font-normal text-cool-gray">h</span>
                                  </span>
                                  <span className="text-[9.5px] text-cool-gray truncate max-w-[64px]" title={activeOperators.join(', ')}>
                                    {activeOperators[0] || `${logs.length} logs`}
                                  </span>
                                </>
                              ) : (
                                <span className="text-[10px] font-mono text-mute">-</span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total Hours */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-ink">
                        {projectTotalHours > 0 ? (
                          <span className="text-primary">{projectTotalHours.toFixed(1)} hrs</span>
                        ) : (
                          <span className="text-mute font-normal">0.0 hrs</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickLogTarget({
                                project,
                                logType: 'MSDR',
                                section: 'MACHINE_SHOP',
                              })
                            }
                            className="p-1 rounded bg-primary-subtle text-primary hover:bg-primary hover:text-white transition-colors"
                            title="Quick Log Toolroom Work"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/projects/${project.id}`}
                            className="p-1 rounded bg-neutral-100 text-cool-gray hover:text-ink hover:bg-neutral-200 transition-colors"
                            title="Open Project Tool Workspace"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'CARDS' ? (
        /* ------------------------------------------------------------- */
        /* B. PROJECT TOOL CARDS VIEW                                    */
        /* ------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projectsList.map((project) => {
            const pWorkcenters = matrixData.get(project.id) || {};
            const pLogs = filteredLogs.filter((l) => l.projectId === project.id || l.projectCode === project.projectCode);
            const designHrs = pLogs.filter((l) => l.type === 'DESIGNER').reduce((s, l) => s + (Number(l.hoursSpent) || 0), 0);
            const machiningHrs = pLogs.filter((l) => l.type === 'MSDR').reduce((s, l) => s + (Number(l.hoursSpent) || 0), 0);
            const totalHrs = designHrs + machiningHrs;

            // Compute active machines & operators
            const activeMachines = Array.from(new Set(pLogs.map((l) => l.machineOrTool))).filter(Boolean).slice(0, 3);
            const activeOperators = Array.from(new Set(pLogs.map((l) => l.personName))).filter(Boolean).slice(0, 3);

            return (
              <div
                key={project.id}
                className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle hover:border-cool-gray transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-xs">
                        {project.projectCode}
                      </span>
                      <StatusBadge status={project.currentStage || 'PRODUCTION'} size="sm" />
                    </div>
                    <h4 className="text-sm font-bold text-ink mt-2 leading-tight">{project.toolName || project.name}</h4>
                    <p className="text-xs text-cool-gray mt-0.5">{project.customer || 'Standard Tool Customer'}</p>
                  </div>

                  <Link
                    href={`/projects/${project.id}`}
                    className="p-1.5 rounded-lg border border-border-gray bg-canvas text-cool-gray hover:text-primary hover:border-primary transition-colors"
                    title="Open Full Workspace"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Workcenter Status Pills Grid */}
                <div className="grid grid-cols-4 gap-1.5 py-2 bg-canvas/60 border border-border-gray/70 rounded-[10px] p-2">
                  {TOOLROOM_WORKCENTERS.slice(0, 4).map((wc) => {
                    const logs = pWorkcenters[wc.id] || [];
                    const hrs = logs.reduce((s, l) => s + (Number(l.hoursSpent) || 0), 0);
                    return (
                      <div key={wc.id} className="text-center">
                        <span className="text-[9.5px] text-cool-gray block uppercase font-medium">{wc.shortName}</span>
                        <span className={`text-[11px] font-mono font-bold ${hrs > 0 ? 'text-primary' : 'text-mute'}`}>
                          {hrs > 0 ? `${hrs.toFixed(1)}h` : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Resource Allocation Chips */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-cool-gray">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Wrench className="w-3 h-3 text-primary" /> Active Machines:
                    </span>
                    <span className="font-medium text-ink truncate max-w-[140px]">
                      {activeMachines.length > 0 ? activeMachines.join(', ') : 'None assigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-cool-gray">
                    <span className="flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-primary" /> Operators:
                    </span>
                    <span className="font-medium text-ink truncate max-w-[140px]">
                      {activeOperators.length > 0 ? activeOperators.join(', ') : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Hours & Actions Footer */}
                <div className="pt-3 border-t border-border-gray flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-cool-gray uppercase font-semibold block">Total Time</span>
                    <span className="text-base font-bold text-primary font-mono">{totalHrs.toFixed(1)} hrs</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() =>
                        setQuickLogTarget({
                          project,
                          logType: 'MSDR',
                          section: 'MACHINE_SHOP',
                        })
                      }
                    >
                      Log Work
                    </Button>

                    {onOpenTransferModal && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenTransferModal(project)}
                        title="Transfer Between Toolroom Sections"
                      >
                        Transfer
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* C. WORKCENTER / RESOURCE LOAD VIEW                            */
        /* ------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLROOM_WORKCENTERS.map((wc) => {
            // Find all logs in this workcenter
            const activeProjectsInWc = projectsList.filter((p) => {
              const logs = matrixData.get(p.id)?.[wc.id] || [];
              return logs.length > 0;
            });

            const wcTotalHours = activeProjectsInWc.reduce((sum, p) => {
              const logs = matrixData.get(p.id)?.[wc.id] || [];
              return sum + logs.reduce((s, l) => s + (Number(l.hoursSpent) || 0), 0);
            }, 0);

            return (
              <div
                key={wc.id}
                className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border-gray pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {wc.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">{wc.name}</h4>
                      <span className="text-[10px] text-cool-gray uppercase font-semibold">{wc.category} WORKCENTER</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-primary text-sm">{wcTotalHours.toFixed(1)} hrs</span>
                </div>

                {/* Projects in Workcenter */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeProjectsInWc.length === 0 ? (
                    <div className="p-4 bg-canvas border border-dashed border-border-gray rounded-[10px] text-center text-xs text-mute">
                      No active logs recorded in this workcenter.
                    </div>
                  ) : (
                    activeProjectsInWc.map((p) => {
                      const logs = matrixData.get(p.id)?.[wc.id] || [];
                      const hrs = logs.reduce((s, l) => s + (Number(l.hoursSpent) || 0), 0);

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleCellClick(p, wc)}
                          className="p-2.5 bg-canvas hover:bg-neutral-100/70 border border-border-gray rounded-[10px] flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="truncate max-w-[170px]">
                            <span className="font-mono font-semibold text-[11px] text-ink block">{p.projectCode}</span>
                            <span className="text-[10.5px] text-cool-gray truncate block">{p.toolName || p.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-primary text-xs">{hrs.toFixed(1)} h</span>
                            <span className="text-[9.5px] text-cool-gray block">{logs.length} entries</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-border-gray flex items-center justify-between text-xs text-cool-gray">
                  <span>{activeProjectsInWc.length} active project tools</span>
                  <span className="font-semibold text-ink">{wcTotalHours.toFixed(1)} logged hrs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Cell Drilldown Modal (Detailed Operations & Log History) */}
      {selectedCellDrilldown && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-border-gray rounded-[14px] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border-gray flex items-center justify-between bg-canvas/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {selectedCellDrilldown.workcenter.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-xs">
                      {selectedCellDrilldown.project.projectCode}
                    </span>
                    <h3 className="text-base font-bold text-ink">
                      {selectedCellDrilldown.workcenter.name}
                    </h3>
                  </div>
                  <p className="text-xs text-cool-gray mt-0.5">
                    {selectedCellDrilldown.project.toolName || selectedCellDrilldown.project.name} &bull; Total Time: <span className="font-mono font-bold text-primary">{selectedCellDrilldown.totalHours.toFixed(1)} hrs</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCellDrilldown(null)}
                className="p-1.5 rounded-lg text-cool-gray hover:text-ink hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Operation Logs List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {selectedCellDrilldown.logs.length === 0 ? (
                <div className="p-8 bg-canvas border border-border-gray rounded-[12px] text-center space-y-2">
                  <Activity className="w-8 h-8 text-mute mx-auto" />
                  <p className="text-sm font-semibold text-ink">No Operations Logged Yet</p>
                  <p className="text-xs text-cool-gray">
                    No daily report entries have been recorded for this tool in {selectedCellDrilldown.workcenter.name}.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const proj = selectedCellDrilldown.project;
                      const wcKey = selectedCellDrilldown.workcenter.key;
                      setSelectedCellDrilldown(null);
                      setQuickLogTarget({
                        project: proj,
                        logType: wcKey === 'ENGINEERING' ? 'DESIGNER' : 'MSDR',
                        section: wcKey,
                      });
                    }}
                    className="mt-2"
                  >
                    Log First Operation
                  </Button>
                </div>
              ) : (
                selectedCellDrilldown.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-[12px] bg-canvas border border-border-gray shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> {log.personName}
                      </span>
                      <span className="font-mono font-bold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded">
                        {log.hoursSpent} hrs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-cool-gray pt-1">
                      <div>
                        <span className="block text-[10px] text-mute uppercase font-medium">Operation / Stage</span>
                        <span className="font-medium text-ink">{log.workStageOrOperation || 'Standard Operation'}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-mute uppercase font-medium">Machine / Tool</span>
                        <span className="font-medium text-ink">{log.machineOrTool || 'Shopfloor Machine'}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-mute uppercase font-medium">Log Date</span>
                        <span className="font-mono text-ink">{log.logDate?.split('T')[0]}</span>
                      </div>
                    </div>

                    {log.description && (
                      <div className="pt-2 border-t border-border-gray/60 text-xs text-cool-gray">
                        <span className="font-medium text-ink">Remarks:</span> {log.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-gray flex items-center justify-between bg-canvas/40">
              <span className="text-xs text-cool-gray">
                {selectedCellDrilldown.logs.length} logged operations recorded
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedCellDrilldown(null)}
              >
                Close Drilldown
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Quick Work Log Modal */}
      {quickLogTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-border-gray rounded-[14px] shadow-2xl max-w-lg w-full overflow-hidden">
            <form onSubmit={handleQuickLogSubmit}>
              <div className="p-5 border-b border-border-gray flex items-center justify-between bg-canvas/60">
                <div>
                  <h3 className="text-base font-bold text-ink">Quick Log Toolroom Work</h3>
                  <p className="text-xs text-cool-gray mt-0.5">
                    [{quickLogTarget.project.projectCode}] {quickLogTarget.project.toolName || quickLogTarget.project.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickLogTarget(null)}
                  className="p-1.5 rounded-lg text-cool-gray hover:text-ink hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Log Type Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Department / Log Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickLogTarget({ ...quickLogTarget, logType: 'DESIGNER', section: 'ENGINEERING' })}
                      className={`py-2 px-3 rounded-[8px] text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        quickLogTarget.logType === 'DESIGNER'
                          ? 'bg-primary text-white border-primary shadow-subtle'
                          : 'bg-canvas border-border-gray text-cool-gray hover:text-ink'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" /> CAD/CAM Design
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickLogTarget({ ...quickLogTarget, logType: 'MSDR', section: 'MACHINE_SHOP' })}
                      className={`py-2 px-3 rounded-[8px] text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        quickLogTarget.logType === 'MSDR'
                          ? 'bg-primary text-white border-primary shadow-subtle'
                          : 'bg-canvas border-border-gray text-cool-gray hover:text-ink'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" /> Shopfloor MSDR
                    </button>
                  </div>
                </div>

                {quickLogTarget.logType === 'DESIGNER' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Designer / Engineer Name</label>
                      <input
                        type="text"
                        value={quickDesignerName}
                        onChange={(e) => setQuickDesignerName(e.target.value)}
                        placeholder="e.g. Lead CAD Engineer"
                        className="w-full h-9 px-3 bg-canvas border border-border-gray rounded-[8px] text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Design Stage / Work Stage</label>
                      <Select
                        value={quickWorkStage}
                        onChange={(e) => setQuickWorkStage(e.target.value)}
                        size="sm"
                      >
                        <option value="3D Solid Modeling">3D Solid Modeling & Concept</option>
                        <option value="Die Core & Cavity Extraction">Die Core & Cavity Extraction</option>
                        <option value="2D Manufacturing Drawings">2D Manufacturing Drawings & GD&T</option>
                        <option value="CAM CNC Tool Path Programming">CAM CNC Tool Path Programming</option>
                        <option value="Electrode Design & Wire-Cut CAD">Electrode Design & Wire-Cut CAD</option>
                        <option value="BOM Generation & Release">BOM Generation & Release</option>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Section</label>
                        <Select
                          value={quickLogTarget.section}
                          onChange={(e) => setQuickLogTarget({ ...quickLogTarget, section: e.target.value })}
                          size="sm"
                        >
                          <option value="MACHINE_SHOP">CNC / VMC Milling</option>
                          <option value="WIRE_CUT">EDM / Wire-Cut</option>
                          <option value="TOOL_ROOM_FITTING">Toolroom Fitting</option>
                          <option value="LATHE_GRINDING">Lathe & Grinding</option>
                          <option value="QUALITY">CMM & Inspection</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink mb-1">Machine / Station</label>
                        <input
                          type="text"
                          value={quickMachineName}
                          onChange={(e) => setQuickMachineName(e.target.value)}
                          placeholder="e.g. VMC-01"
                          className="w-full h-9 px-3 bg-canvas border border-border-gray rounded-[8px] text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={quickHours}
                    onChange={(e) => setQuickHours(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas border border-border-gray rounded-[8px] text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Operation Description / Remarks</label>
                  <textarea
                    rows={2}
                    value={quickDescription}
                    onChange={(e) => setQuickDescription(e.target.value)}
                    placeholder="Describe the tooling work performed..."
                    className="w-full p-2.5 bg-canvas border border-border-gray rounded-[8px] text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border-gray flex items-center justify-end gap-2 bg-canvas/40">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuickLogTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={createDesignerLogMutation.isPending || createMsdrLogMutation.isPending}
                >
                  Submit Tool Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
