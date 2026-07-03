export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'checkbox' | 'date';

export interface EntityField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[]; // For select type
  placeholder?: string;
  gridCols?: 1 | 2; // Span 1 or 2 columns in form layout
}

export interface EntityColumn {
  key: string;
  label: string;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface EntityRegistry {
  id: string; // e.g. 'customers'
  singularName: string; // e.g. 'Customer'
  pluralName: string; // e.g. 'Customers'
  apiEndpoint: string; // e.g. 'master-data/customers'
  icon?: React.ReactNode;
  
  // Permissions
  permissions?: {
    view: string[];
    create: string[];
    update: string[];
    archive: string[];
  };

  // Table Configuration
  columns: EntityColumn[];
  
  // Form Configuration
  fields: EntityField[];
}
