import { EntityRegistry } from '../types';

export const warehouseRegistry: EntityRegistry = {
  id: 'warehouses',
  singularName: 'Warehouse',
  pluralName: 'Warehouses',
  apiEndpoint: 'master-data/warehouses',

  permissions: {
    view: ['ADMIN', 'STORES'],
    create: ['ADMIN', 'STORES'],
    update: ['ADMIN', 'STORES'],
    archive: ['ADMIN'],
  },

  columns: [
    { key: 'warehouseCode', label: 'Warehouse Code' },
    { key: 'warehouseName', label: 'Name' },
    { key: 'warehouseType', label: 'Type' },
    { key: 'status', label: 'Status' },
  ],

  fields: [
    { name: 'warehouseCode', label: 'Warehouse Code', type: 'text', required: true },
    { name: 'warehouseName', label: 'Name', type: 'text', required: true },
    { name: 'plantId', label: 'Plant', type: 'select', required: true, optionsEndpoint: 'master-data/plants', optionsLabelKey: 'plantName', optionsValueKey: 'id' },
    {
      name: 'warehouseType',
      label: 'Type',
      type: 'select',
      options: [
        { label: 'General', value: 'GENERAL' },
        { label: 'Raw Material', value: 'RAW_MATERIAL' },
        { label: 'Finished Goods', value: 'FINISHED_GOODS' },
        { label: 'WIP', value: 'WIP' },
        { label: 'Quarantine', value: 'QUARANTINE' },
      ],
    },
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
