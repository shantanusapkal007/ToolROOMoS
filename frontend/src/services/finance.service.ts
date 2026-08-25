import { api } from '../lib/api';

export const FinanceService = {
  // --- Project-scoped ---
  getCostEvents: async (projectId: string): Promise<any> => {
    const res: any = await api.get(`projects/${projectId}/cost-events`);
    return res?.data !== undefined ? res.data : res;
  },

  createInvoice: async (projectId: string, data: any): Promise<any> => {
    const res: any = await api.post(`projects/${projectId}/invoices`, data);
    return res?.data !== undefined ? res.data : res;
  },

  recordPayment: async (projectId: string, data: any): Promise<any> => {
    const res: any = await api.post(`projects/${projectId}/payments`, data);
    return res?.data !== undefined ? res.data : res;
  },

  // --- Global Finance Dashboard ---
  getFinanceDashboard: async (): Promise<any> => {
    const res: any = await api.get('finance/dashboard');
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  getLabourAnalytics: async (monthYear?: string): Promise<any> => {
    const res: any = await api.get('finance/labour-analytics', { params: { monthYear } });
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  getProjectProfitability: async (): Promise<any> => {
    const res: any = await api.get('finance/project-profitability');
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  getPayrollVsRevenue: async (months: number = 6): Promise<any> => {
    const res: any = await api.get('finance/payroll-vs-revenue', { params: { months } });
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  getCostBreakdown: async (): Promise<any> => {
    const res: any = await api.get('finance/cost-breakdown');
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  // --- HR Payroll-Finance Reconciliation ---
  getPayrollFinanceReconciliation: async (monthYear?: string): Promise<any> => {
    const res: any = await api.get('hr/payroll-finance-reconciliation', { params: { monthYear } });
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  getMonthlyPayroll: async (monthYear?: string): Promise<any> => {
    const res: any = await api.get('hr/monthly-payroll', { params: { monthYear } });
    const data = res?.data !== undefined ? res.data : res;
    return data?.data !== undefined ? data.data : data;
  },

  upsertMonthlySalary: async (data: { employeeId: string; monthYear: string; actualSalary: number; remarks?: string }): Promise<any> => {
    const res: any = await api.post('hr/monthly-salary', data);
    const result = res?.data !== undefined ? res.data : res;
    return result?.data !== undefined ? result.data : result;
  },
};
