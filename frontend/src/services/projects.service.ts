import { api } from '../lib/api';
import { Project } from '../types/domain';

export type { Project };

export const ProjectsService = {
  getAllProjects: async (): Promise<Project[]> => {
    const res: any = await api.get('projects');
    const data = res?.data !== undefined ? res.data : res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getProjectById: async (id: string): Promise<Project> => {
    const res: any = await api.get(`projects/${id}`);
    const data = res?.data !== undefined ? res.data : res;
    return data as Project;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res: any = await api.post('projects', data);
    return (res?.data !== undefined ? res.data : res) as Project;
  },

  getReopenImpact: async (id: string): Promise<any> => {
    const res: any = await api.get(`projects/${id}/reopen-impact`);
    return res?.data !== undefined ? res.data : res;
  },

  reopenEngineering: async (id: string): Promise<any> => {
    const res: any = await api.patch(`projects/${id}/reopen-engineering`);
    return res?.data !== undefined ? res.data : res;
  },

  completeProduction: async (id: string, remarks?: string): Promise<Project> => {
    const res: any = await api.post(`projects/${id}/complete-production`, { remarks });
    return (res?.data !== undefined ? res.data : res) as Project;
  },

  completeProject: async (id: string, remarks?: string): Promise<Project> => {
    const res: any = await api.post(`projects/${id}/complete`, { remarks });
    return (res?.data !== undefined ? res.data : res) as Project;
  },
};
