import { api } from '../lib/api';

export interface GlobalDailyReportItem {
  id: string;
  headerId?: string;
  opId?: string;
  type: 'DESIGNER' | 'MSDR';
  logDate: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectToolName: string;
  section: string; // ENGINEERING, MACHINE_SHOP, PRESS_SHOP, FABRICATION_INDIAN, FABRICATION_EXPORT, TOOL_ROOM_FITTING
  personName: string;
  personId?: string;
  machineOrTool: string;
  workStageOrOperation: string;
  partOrDrawing: string;
  startTime: string;
  endTime: string;
  hoursSpent: number;
  setupTime: number;
  cuttingTime: number;
  producedQty: number;
  description: string;
  status: string;
  cadFileUrl?: string | null;
  remarks?: string | null;
  createdAt: string;
}

export interface EmployeeDailyReportStats {
  date: string;
  totalHoursToday: number;
  designerHoursToday: number;
  msdrHoursToday: number;
  activeProjectsLogged: number;
  totalActiveProjectsInSystem: number;
  activeDesignersCount: number;
  activeMachinistsCount: number;
}

export interface ActiveRunningProject {
  id: string;
  projectCode: string;
  name: string;
  toolName?: string;
  category?: string;
  currentStage: string;
}

export interface GlobalDesignerLogPayload {
  projectId: string;
  designerName: string;
  designerId?: string;
  workStage: string;
  partName?: string;
  drawingNumber?: string;
  revision?: string;
  description: string;
  workDate?: string;
  startTime?: string;
  endTime?: string;
  hoursSpent?: number;
  status?: string;
  cadFileUrl?: string;
  remarks?: string;
}

export interface GlobalMsdrLogPayload {
  projectId: string;
  machineId?: string;
  employeeId: string;
  reportDate: string;
  productionSection?: string;
  remarks?: string;
  toolNo?: string;
  detNo?: string;
  description?: string;
  rawMatlSize?: string;
  finishMatlSize?: string;
  producedQty?: number;
  startTime?: string;
  endTime?: string;
  setupTime?: number;
  cuttingTime?: number;
}

export const DailyReportsService = {
  getGlobalEmployeeDailyReports: async (params?: {
    date?: string;
    projectId?: string;
    section?: string;
    employeeId?: string;
    machineId?: string;
    search?: string;
    type?: string;
  }): Promise<GlobalDailyReportItem[]> => {
    const res = await api.get('reports/employee-daily-reports', { params });
    const raw: any = res;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray((raw?.data as any)?.data)) return (raw.data as any).data;
    return [];
  },

  getEmployeeDailyReportStats: async (params?: { date?: string }): Promise<EmployeeDailyReportStats> => {
    const res = await api.get<EmployeeDailyReportStats>('reports/employee-daily-reports/stats', { params });
    return res.data as unknown as EmployeeDailyReportStats;
  },

  getActiveRunningProjects: async (): Promise<ActiveRunningProject[]> => {
    const res = await api.get<ActiveRunningProject[]>('reports/active-running-projects');
    // Handle multiple possible response shapes:
    // res could be { data: [...] } or res.data could be { data: [...] } or res itself could be an array
    const raw: any = res;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray((raw?.data as any)?.data)) return (raw.data as any).data;
    return [];
  },

  createGlobalDesignerLog: async (payload: GlobalDesignerLogPayload): Promise<any> => {
    const res = await api.post('reports/designer-log', payload);
    return res.data;
  },

  createGlobalMsdrLog: async (payload: GlobalMsdrLogPayload): Promise<any> => {
    const res = await api.post('reports/msdr-log', payload);
    return res.data;
  },
};
