import { EntityRegistry } from '../types';

export const currencyRegistry: EntityRegistry = {
  id: 'currency',
  singularName: 'Currency',
  pluralName: 'Currencies',
  apiEndpoint: '/commercial/currencies',
  columns: [
    { key: 'currencyCode', label: 'Currency Code' },
    { key: 'currencyName', label: 'Currency Name' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'exchangeRate', label: 'Exchange Rate' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'currencyCode', label: 'Currency Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'currencyName', label: 'Currency Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'symbol', label: 'Symbol', type: 'text', section: 'Basic Details' },
    { name: 'exchangeRate', label: 'Exchange Rate', type: 'number', required: true, section: 'Financials' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
