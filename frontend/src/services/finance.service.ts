import { api } from '../lib/api';

export const FinanceService = {
  // --- Project-scoped ---
  getCostEvents: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/cost-events`);
    return res.data;
  },

  createInvoice: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/invoices`, data);
    return res.data;
  },

  recordPayment: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/payments`, data);
    return res.data;
  },

  // --- Global Finance Dashboard ---
  getFinanceDashboard: async (): Promise<any> => {
    const res = await api.get('finance/dashboard');
    return (res as any)?.data ?? res;
  },

  getLabourAnalytics: async (monthYear?: string): Promise<any> => {
    const res = await api.get('finance/labour-analytics', { params: { monthYear } });
    return (res as any)?.data ?? res;
  },

  getProjectProfitability: async (): Promise<any> => {
    const res = await api.get('finance/project-profitability');
    return (res as any)?.data ?? res;
  },

  getPayrollVsRevenue: async (months: number = 6): Promise<any> => {
    const res = await api.get('finance/payroll-vs-revenue', { params: { months } });
    return (res as any)?.data ?? res;
  },

  getCostBreakdown: async (): Promise<any> => {
    const res = await api.get('finance/cost-breakdown');
    return (res as any)?.data ?? res;
  },

  // --- HR Payroll-Finance Reconciliation ---
  getPayrollFinanceReconciliation: async (monthYear?: string): Promise<any> => {
    const res = await api.get('hr/payroll-finance-reconciliation', { params: { monthYear } });
    return res;
  },

  getMonthlyPayroll: async (monthYear?: string): Promise<any> => {
    const res = await api.get('hr/monthly-payroll', { params: { monthYear } });
    return res;
  },
};
