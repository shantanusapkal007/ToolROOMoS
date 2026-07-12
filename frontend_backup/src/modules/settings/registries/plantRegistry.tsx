import { EntityRegistry } from '../types';

export const plantRegistry: EntityRegistry = {
  id: 'plant',
  singularName: 'Plant',
  pluralName: 'Plants',
  apiEndpoint: '/organization/plants',
  columns: [
    { key: 'plantCode', label: 'Plant Code' },
    { key: 'plantName', label: 'Plant Name' },
    { key: 'companyId', label: 'Company ID' },
    { key: 'address', label: 'Address' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'plantCode', label: 'Plant Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'plantName', label: 'Plant Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'companyId', label: 'Company ID', type: 'text', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'workingHours', label: 'Working Hours', type: 'text', section: 'Operations' },
    { name: 'address', label: 'Address', type: 'textarea', section: 'Location' },
  ],
};
