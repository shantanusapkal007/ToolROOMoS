import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useAssemblyOrders = (projectId: string) => {
  return useQuery({
    queryKey: ['assemblyOrders', projectId],
    queryFn: async () => {
      const data = await api.get(`/projects/${projectId}/assembly/orders`);
      return data;
    },
    enabled: !!projectId
  });
};

export const useCreateAssemblyOrder = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await api.post(`/projects/${projectId}/assembly/orders`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblyOrders', projectId] });
    }
  });
};

export const useUpdateAssemblyStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const data = await api.put(`/projects/${projectId}/assembly/orders/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblyOrders', projectId] });
    }
  });
};

export const useProjectTrials = (projectId: string) => {
  return useQuery({
    queryKey: ['projectTrials', projectId],
    queryFn: async () => {
      const data = await api.get(`/projects/${projectId}/assembly/trials`);
      return data;
    },
    enabled: !!projectId
  });
};

export const useCreateProjectTrial = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await api.post(`/projects/${projectId}/assembly/trials`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTrials', projectId] });
    }
  });
};

export const useUpdateTrialStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: string; remarks: string }) => {
      const data = await api.put(`/projects/${projectId}/assembly/trials/${id}/status`, { status, remarks });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTrials', projectId] });
    }
  });
};

export const useSignOffTrial = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await api.put(`/projects/${projectId}/assembly/trials/${id}/signoff`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTrials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] }); // Update workflow status
    }
  });
};

export const useLinkSubAssembly = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childId }: { parentId: string, childId: string }) => {
      const data = await api.post(`/projects/${projectId}/assembly/orders/${parentId}/link-subassembly`, { childId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assemblyOrders', projectId] });
    }
  });
};
