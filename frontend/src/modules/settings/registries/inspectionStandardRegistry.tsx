import { EntityRegistry } from '../types';

export const inspectionStandardRegistry: EntityRegistry = {
  id: 'inspection-standards',
  singularName: 'Inspection Standard',
  pluralName: 'Inspection Standards',
  apiEndpoint: 'master-data/inspection-standards',

  permissions: {
    view: ['ADMIN', 'QUALITY', 'PRODUCTION'],
    create: ['ADMIN', 'QUALITY'],
    update: ['ADMIN', 'QUALITY'],
    archive: ['ADMIN'],
  },

  columns: [
    { key: 'standardCode', label: 'Standard Code' },
    { key: 'standardName', label: 'Standard Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
  ],

  fields: [
    {
      name: 'standardCode',
      label: 'Standard Code',
      type: 'text',
      required: true,
      placeholder: 'e.g., STD-QA-001',
    },
    {
      name: 'standardName',
      label: 'Standard Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., Press Tool Punch-Die Clearance Standard',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      placeholder: 'Detailed standard specification parameters...',
      gridCols: 2,
    },
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
  ],
};
