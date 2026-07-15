import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

const fetchTickets = async () => {
  const res = await api.get('/maintenance');
  return res as any;
};

const createTicket = async (data: any) => {
  const res = await api.post('/maintenance', data);
  return res as any;
};

const updateTicket = async ({ id, ...data }: any) => {
  const res = await api.patch(`/maintenance/${id}`, data);
  return res as any;
};

const toggleLOTO = async ({ id, lotoApplied }: any) => {
  const res = await api.patch(`/maintenance/${id}`, { lotoApplied });
  return res as any;
};

const addLog = async ({ id, actionTaken, timeSpentHours }: any) => {
  const res = await api.post(`/maintenance/${id}/logs`, { actionTaken, timeSpentHours });
  return res as any;
};

const addSparePart = async ({ id, materialId, quantityConsumed }: any) => {
  const res = await api.post(`/maintenance/${id}/spare-parts`, { materialId, quantityConsumed });
  return res as any;
};

export function useMaintenanceTickets() {
  return useQuery({
    queryKey: ['maintenanceTickets'],
    queryFn: fetchTickets,
  });
}

export function useCreateMaintenanceTicket() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      success('Breakdown Ticket created successfully.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to create breakdown ticket.');
    },
  });
}

export function useUpdateMaintenanceTicket() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: updateTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      success('Ticket updated successfully.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to update ticket.');
    },
  });
}

export function useToggleLOTO() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: toggleLOTO,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
      success(variables.lotoApplied ? 'LOTO Applied' : 'LOTO Removed');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to toggle LOTO.');
    },
  });
}

export function useAddMaintenanceLog() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: addLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
      success('Maintenance log added.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to add log.');
    },
  });
}

export function useAddSparePart() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: addSparePart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTickets'] });
      success('Spare part logged successfully.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Failed to log spare part.');
    },
  });
}
