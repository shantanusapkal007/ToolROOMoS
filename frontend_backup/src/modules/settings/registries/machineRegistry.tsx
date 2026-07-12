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
    { key: 'hourlyRate', label: 'Hourly Rate (₹)' },
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
    { name: 'model', label: 'Model Number', type: 'text' },
    { name: 'installationDate', label: 'Installation Date', type: 'date' },
    { name: 'setupHours', label: 'Setup Hours', type: 'number' },
    { name: 'machineGroup', label: 'Machine Group', type: 'text' },
    { name: 'workingHoursPerShift', label: 'Working Hours / Shift', type: 'number' },
    { name: 'powerConsumption', label: 'Power Consumption (kW)', type: 'number' },
    { name: 'maintenanceFactor', label: 'Maintenance Factor', type: 'number' },
    { name: 'overtimeMultiplier', label: 'Overtime Multiplier', type: 'number' },
    { name: 'efficiency', label: 'Efficiency (%)', type: 'number' },
    { name: 'utilizationTarget', label: 'Utilization Target (%)', type: 'number' },
    { name: 'isActive', label: 'Is Active', type: 'select', options: [
      { label: 'Yes', value: 'true' },
      { label: 'No', value: 'false' }
    ] },
    { name: 'monthlyMaintenanceCost', label: 'Monthly Maint. Cost (₹)', type: 'number' },
    { name: 'costCentre', label: 'Cost Centre', type: 'text' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Maintenance', value: 'MAINTENANCE' },
      { label: 'Inactive', value: 'INACTIVE' }
    ] },
  ]
};
