import { EntityRegistry } from '../types';

export const companyRegistry: EntityRegistry = {
  id: 'company',
  singularName: 'Company',
  pluralName: 'Companies',
  apiEndpoint: '/organization/companies',
  columns: [
    { key: 'companyCode', label: 'Company Code' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'gstNumber', label: 'GST Number' },
    { key: 'pan', label: 'PAN' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'companyCode', label: 'Company Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'companyName', label: 'Company Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'currency', label: 'Currency', type: 'text', section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'gstNumber', label: 'GST Number', type: 'text', section: 'Legal Information' },
    { name: 'pan', label: 'PAN', type: 'text', section: 'Legal Information' },
    { name: 'address', label: 'Address', type: 'textarea', section: 'Contact Information' },
    { name: 'contactPhone', label: 'Contact Phone', type: 'text', section: 'Contact Information' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', section: 'Contact Information' },
  ],
};
