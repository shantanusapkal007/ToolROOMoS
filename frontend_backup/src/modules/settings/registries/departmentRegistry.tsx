import { EntityRegistry } from '../types';

export const departmentRegistry: EntityRegistry = {
  id: 'department',
  singularName: 'Department',
  pluralName: 'Departments',
  apiEndpoint: '/organization/departments',
  columns: [
    { key: 'departmentCode', label: 'Dept Code' },
    { key: 'departmentName', label: 'Dept Name' },
    { key: 'plantId', label: 'Plant ID' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'departmentCode', label: 'Dept Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'departmentName', label: 'Dept Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'plantId', label: 'Plant ID', type: 'text', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
