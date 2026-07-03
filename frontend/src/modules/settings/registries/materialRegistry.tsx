import React from 'react';
import { EntityRegistry } from '../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const materialRegistry: EntityRegistry = {
  id: 'materials',
  singularName: 'Material',
  pluralName: 'Materials',
  apiEndpoint: 'master-data/materials',
  
  columns: [
    { key: 'materialCode', label: 'Material Code' },
    { key: 'name', label: 'Name' },
    { key: 'materialGroup', label: 'Group' },
    { key: 'baseUnit', label: 'Base Unit' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'materialCode', label: 'Material Code', type: 'text', required: true },
    { name: 'name', label: 'Material Name / Description', type: 'text', required: true, gridCols: 2 },
    { name: 'companyId', label: 'Company (Parent)', type: 'select', required: true, options: [
      { label: 'Default Company HQ', value: '11111111-1111-1111-1111-111111111111' }
    ] },
    { name: 'materialGroup', label: 'Material Group', type: 'select', required: true, options: [
      { label: 'Raw Material', value: 'RAW_MATERIAL' },
      { label: 'Finished Good', value: 'FINISHED_GOOD' },
      { label: 'Consumable', value: 'CONSUMABLE' },
      { label: 'Tooling', value: 'TOOLING' }
    ] },
    { name: 'baseUnit', label: 'Base UOM', type: 'select', required: true, options: [
      { label: 'Kilograms (KG)', value: 'KG' },
      { label: 'Numbers (NOS)', value: 'NOS' },
      { label: 'Meters (MTR)', value: 'MTR' },
      { label: 'Liters (LTR)', value: 'LTR' }
    ] },
    { name: 'hsnCode', label: 'HSN/SAC Code', type: 'text' },
    { name: 'standardCost', label: 'Standard Cost', type: 'number' },
    { name: 'minimumStock', label: 'Minimum Stock Level', type: 'number' },
    { name: 'reorderPoint', label: 'Reorder Point', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
