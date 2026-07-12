import { api } from '../lib/api';

export const UsersService = {
  getUsers: async (params?: any): Promise<any> => {
    const res = await api.get('users', { params });
    return res.data;
  },

  createUser: async (data: any): Promise<any> => {
    const res = await api.post('users', data);
    return res.data;
  },

  updateUser: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`users/${id}`, data);
    return res.data;
  },
};
