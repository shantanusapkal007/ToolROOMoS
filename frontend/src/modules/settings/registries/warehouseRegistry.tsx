import { EntityRegistry } from '../types';

export const warehouseRegistry: EntityRegistry = {
  id: 'warehouses',
  singularName: 'Plant',
  pluralName: 'Plants',
  apiEndpoint: 'master-data/warehouses',

  permissions: {
    view: ['ADMIN', 'STORES'],
    create: ['ADMIN', 'STORES'],
    update: ['ADMIN', 'STORES'],
    archive: ['ADMIN'],
  },

  columns: [
    { key: 'warehouseCode', label: 'Plant Code' },
    { key: 'warehouseName', label: 'Plant Name' },
    { key: 'warehouseType', label: 'Plant Type' },
    { key: 'status', label: 'Status' },
  ],

  fields: [
    { name: 'warehouseCode', label: 'Plant Code', type: 'text', required: true },
    { name: 'warehouseName', label: 'Plant Name', type: 'text', required: true },
    { name: 'plantId', label: 'Manufacturing Facility', type: 'select', required: true, optionsEndpoint: 'master-data/plants', optionsLabelKey: 'plantName', optionsValueKey: 'id' },
    {
      name: 'warehouseType',
      label: 'Plant Type',
      type: 'select',
      options: [
        { label: 'General Plant', value: 'GENERAL' },
        { label: 'Raw Material Stores', value: 'RAW_MATERIAL' },
        { label: 'Finished Goods Plant', value: 'FINISHED_GOODS' },
        { label: 'WIP Shopfloor', value: 'WIP' },
        { label: 'Quarantine Yard', value: 'QUARANTINE' },
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
