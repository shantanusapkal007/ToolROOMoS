import { EntityRegistry } from '../types';

export const financialYearRegistry: EntityRegistry = {
  id: 'financial-year',
  singularName: 'Financial Year',
  pluralName: 'Financial Years',
  apiEndpoint: '/organization/financial-years',
  columns: [
    { key: 'yearName', label: 'Year Name' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'isActive', label: 'Is Active' },
  ],
  fields: [
    { name: 'yearName', label: 'Year Name', type: 'text', required: true, section: 'Details' },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true, section: 'Details' },
    { name: 'endDate', label: 'End Date', type: 'date', required: true, section: 'Details' },
    { name: 'isActive', label: 'Is Active', type: 'checkbox', section: 'Details' },
  ],
};
