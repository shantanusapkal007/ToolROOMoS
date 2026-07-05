import { api } from '../lib/api';

export const TasksService = {
  getTasks: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/tasks`);
    return res.data;
  },
  
  createTask: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/tasks`, data);
    return res.data;
  },
  
  updateTaskStatus: async (projectId: string, taskId: string, status: string): Promise<any> => {
    const res = await api.patch(`projects/${projectId}/tasks/${taskId}/status`, { status });
    return res.data;
  }
};
