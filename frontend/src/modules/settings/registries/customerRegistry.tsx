import React from 'react';
import { EntityRegistry } from '../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const customerRegistry: EntityRegistry = {
  id: 'customers',
  singularName: 'Customer',
  pluralName: 'Customers',
  apiEndpoint: 'master-data/customers',
  
  columns: [
    { key: 'customerCode', label: 'Code' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'contactPhone', label: 'Phone' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'customerCode', label: 'Customer Code', type: 'text', required: true },
    { name: 'companyName', label: 'Company Name', type: 'text', required: true },
    { name: 'companyId', label: 'Company (Parent)', type: 'select', required: true, options: [
      // Hardcoding parent company for demo, normally this fetches from /companies
      { label: 'Default Company HQ', value: '11111111-1111-1111-1111-111111111111' } // A mock UUID or we have to lookup
    ] },
    { name: 'gstNumber', label: 'GST Number', type: 'text' },
    { name: 'contactPerson', label: 'Contact Person', type: 'text' },
    { name: 'contactPhone', label: 'Phone Number', type: 'text' },
    { name: 'contactEmail', label: 'Email Address', type: 'email' },
    { name: 'billingAddress', label: 'Billing Address', type: 'textarea', gridCols: 2 },
    { name: 'paymentTerms', label: 'Payment Terms', type: 'select', options: [
      { label: 'Net 30', value: 'Net 30' },
      { label: 'Net 60', value: 'Net 60' },
      { label: 'Advance 100%', value: 'Advance' }
    ] },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
