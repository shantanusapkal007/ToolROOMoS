import React from 'react';
import { EntityRegistry } from '../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const vendorRegistry: EntityRegistry = {
  id: 'vendors',
  singularName: 'Vendor',
  pluralName: 'Vendors',
  apiEndpoint: 'master-data/vendors',
  
  columns: [
    { key: 'vendorCode', label: 'Code' },
    { key: 'vendorName', label: 'Vendor Name' },
    { key: 'vendorType', label: 'Type' },
    { key: 'contactPhone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'vendorCode', label: 'Vendor Code', type: 'text', required: true },
    { name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
    { name: 'companyId', label: 'Company (Parent)', type: 'select', required: true, optionsEndpoint: 'master-data/companies', optionsLabelKey: 'companyName', optionsValueKey: 'id' },
    { name: 'vendorType', label: 'Vendor Type', type: 'select', required: true, options: [
      { label: 'Material Supplier', value: 'MATERIAL_SUPPLIER' },
      { label: 'Heat Treatment', value: 'HEAT_TREATMENT' },
      { label: 'Plating', value: 'PLATING' },
      { label: 'Grinding', value: 'GRINDING' },
      { label: 'Coating', value: 'COATING' },
      { label: 'Tool Supplier', value: 'TOOL_SUPPLIER' }
    ] },
    { name: 'gstNumber', label: 'GST Number', type: 'text' },
    { name: 'contactPhone', label: 'Phone Number', type: 'text' },
    { name: 'contactEmail', label: 'Email Address', type: 'email' },
    { name: 'address', label: 'Address', type: 'textarea', gridCols: 2 },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
