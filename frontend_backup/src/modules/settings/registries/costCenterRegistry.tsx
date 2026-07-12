import { EntityRegistry } from '../types';

export const costCenterRegistry: EntityRegistry = {
  id: 'cost-center',
  singularName: 'Cost Center',
  pluralName: 'Cost Centers',
  apiEndpoint: '/organization/cost-centers',
  columns: [
    { key: 'costCenterCode', label: 'CC Code' },
    { key: 'costCenterName', label: 'Cost Center Name' },
    { key: 'budget', label: 'Budget' },
  ],
  fields: [
    { name: 'costCenterCode', label: 'CC Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'costCenterName', label: 'Cost Center Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'budget', label: 'Budget', type: 'number', section: 'Financials' },
  ],
};
