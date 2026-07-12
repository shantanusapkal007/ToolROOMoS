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
    { key: 'materialGrade', label: 'Grade / Description' },
    { key: 'materialCategory', label: 'Category' },
    { key: 'defaultUom', label: 'Base Unit' },
    { key: 'standardCost', label: 'Standard Cost' },
    { key: 'hsnCode', label: 'HSN Code' },
    { key: 'gstPercent', label: 'GST %' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'materialCode', label: 'Material Code', type: 'text', required: true },
    { name: 'materialGrade', label: 'Material Grade / Description', type: 'text', required: true, gridCols: 2 },
    { name: 'materialCategory', label: 'Material Category', type: 'select', options: [
      { label: 'Raw Material', value: 'RAW_MATERIAL' },
      { label: 'Finished Good', value: 'FINISHED_GOOD' },
      { label: 'Consumable', value: 'CONSUMABLE' },
      { label: 'Tooling', value: 'TOOLING' }
    ] },
    { name: 'defaultUom', label: 'Base UOM', type: 'select', required: true, options: [
      { label: 'Kilograms (KG)', value: 'KG' },
      { label: 'Numbers (NOS)', value: 'NOS' },
      { label: 'Meters (MTR)', value: 'MTR' },
      { label: 'Liters (LTR)', value: 'LTR' }
    ] },
    { name: 'density', label: 'Density', type: 'number' },
    { name: 'standardCost', label: 'Standard Cost', type: 'number' },
    { name: 'hsnCode', label: 'HSN Code', type: 'text' },
    { name: 'gstPercent', label: 'GST %', type: 'number' },
    { name: 'defaultVendor', label: 'Default Vendor', type: 'text' },
    { name: 'shapeId', label: 'Material Shape', type: 'select', optionsEndpoint: 'master-data/material-shapes', optionsLabelKey: 'shapeName', optionsValueKey: 'id' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', gridCols: 2 },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
