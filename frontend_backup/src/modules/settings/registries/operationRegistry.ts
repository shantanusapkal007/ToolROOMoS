import React from 'react';
import { EntityRegistry } from '../types';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const operationRegistry: EntityRegistry = {
  id: 'operations',
  singularName: 'Operation',
  pluralName: 'Operations',
  apiEndpoint: 'master-data/operations',

  permissions: {
    view: ['ADMIN', 'ENGINEERING'],
    create: ['ADMIN', 'ENGINEERING'],
    update: ['ADMIN', 'ENGINEERING'],
    archive: ['ADMIN'],
  },

  columns: [
    { key: 'operationCode', label: 'Operation Code' },
    { key: 'operationName', label: 'Operation Name' },
    { key: 'status', label: 'Status', render: (val) => React.createElement(StatusBadge, { status: val }) },
  ],

  fields: [
    { name: 'operationCode', label: 'Operation Code', type: 'text', required: true },
    { name: 'operationName', label: 'Operation Name', type: 'text', required: true },
    { name: 'remarks', label: 'Remarks', type: 'textarea', gridCols: 2 },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
      required: true,
    },
  ]
};
