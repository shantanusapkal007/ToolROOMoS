import React, { useState, useEffect } from 'react';
import { EntityField } from '../../modules/settings/types';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';

interface SmartFormProps {
  fields: EntityField[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const SmartForm: React.FC<SmartFormProps> = ({ fields, initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Initialize with empty strings
      const init: any = {};
      fields.forEach(f => init[f.name] = '');
      setFormData(init);
    }
  }, [initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const gridClass = field.gridCols === 2 ? 'md:col-span-2' : 'col-span-1';
          
          if (field.type === 'select' && field.options) {
            return (
              <div key={field.name} className={gridClass}>
                <Select
                  label={field.label}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  options={field.options}
                />
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <div key={field.name} className={gridClass}>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px]"
                />
              </div>
            );
          }

          // Default fallback for text, email, number, date
          return (
            <div key={field.name} className={gridClass}>
              <Input
                label={field.label}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 mt-6">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Record' : 'Create Record'}
        </Button>
      </div>
    </form>
  );
};
