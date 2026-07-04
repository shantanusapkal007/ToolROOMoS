import { BaseRegistry } from '../types';

export const operationRegistry: BaseRegistry = {
  id: 'operations',
  name: 'Operations',
  endpoint: 'master-data/operations',
  columns: [
    { key: 'operationCode', label: 'Operation Code', type: 'text' },
    { key: 'operationName', label: 'Operation Name', type: 'text' },
  ],
  formFields: [
    { key: 'operationCode', label: 'Operation Code', type: 'text', required: true },
    { key: 'operationName', label: 'Operation Name', type: 'text', required: true },
  ]
};
