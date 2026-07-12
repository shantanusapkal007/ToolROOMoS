import { EntityRegistry } from '../types';

export const taxRegistry: EntityRegistry = {
  id: 'tax',
  singularName: 'Tax',
  pluralName: 'Taxes',
  apiEndpoint: '/commercial/taxes',
  columns: [
    { key: 'taxCode', label: 'Tax Code' },
    { key: 'taxName', label: 'Tax Name' },
    { key: 'taxType', label: 'Tax Type' },
    { key: 'rate', label: 'Rate (%)' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'taxCode', label: 'Tax Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'taxName', label: 'Tax Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'taxType', label: 'Tax Type', type: 'select', options: [{label: 'GST', value: 'GST'}, {label: 'VAT', value: 'VAT'}], section: 'Basic Details' },
    { name: 'rate', label: 'Rate (%)', type: 'number', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
