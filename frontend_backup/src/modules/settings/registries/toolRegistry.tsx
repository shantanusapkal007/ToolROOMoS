import { EntityRegistry } from '../types';

export const toolRegistry: EntityRegistry = {
  id: 'tool',
  singularName: 'Tool',
  pluralName: 'Tools',
  apiEndpoint: '/resources/tools',
  columns: [
    { key: 'toolCode', label: 'Tool Code' },
    { key: 'toolName', label: 'Tool Name' },
    { key: 'toolType', label: 'Tool Type' },
    { key: 'toolLife', label: 'Life' },
    { key: 'cost', label: 'Cost' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'toolCode', label: 'Tool Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'toolName', label: 'Tool Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'toolType', label: 'Tool Type', type: 'select', options: [{label: 'Cutting', value: 'CUTTING'}, {label: 'Forming', value: 'FORMING'}, {label: 'Measuring', value: 'MEASURING'}], section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'toolLife', label: 'Life (Strokes/Hours)', type: 'text', section: 'Specifications' },
    { name: 'cost', label: 'Cost', type: 'number', section: 'Specifications' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Specifications' },
  ],
};
