import { useQuery } from '@tanstack/react-query';
import { MasterDataService } from '../services/master-data.service';

export const masterDataKeys = {
  all: ['master-data'] as const,
  registry: (registryId: string) => [...masterDataKeys.all, registryId] as const,
};

export function useMasterData<T = any>(registryId: string) {
  return useQuery({
    queryKey: masterDataKeys.registry(registryId),
    queryFn: () => MasterDataService.getRegistry<T>(registryId),
    enabled: !!registryId,
  });
}
