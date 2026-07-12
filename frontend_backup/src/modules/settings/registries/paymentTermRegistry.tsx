import { EntityRegistry } from '../types';

export const paymentTermRegistry: EntityRegistry = {
  id: 'payment-term',
  singularName: 'Payment Term',
  pluralName: 'Payment Terms',
  apiEndpoint: '/commercial/payment-terms',
  columns: [
    { key: 'termCode', label: 'Term Code' },
    { key: 'termName', label: 'Term Name' },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'termCode', label: 'Term Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'termName', label: 'Term Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'days', label: 'Days', type: 'number', required: true, section: 'Financials' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
