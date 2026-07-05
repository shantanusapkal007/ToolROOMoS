import React, { useState, useEffect } from 'react';
import { EntityField } from '../../modules/settings/types';
import { api } from '../../lib/api';
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
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, {label: string, value: string}[]>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Initialize with empty strings
      const init: any = {};
      fields.forEach(f => init[f.name] = '');
      setFormData(init);
    }

    // Load dynamic options
    fields.forEach(async (f) => {
      if (f.optionsEndpoint) {
        try {
          const res = await api.get(f.optionsEndpoint);
          const data = res.data?.data || res.data || [];
          const opts = data.map((item: any) => ({
            label: String(item[f.optionsLabelKey || 'name'] || item.id),
            value: String(item[f.optionsValueKey || 'id'])
          }));
          setDynamicOptions(prev => ({ ...prev, [f.name]: opts }));
        } catch(err) {
          console.error("Failed to load options for", f.name);
        }
      }
    });
  }, [initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const renderField = (field: EntityField) => {
    const gridClass = field.gridCols === 2 ? 'md:col-span-2' : 'col-span-1';
    
    if (field.type === 'select') {
      const opts = field.optionsEndpoint ? (dynamicOptions[field.name] || []) : (field.options || []);
      return (
        <div key={field.name} className={gridClass}>
          <Select
            label={field.label}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            options={opts}
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
            className="w-full bg-[#050A14]/95 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-[#050A14] focus:shadow-[0_0_15px_rgba(59,130,246,0.3),_inset_0_2px_4px_rgba(0,0,0,0.3)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#050A14]/90 transition-all duration-300 min-h-[100px]"
          />
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className={`${gridClass} flex items-center h-full pt-6`}>
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-md border border-white/10 bg-[#050A14]/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-md group-hover:border-white/30 group-hover:bg-[#050A14] transition-all duration-300">
              <input
                type="checkbox"
                required={field.required}
                checked={!!formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
              />
              {formData[field.name] && (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              )}
            </div>
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
          </label>
        </div>
      );
    }

    if (field.type === 'radio' && field.options) {
      return (
        <div key={field.name} className={gridClass}>
          <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex flex-wrap gap-4">
            {field.options.map(opt => (
              <label key={opt.value} className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-white/10 bg-[#050A14]/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] backdrop-blur-md group-hover:border-white/30 group-hover:bg-[#050A14] transition-all duration-300">
                  <input
                    type="radio"
                    name={field.name}
                    required={field.required}
                    checked={formData[field.name] === opt.value}
                    onChange={() => handleChange(field.name, opt.value)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {formData[field.name] === opt.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  )}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
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
  };

  // Group fields by section
  const sections = fields.reduce((acc, field) => {
    const sectionName = field.section || 'General Details';
    if (!acc[sectionName]) acc[sectionName] = [];
    acc[sectionName].push(field);
    return acc;
  }, {} as Record<string, EntityField[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {Object.entries(sections).map(([sectionName, sectionFields]) => (
        <div key={sectionName} className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 mb-4">
            {sectionName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0B1018]/30 p-5 rounded-xl border border-white/5">
            {sectionFields.map(renderField)}
          </div>
        </div>
      ))}

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
