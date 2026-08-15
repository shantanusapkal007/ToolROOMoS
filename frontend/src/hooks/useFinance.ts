import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '../services/finance.service';
import { useToast } from '../components/ui/Toast';
import { projectKeys } from './useProjects';

export const financeKeys = {
  all: ['finance'] as const,
  costEvents: (projectId: string) => [...financeKeys.all, 'cost-events', projectId] as const,
  dashboard: () => [...financeKeys.all, 'dashboard'] as const,
  labourAnalytics: (monthYear?: string) => [...financeKeys.all, 'labour-analytics', monthYear] as const,
  projectProfitability: () => [...financeKeys.all, 'project-profitability'] as const,
  payrollVsRevenue: (months?: number) => [...financeKeys.all, 'payroll-vs-revenue', months] as const,
  costBreakdown: () => [...financeKeys.all, 'cost-breakdown'] as const,
  reconciliation: (monthYear?: string) => [...financeKeys.all, 'reconciliation', monthYear] as const,
  monthlyPayroll: (monthYear?: string) => [...financeKeys.all, 'monthly-payroll', monthYear] as const,
};

export function useCostEvents(projectId: string) {
  return useQuery({
    queryKey: financeKeys.costEvents(projectId),
    queryFn: () => FinanceService.getCostEvents(projectId),
    enabled: !!projectId,
  });
}

export function useCreateInvoice(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => FinanceService.createInvoice(projectId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.costEvents(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Invoice Generated', `Tax Invoice created successfully.`);
    },
    onError: (err: any) => {
      error('Invoice Failed', err.message || 'An error occurred');
    },
  });
}

export function useRecordPayment(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => FinanceService.recordPayment(projectId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.costEvents(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Payment Recorded', `Payment recorded successfully.`);
    },
    onError: (err: any) => {
      error('Payment Failed', err.message || 'An error occurred');
    },
  });
}

// --- Global Finance Dashboard Hooks ---

export function useFinanceDashboard() {
  return useQuery({
    queryKey: financeKeys.dashboard(),
    queryFn: () => FinanceService.getFinanceDashboard(),
    staleTime: 30_000,
  });
}

export function useLabourAnalytics(monthYear?: string) {
  return useQuery({
    queryKey: financeKeys.labourAnalytics(monthYear),
    queryFn: () => FinanceService.getLabourAnalytics(monthYear),
    staleTime: 30_000,
  });
}

export function useProjectProfitability() {
  return useQuery({
    queryKey: financeKeys.projectProfitability(),
    queryFn: () => FinanceService.getProjectProfitability(),
    staleTime: 30_000,
  });
}

export function usePayrollVsRevenue(months: number = 6) {
  return useQuery({
    queryKey: financeKeys.payrollVsRevenue(months),
    queryFn: () => FinanceService.getPayrollVsRevenue(months),
    staleTime: 30_000,
  });
}

export function useCostBreakdown() {
  return useQuery({
    queryKey: financeKeys.costBreakdown(),
    queryFn: () => FinanceService.getCostBreakdown(),
    staleTime: 30_000,
  });
}

export function usePayrollFinanceReconciliation(monthYear?: string) {
  return useQuery({
    queryKey: financeKeys.reconciliation(monthYear),
    queryFn: () => FinanceService.getPayrollFinanceReconciliation(monthYear),
    staleTime: 30_000,
  });
}

export function useMonthlyPayroll(monthYear?: string) {
  return useQuery({
    queryKey: financeKeys.monthlyPayroll(monthYear),
    queryFn: () => FinanceService.getMonthlyPayroll(monthYear),
    staleTime: 30_000,
  });
}

export function useUpsertMonthlySalary() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: { employeeId: string; monthYear: string; actualSalary: number; remarks?: string }) =>
      FinanceService.upsertMonthlySalary(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.monthlyPayroll(variables.monthYear) });
      queryClient.invalidateQueries({ queryKey: financeKeys.reconciliation(variables.monthYear) });
      queryClient.invalidateQueries({ queryKey: financeKeys.dashboard() });
      success('Salary Adjusted', 'Employee actual salary updated successfully.');
    },
    onError: (err: any) => {
      error('Update Failed', err?.message || 'Failed to update salary.');
    },
  });
}
