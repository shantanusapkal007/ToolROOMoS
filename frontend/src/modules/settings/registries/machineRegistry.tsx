import React from 'react';
import { EntityRegistry } from '../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const machineRegistry: EntityRegistry = {
  id: 'machines',
  singularName: 'Machine',
  pluralName: 'Machines',
  apiEndpoint: 'master-data/machines',
  
  columns: [
    { key: 'machineCode', label: 'Machine Code' },
    { key: 'machineName', label: 'Name' },
    { key: 'machineType', label: 'Type' },
    { key: 'plantId', label: 'Plant' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'machineCode', label: 'Machine Code', type: 'text', required: true },
    { name: 'machineName', label: 'Machine Name', type: 'text', required: true },
    { name: 'plantId', label: 'Plant', type: 'select', required: true, optionsEndpoint: 'master-data/plants', optionsLabelKey: 'plantName', optionsValueKey: 'id' },
    { name: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'master-data/departments', optionsLabelKey: 'departmentName', optionsValueKey: 'id' },
    { name: 'machineType', label: 'Machine Type', type: 'select', required: true, options: [
      { label: 'CNC Milling', value: 'CNC_MILLING' },
      { label: 'CNC Turning', value: 'CNC_TURNING' },
      { label: 'VMC', value: 'VMC' },
      { label: 'HMC', value: 'HMC' },
      { label: 'EDM Wirecut', value: 'EDM_WIRECUT' },
      { label: 'Grinding', value: 'GRINDING' }
    ] },
    { name: 'hourlyRate', label: 'Hourly Cost Rate (₹)', type: 'number', required: true },
    { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
    { name: 'modelNumber', label: 'Model Number', type: 'text' },
    { name: 'serialNumber', label: 'Serial Number', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Maintenance', value: 'MAINTENANCE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
