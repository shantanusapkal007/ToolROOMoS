import { EntityRegistry } from '../types';

export const warehouseRegistry: EntityRegistry = {
  id: 'warehouses',
  name: 'Warehouse',
  pluralName: 'Warehouses',
  apiEndpoint: '/master-data/warehouses',
  
  permissions: {
    canCreate: ['ADMIN', 'STORES'],
    canUpdate: ['ADMIN', 'STORES'],
    canDelete: ['ADMIN'],
  },

  columns: [
    { key: 'code', label: 'Warehouse Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
  ],

  fields: [
    { name: 'code', label: 'Warehouse Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { 
      name: 'type', 
      label: 'Type', 
      type: 'select', 
      options: [
        { label: 'General', value: 'GENERAL' },
        { label: 'Raw Material', value: 'RAW_MATERIAL' },
        { label: 'Finished Goods', value: 'FINISHED_GOODS' },
        { label: 'WIP', value: 'WIP' },
        { label: 'Quarantine', value: 'QUARANTINE' },
      ]
    },
    { 
      name: 'status', 
      label: 'Status', 
      type: 'select', 
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' }
      ],
      required: true
    },
  ],
};
