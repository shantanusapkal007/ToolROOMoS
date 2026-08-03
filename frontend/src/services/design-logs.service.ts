import { api } from '../lib/api';

export interface DesignWorkLog {
  id: string;
  projectId: string;
  designerName: string;
  designerId?: string;
  workStage: string;
  partName?: string;
  drawingNumber?: string;
  revision?: string;
  description: string;
  workDate: string;
  startTime?: string;
  endTime?: string;
  hoursSpent: number;
  status: string;
  cadFileUrl?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DesignSummary {
  totalLogs: number;
  totalHours: number;
  activeDesignersCount: number;
  designersList: string[];
  completedTasks: number;
  drawingsCount: number;
  latestActivity: {
    designerName: string;
    workStage: string;
    workDate: string;
    description: string;
  } | null;
}

export const DesignLogsService = {
  getDesignLogs: async (
    projectId: string,
    params?: { search?: string; designer?: string; workStage?: string; status?: string }
  ): Promise<DesignWorkLog[]> => {
    const res = await api.get<DesignWorkLog[]>(`projects/${projectId}/design-logs`, { params });
    return (res.data as unknown as DesignWorkLog[]) || [];
  },

  getDesignSummary: async (projectId: string): Promise<DesignSummary> => {
    const res = await api.get<DesignSummary>(`projects/${projectId}/design-logs/summary`);
    return res.data as unknown as DesignSummary;
  },

  createDesignLog: async (
    projectId: string,
    data: Partial<DesignWorkLog>
  ): Promise<DesignWorkLog> => {
    const res = await api.post<DesignWorkLog>(`projects/${projectId}/design-logs`, data);
    return res.data as unknown as DesignWorkLog;
  },

  updateDesignLog: async (
    projectId: string,
    logId: string,
    data: Partial<DesignWorkLog>
  ): Promise<DesignWorkLog> => {
    const res = await api.put<DesignWorkLog>(`projects/${projectId}/design-logs/${logId}`, data);
    return res.data as unknown as DesignWorkLog;
  },

  deleteDesignLog: async (projectId: string, logId: string): Promise<void> => {
    await api.delete(`projects/${projectId}/design-logs/${logId}`);
  },
};
