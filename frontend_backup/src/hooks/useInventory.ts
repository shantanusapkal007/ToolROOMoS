import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/inventory.service';

export const inventoryKeys = {
  all: ['inventory'] as const,
  batches: (projectId: string) => [...inventoryKeys.all, 'batches', projectId] as const,
  ledger: () => [...inventoryKeys.all, 'ledger'] as const,
};

export function useInventoryBatches(projectId: string) {
  return useQuery({
    queryKey: inventoryKeys.batches(projectId),
    queryFn: () => InventoryService.getBatches(projectId),
    enabled: !!projectId,
  });
}

export function useInventoryLedger() {
  return useQuery({
    queryKey: inventoryKeys.ledger(),
    queryFn: () => InventoryService.getInventoryLedger(),
  });
}
