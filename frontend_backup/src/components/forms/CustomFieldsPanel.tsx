import React from 'react';

interface CustomFieldDef {
  fieldName: string;
  fieldType: string;
  options?: any;
  isRequired?: boolean;
}

interface CustomFieldsPanelProps {
  module: string;
  definitions: CustomFieldDef[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  disabled?: boolean;
}

export function CustomFieldsPanel({
  module,
  definitions,
  values = {},
  onChange,
  disabled = false,
}: CustomFieldsPanelProps) {
  if (!definitions || definitions.length === 0) {
    return null; // Don't render if no custom fields are defined for this module
  }

  const handleChange = (fieldName: string, value: any) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h3 className="text-lg font-medium mb-4">Custom Fields</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {definitions.map((def) => (
          <div key={def.fieldName} className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {def.fieldName}
              {def.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {def.fieldType === 'TEXT' && (
              <input
                type="text"
                value={values[def.fieldName] || ''}
                onChange={(e) => handleChange(def.fieldName, e.target.value)}
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}

            {def.fieldType === 'NUMBER' && (
              <input
                type="number"
                value={values[def.fieldName] || ''}
                onChange={(e) => handleChange(def.fieldName, Number(e.target.value))}
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}

            {def.fieldType === 'DATE' && (
              <input
                type="date"
                value={values[def.fieldName] || ''}
                onChange={(e) => handleChange(def.fieldName, e.target.value)}
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            )}

            {def.fieldType === 'CHECKBOX' && (
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  checked={values[def.fieldName] || false}
                  onChange={(e) => handleChange(def.fieldName, e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
            )}

            {def.fieldType === 'DROPDOWN' && (
              <select
                value={values[def.fieldName] || ''}
                onChange={(e) => handleChange(def.fieldName, e.target.value)}
                disabled={disabled}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select...</option>
                {Array.isArray(def.options) &&
                  def.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
