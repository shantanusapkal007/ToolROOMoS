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
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'departmentId', label: 'Department' },
    { key: 'role', label: 'System Role' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ],

  fields: [
    { name: 'employeeCode', label: 'Employee ID', type: 'text', required: true },
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email Address', type: 'email' },
    { name: 'phone', label: 'Phone Number', type: 'text' },
    { name: 'companyId', label: 'Company (Parent)', type: 'select', required: true, optionsEndpoint: 'master-data/companies', optionsLabelKey: 'companyName', optionsValueKey: 'id' },
    { name: 'departmentId', label: 'Department', type: 'select', required: true, optionsEndpoint: 'master-data/departments', optionsLabelKey: 'departmentName', optionsValueKey: 'id' },
    { name: 'role', label: 'System Role', type: 'select', required: true, options: [
      { label: 'Admin', value: 'ADMIN' },
      { label: 'Manager', value: 'MANAGER' },
      { label: 'Engineer', value: 'ENGINEER' },
      { label: 'Operator', value: 'OPERATOR' }
    ] },
    { name: 'hourlyRate', label: 'Hourly Cost Rate ($)', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
      { label: 'On Leave', value: 'ON_LEAVE' }
    ] },
  ]
};
