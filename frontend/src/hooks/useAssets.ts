import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetsService } from '../services/assets.service';

export const assetKeys = {
  all: ['assets'] as const,
  stats: () => [...assetKeys.all, 'stats'] as const,
  list: (params?: any) => [...assetKeys.all, 'list', params] as const,
  detail: (id: string) => [...assetKeys.all, 'detail', id] as const,
  categories: () => [...assetKeys.all, 'categories'] as const,
  locations: () => [...assetKeys.all, 'locations'] as const,
  issues: () => [...assetKeys.all, 'issues'] as const,
  returns: () => [...assetKeys.all, 'returns'] as const,
  maintenance: () => [...assetKeys.all, 'maintenance'] as const,
};

export function useAssetsDashboardStats() {
  return useQuery({
    queryKey: assetKeys.stats(),
    queryFn: () => AssetsService.getDashboardStats(),
    refetchInterval: 15000,
  });
}

export function useAssets(params?: { search?: string; categoryId?: string; status?: string; locationId?: string }) {
  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => AssetsService.getAssets(params),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => AssetsService.getAssetById(id),
    enabled: !!id,
  });
}

export function useAssetCategories() {
  return useQuery({
    queryKey: assetKeys.categories(),
    queryFn: () => AssetsService.getCategories(),
  });
}

export function useAssetLocations() {
  return useQuery({
    queryKey: assetKeys.locations(),
    queryFn: () => AssetsService.getLocations(),
  });
}

export function useAssetIssues() {
  return useQuery({
    queryKey: assetKeys.issues(),
    queryFn: () => AssetsService.getIssues(),
  });
}

export function useAssetReturns() {
  return useQuery({
    queryKey: assetKeys.returns(),
    queryFn: () => AssetsService.getReturns(),
  });
}

export function useAssetMaintenance() {
  return useQuery({
    queryKey: assetKeys.maintenance(),
    queryFn: () => AssetsService.getMaintenance(),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => AssetsService.createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => AssetsService.updateAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useIssueAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof AssetsService.issueAsset>[0]) => AssetsService.issueAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof AssetsService.returnAsset>[0]) => AssetsService.returnAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof AssetsService.createMaintenance>[0]) => AssetsService.createMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof AssetsService.completeMaintenance>[1] }) =>
      AssetsService.completeMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof AssetsService.createCategory>[0]) => AssetsService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.categories() });
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof AssetsService.createLocation>[0]) => AssetsService.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.locations() });
    },
  });
}
