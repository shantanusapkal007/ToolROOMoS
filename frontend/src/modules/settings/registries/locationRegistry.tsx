import { EntityRegistry } from '../types';

export const locationRegistry: EntityRegistry = {
  id: 'locations',
  singularName: 'Storage Location',
  pluralName: 'Storage Locations',
  apiEndpoint: 'master-data/locations',

  permissions: {
    view: ['ADMIN', 'STORES'],
    create: ['ADMIN', 'STORES'],
    update: ['ADMIN', 'STORES'],
    archive: ['ADMIN'],
  },

  columns: [
    { key: 'locationCode', label: 'Location Code' },
    { key: 'locationName', label: 'Name' },
    { key: 'warehouseId', label: 'Warehouse' },
    { key: 'status', label: 'Status' },
  ],

  fields: [
    { name: 'locationCode', label: 'Location Code', type: 'text', required: true, placeholder: 'e.g., WH1-R1-S2-B3' },
    { name: 'locationName', label: 'Name', type: 'text', required: true },
    { name: 'warehouseId', label: 'Warehouse', type: 'select', optionsEndpoint: 'master-data/warehouses', optionsLabelKey: 'warehouseName', optionsValueKey: 'id', required: true },
    { name: 'remarks', label: 'Remarks', type: 'textarea', gridCols: 2 },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
      required: true,
    },
  ],
};
