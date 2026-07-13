import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePurchaseOrders } from '../useProcurement';
import { ProcurementService } from '../../services/procurement.service';

// Mock the service
jest.mock('../../services/procurement.service', () => ({
  ProcurementService: {
    getPurchaseOrders: jest.fn(),
    createPurchaseOrder: jest.fn(),
    updatePurchaseOrder: jest.fn(),
    processGRN: jest.fn(),
  },
}));

// Mock toast
jest.mock('../../components/ui/Toast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('useProcurement hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('usePurchaseOrders fetches data successfully', async () => {
    const mockData = [{ id: 'po-1', poNumber: 'PO-001' }];
    (ProcurementService.getPurchaseOrders as jest.Mock).mockResolvedValueOnce(mockData);

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePurchaseOrders('proj-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(ProcurementService.getPurchaseOrders).toHaveBeenCalledWith('proj-1');
  });
});
