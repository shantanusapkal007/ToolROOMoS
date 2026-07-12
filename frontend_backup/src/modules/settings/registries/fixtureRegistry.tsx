import { EntityRegistry } from '../types';

export const fixtureRegistry: EntityRegistry = {
  id: 'fixture',
  singularName: 'Fixture',
  pluralName: 'Fixtures',
  apiEndpoint: '/resources/fixtures',
  columns: [
    { key: 'fixtureCode', label: 'Fixture Code' },
    { key: 'fixtureName', label: 'Fixture Name' },
    { key: 'associatedMachines', label: 'Associated Machines' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'fixtureCode', label: 'Fixture Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'fixtureName', label: 'Fixture Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'associatedMachines', label: 'Associated Machines', type: 'textarea', section: 'Associations' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
