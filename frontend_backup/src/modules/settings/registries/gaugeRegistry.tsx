import { EntityRegistry } from '../types';

export const gaugeRegistry: EntityRegistry = {
  id: 'gauge',
  singularName: 'Gauge',
  pluralName: 'Gauges',
  apiEndpoint: '/resources/gauges',
  columns: [
    { key: 'gaugeCode', label: 'Gauge Code' },
    { key: 'gaugeName', label: 'Gauge Name' },
    { key: 'calibrationDate', label: 'Calibration Date' },
    { key: 'nextCalibrationDate', label: 'Next Calibration' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'gaugeCode', label: 'Gauge Code', type: 'text', required: true, section: 'Basic Details' },
    { name: 'gaugeName', label: 'Gauge Name', type: 'text', required: true, section: 'Basic Details' },
    { name: 'status', label: 'Status', type: 'select', options: [{label: 'Active', value: 'ACTIVE'}, {label: 'Inactive', value: 'INACTIVE'}], section: 'Basic Details' },
    { name: 'calibrationDate', label: 'Calibration Date', type: 'date', section: 'Calibration' },
    { name: 'nextCalibrationDate', label: 'Next Calibration Date', type: 'date', section: 'Calibration' },
    { name: 'remarks', label: 'Remarks', type: 'textarea', section: 'Basic Details' },
  ],
};
