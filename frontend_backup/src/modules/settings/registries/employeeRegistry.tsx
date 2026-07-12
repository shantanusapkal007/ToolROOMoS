import React from 'react';
import { EntityRegistry } from '../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const employeeRegistry: EntityRegistry = {
  id: 'employees',
  singularName: 'Employee',
  pluralName: 'Employees',
  apiEndpoint: 'master-data/employees',

  columns: [
    { key: 'employeeCode', label: 'Emp ID' },
    { key: 'name', label: 'Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'employeeType', label: 'Type' },
    { key: 'hourlyRate', label: 'Hourly Rate' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'employeeCode', label: 'Employee ID', type: 'text', required: true },
    { name: 'name', label: 'Employee Name', type: 'text', required: true },
    { name: 'designation', label: 'Designation', type: 'text' },
    { name: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'master-data/departments', optionsLabelKey: 'departmentName', optionsValueKey: 'id' },
    { name: 'shiftId', label: 'Shift', type: 'select', optionsEndpoint: 'master-data/shifts', optionsLabelKey: 'shiftName', optionsValueKey: 'id' },
    { name: 'employeeType', label: 'Employee Type', type: 'select', options: [
      { label: 'Internal', value: 'INTERNAL' },
      { label: 'External', value: 'EXTERNAL' },
    ] },
    { name: 'hourlyRate', label: 'Hourly Cost Rate', type: 'number', required: true },
    { name: 'skillLevel', label: 'Skill Level', type: 'select', options: [
      { label: 'Unskilled', value: 'UNSKILLED' },
      { label: 'Semi-skilled', value: 'SEMI_SKILLED' },
      { label: 'Skilled', value: 'SKILLED' },
      { label: 'Highly Skilled', value: 'HIGHLY_SKILLED' }
    ]},
    { name: 'overtimeRate', label: 'Overtime Rate', type: 'number' },
    { name: 'operatorCategory', label: 'Operator Category', type: 'text' },
    { name: 'dailyWorkingHours', label: 'Daily Working Hours', type: 'number' },
    { name: 'defaultMachineId', label: 'Default Machine', type: 'select', optionsEndpoint: 'master-data/machines', optionsLabelKey: 'machineName', optionsValueKey: 'id' },
    { name: 'costCentre', label: 'Cost Centre', type: 'text' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', gridCols: 2 },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
    ] },
  ],
};
