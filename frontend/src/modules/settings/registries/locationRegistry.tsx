import { EntityRegistry } from '../types';

export const locationRegistry: EntityRegistry = {
  id: 'locations',
  name: 'Storage Location',
  pluralName: 'Storage Locations',
  apiEndpoint: '/master-data/locations',
  
  permissions: {
    canCreate: ['ADMIN', 'STORES'],
    canUpdate: ['ADMIN', 'STORES'],
    canDelete: ['ADMIN'],
  },

  columns: [
    { key: 'code', label: 'Location Code' },
    { key: 'name', label: 'Name' },
    { key: 'warehouse.name', label: 'Warehouse' },
    { key: 'rack', label: 'Rack' },
    { key: 'bin', label: 'Bin' },
    { key: 'status', label: 'Status' },
  ],

  fields: [
    { name: 'code', label: 'Location Code', type: 'text', required: true, placeholder: 'e.g., WH1-R1-S2-B3' },
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'warehouseId', label: 'Warehouse', type: 'select', apiEndpoint: '/master-data/warehouses', required: true },
    { name: 'rack', label: 'Rack', type: 'text' },
    { name: 'shelf', label: 'Shelf', type: 'text' },
    { name: 'bin', label: 'Bin', type: 'text' },
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
