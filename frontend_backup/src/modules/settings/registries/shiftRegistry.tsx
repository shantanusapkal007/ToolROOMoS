import { EntityRegistry } from '../types';

export const shiftRegistry: EntityRegistry = {
  id: 'shift',
  singularName: 'Shift',
  pluralName: 'Shifts',
  apiEndpoint: '/organization/shifts',
  columns: [
    { key: 'shiftName', label: 'Shift Name' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'shiftName', label: 'Shift Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
    { name: 'startTime', label: 'Start Time', type: 'text', required: true, section: 'Timing' },
    { name: 'endTime', label: 'End Time', type: 'text', required: true, section: 'Timing' },
  ],
};
