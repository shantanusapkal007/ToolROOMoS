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
    { name: 'preferredVendorId', label: 'Preferred Vendor', type: 'select', optionsEndpoint: 'master-data/vendors', optionsLabelKey: 'vendorName', optionsValueKey: 'id' },
    { name: 'alternativeVendorId', label: 'Alternative Vendor', type: 'select', optionsEndpoint: 'master-data/vendors', optionsLabelKey: 'vendorName', optionsValueKey: 'id' },
    { name: 'minStock', label: 'Min Stock Level', type: 'number' },
    { name: 'reorderLevel', label: 'Reorder Level', type: 'number' },
    { name: 'leadTime', label: 'Lead Time (Days)', type: 'number' },
    { name: 'purchaseCost', label: 'Purchase Cost', type: 'number' },
    { name: 'scrapPercentage', label: 'Scrap %', type: 'number' },
    { name: 'moq', label: 'Minimum Order Quantity', type: 'number' },
    { name: 'colourCode', label: 'Colour Code', type: 'text' },
    { name: 'shapeId', label: 'Material Shape', type: 'select', optionsEndpoint: 'master-data/material-shapes', optionsLabelKey: 'shapeName', optionsValueKey: 'id' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', gridCols: 2 },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
