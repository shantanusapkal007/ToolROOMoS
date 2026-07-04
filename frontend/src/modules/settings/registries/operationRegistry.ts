import { EntityRegistry } from '../types';

export const operationRegistry: EntityRegistry = {
  id: 'operations',
  singularName: 'Operation',
  pluralName: 'Operations',
  apiEndpoint: 'master-data/operations',
  columns: [
    { key: 'operationCode', label: 'Operation Code' },
    { key: 'operationName', label: 'Operation Name' },
  ],
  fields: [
    { name: 'operationCode', label: 'Operation Code', type: 'text', required: true },
    { name: 'operationName', label: 'Operation Name', type: 'text', required: true },
  ]
};
