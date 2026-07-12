import { EntityRegistry } from '../types';

export const uomRegistry: EntityRegistry = {
  id: 'uom',
  singularName: 'UOM',
  pluralName: 'Units of Measure',
  apiEndpoint: '/commercial/uoms',
  columns: [
    { key: 'uomCode', label: 'UOM Code' },
    { key: 'uomName', label: 'UOM Name' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'uomCode', label: 'UOM Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'uomName', label: 'UOM Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
