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
    { name: 'customerCode', label: 'Customer Code', type: 'text', required: true, section: 'General Information' },
    { name: 'companyName', label: 'Company Name', type: 'text', required: true, section: 'General Information' },
    { name: 'companyId', label: 'Company (Parent)', type: 'select', required: true, section: 'General Information', options: [
      { label: 'Default Company HQ', value: '11111111-1111-1111-1111-111111111111' }
    ] },
    { name: 'gstNumber', label: 'GST Number', type: 'text', section: 'General Information' },
    { name: 'status', label: 'Status', type: 'select', section: 'General Information', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
    
    { name: 'contactPerson', label: 'Contact Person', type: 'text', section: 'Contact Details' },
    { name: 'contactPhone', label: 'Phone Number', type: 'text', section: 'Contact Details' },
    { name: 'contactEmail', label: 'Email Address', type: 'email', section: 'Contact Details' },
    
    { name: 'billingAddress', label: 'Billing Address', type: 'textarea', gridCols: 2, section: 'Billing & Payment' },
    { name: 'paymentTerms', label: 'Payment Terms', type: 'select', section: 'Billing & Payment', options: [
      { label: 'Net 30', value: 'Net 30' },
      { label: 'Net 60', value: 'Net 60' },
      { label: 'Advance 100%', value: 'Advance' }
    ] },
  ]
};
