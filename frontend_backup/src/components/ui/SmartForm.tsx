'use client';
import React, { useState, useEffect } from 'react';
import { EntityField } from '../../modules/settings/types';
import { api } from '../../lib/api';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface SmartFormProps {
  fields: EntityField[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const SmartForm: React.FC<SmartFormProps> = ({ fields, initialData, onSubmit, onCancel, isLoading, children }) => {
  const [formData, setFormData] = useState<any>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, {label: string, value: string}[]>>({});
  
  // Quick Add State
  const [quickAddField, setQuickAddField] = useState<EntityField | null>(null);
  const [quickAddData, setQuickAddData] = useState<any>({});
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickAddOptions, setQuickAddOptions] = useState<Record<string, any[]>>({});
  const { success, error } = useToast();

  const normalizeList = (response: any) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  };

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
          const res = await api.get(f.optionsEndpoint.replace(/^\/+/, ''));
          const data = normalizeList(res);
          const opts = data.map((item: any) => ({
            label: String(item[f.optionsLabelKey || 'name'] || item.id),
            value: String(item[f.optionsValueKey || 'id'])
          }));
          setDynamicOptions(prev => ({ ...prev, [f.name]: opts }));
        } catch(err) {
          console.error(`Failed to load options for ${f.name} via ${f.optionsEndpoint}:`, err);
        }
      }
    });
  }, [initialData, fields]);

  // Load missing options for Quick Add if needed
  useEffect(() => {
    if (!quickAddField) return;
    const loadQuickOpts = async (endpoint: string, key: string, labelKey: string) => {
      try {
        const res = await api.get(endpoint);
        const opts = normalizeList(res).map((item: any) => ({
          label: String(item[labelKey] || item.name || item.id),
          value: String(item.id)
        }));
        setQuickAddOptions(prev => ({ ...prev, [key]: opts }));
      } catch (e) {
        console.error("Quick add options load failed", e);
      }
    };

    if (quickAddField.optionsEndpoint?.includes('departments')) {
      loadQuickOpts('master-data/plants', 'plants', 'plantName');
    }
    if (quickAddField.optionsEndpoint?.includes('plants')) {
      loadQuickOpts('master-data/companies', 'companies', 'companyName');
    }
  }, [quickAddField]);

  const handleChange = (name: string, value: any) => {
    // Intercept CREATE_NEW
    if (value === 'CREATE_NEW') {
      const field = fields.find(f => f.name === name);
      if (field) {
        setQuickAddField(field);
        setQuickAddData({});
      }
      return;
    }
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddField || !quickAddField.optionsEndpoint) return;
    setIsQuickAdding(true);
    try {
      const endpoint = quickAddField.optionsEndpoint.replace(/^\/+/, '');
      const res = await api.post(endpoint, quickAddData);
      const newEntity = res.data || res;
      
      const newOption = {
        label: String(newEntity[quickAddField.optionsLabelKey || 'name'] || newEntity.id),
        value: String(newEntity[quickAddField.optionsValueKey || 'id'])
      };

      setDynamicOptions(prev => ({
        ...prev,
        [quickAddField.name]: [...(prev[quickAddField.name] || []), newOption]
      }));

      handleChange(quickAddField.name, newOption.value);
      success('Created', `Successfully added new option.`);
      setQuickAddField(null);
    } catch (err: any) {
      error('Creation Failed', err.message || 'Failed to create new option.');
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const renderField = (field: EntityField) => {
    const gridClass = field.gridCols === 2 ? 'col-span-12' : 'col-span-12 md:col-span-6';
    
    if (field.type === 'select') {
      const opts = field.optionsEndpoint ? (dynamicOptions[field.name] || []) : (field.options || []);
      const isCreatable = !!field.optionsEndpoint && field.optionsEndpoint.startsWith('master-data/');
      return (
        <div key={field.name} className={gridClass}>
          <Select
            label={field.label}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            options={opts}
            creatable={isCreatable}
          />
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className={`${gridClass} relative group/input`}>
          <label className="block text-caption font-medium text-[var(--text-secondary)] mb-[var(--space-1)] tracking-wide group-focus-within/input:text-[var(--color-brand)] transition-colors">
            {field.label} {field.required && <span className="text-[var(--color-brand)]">*</span>}
          </label>
          <textarea
            required={field.required}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-500)] rounded-[var(--radius-md)] px-[var(--space-1-5)] py-[var(--space-1)] text-body font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)] shadow-[var(--shadow-elevation)] focus:outline-none focus:bg-[var(--bg-panel)] focus:ring-[var(--shadow-focus)] focus:border-[var(--color-brand)] hover:bg-[var(--hover-600)] hover:border-[var(--color-brand)]/50 transition-all duration-[var(--motion-hover)] min-h-[80px] resize-y"
          />
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className={`${gridClass} flex items-center h-full pt-5 group/input`}>
          <label className="flex items-center space-x-[var(--space-1-5)] cursor-pointer group">
            <div className="relative flex items-center justify-center w-[var(--space-2)] h-[var(--space-2)] rounded-[var(--radius-sm)] border border-[var(--border-500)] bg-[var(--bg-surface)] shadow-[var(--shadow-elevation)] backdrop-blur-md group-hover:bg-[var(--hover-600)] group-hover:border-[var(--color-brand)]/50 group-focus-within:ring-[var(--shadow-focus)] transition-all duration-[var(--motion-hover)]">
              <input
                type="checkbox"
                required={field.required}
                checked={!!formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="absolute opacity-0 w-full h-full cursor-pointer"
              />
              {formData[field.name] && (
                <svg className="w-3.5 h-3.5 text-[var(--color-brand)] drop-shadow-[var(--shadow-glow)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              )}
            </div>
            <span className="text-body font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-focus-within/input:text-[var(--color-brand)] transition-colors">{field.label} {field.required && <span className="text-[var(--color-error)]">*</span>}</span>
          </label>
        </div>
      );
    }

    if (field.type === 'radio' && field.options) {
      return (
        <div key={field.name} className={`${gridClass} group/input`}>
          <label className="block text-caption font-medium text-[var(--text-secondary)] mb-[var(--space-1)] tracking-wide group-focus-within/input:text-[var(--color-brand)] transition-colors">
            {field.label} {field.required && <span className="text-[var(--color-error)]">*</span>}
          </label>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {field.options.map(opt => (
              <label key={opt.value} className="flex items-center space-x-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center w-[var(--space-2)] h-[var(--space-2)] rounded-full border border-[var(--border-500)] bg-[var(--bg-surface)] shadow-[var(--shadow-elevation)] backdrop-blur-md group-hover:bg-[var(--hover-600)] group-hover:border-[var(--color-brand)]/50 group-focus-within:ring-[var(--shadow-focus)] transition-all duration-[var(--motion-hover)]">
                  <input
                    type="radio"
                    name={field.name}
                    required={field.required}
                    checked={formData[field.name] === opt.value}
                    onChange={() => handleChange(field.name, opt.value)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {formData[field.name] === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-brand)] shadow-[var(--shadow-glow)]"></div>
                  )}
                </div>
                <span className="text-body font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{opt.label}</span>
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
    <form onSubmit={handleSubmit} className="space-y-[var(--space-3)]">
      {Object.entries(sections).map(([sectionName, sectionFields], index) => (
        <div key={sectionName} className={`relative ${index > 0 ? 'pt-[var(--space-4)] border-t border-[var(--border-500)] mt-[var(--space-4)]' : ''}`}>
          <h3 className="text-micro font-semibold text-[var(--color-brand)] uppercase tracking-widest mb-[var(--space-3)] flex items-center">
            {sectionName}
          </h3>
          <div className="grid grid-cols-12 gap-x-[var(--space-3)] gap-y-[var(--space-3)]">
            {sectionFields.map(renderField)}
          </div>
        </div>
      ))}

      {children}

      <div className="flex justify-end space-x-[var(--space-1-5)] pt-[var(--space-3)] border-t border-[var(--border-500)] mt-[var(--space-3)]">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Update Record' : 'Create Record'}
        </Button>
      </div>

      {/* Quick Add Modal */}
      <Modal
        isOpen={!!quickAddField}
        onClose={() => setQuickAddField(null)}
        title={`Add New ${quickAddField?.label}`}
        maxWidth="md"
      >
        {quickAddField && (
          <form onSubmit={handleQuickAddSubmit} className="space-y-4">
            
            {quickAddField.optionsEndpoint?.includes('departments') && (
              <>
                <Input required label="Department Name" value={quickAddData.departmentName || ''} onChange={(e) => setQuickAddData({...quickAddData, departmentName: e.target.value})} />
                <Select required label="Parent Plant" value={quickAddData.plantId || ''} onChange={(e) => setQuickAddData({...quickAddData, plantId: e.target.value})} options={quickAddOptions['plants'] || dynamicOptions['plantId'] || []} />
              </>
            )}

            {quickAddField.optionsEndpoint?.includes('plants') && (
              <>
                <Input required label="Plant Name" value={quickAddData.plantName || ''} onChange={(e) => setQuickAddData({...quickAddData, plantName: e.target.value})} />
                <Select required label="Parent Company" value={quickAddData.companyId || ''} onChange={(e) => setQuickAddData({...quickAddData, companyId: e.target.value})} options={quickAddOptions['companies'] || dynamicOptions['companyId'] || []} />
              </>
            )}

            {quickAddField.optionsEndpoint?.includes('companies') && (
              <Input required label="Company Name" value={quickAddData.companyName || ''} onChange={(e) => setQuickAddData({...quickAddData, companyName: e.target.value})} />
            )}

            {quickAddField.optionsEndpoint?.includes('shifts') && (
              <>
                <Input required label="Shift Name" value={quickAddData.shiftName || ''} onChange={(e) => setQuickAddData({...quickAddData, shiftName: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input required type="time" label="Start Time" value={quickAddData.startTime || ''} onChange={(e) => setQuickAddData({...quickAddData, startTime: e.target.value})} />
                  <Input required type="time" label="End Time" value={quickAddData.endTime || ''} onChange={(e) => setQuickAddData({...quickAddData, endTime: e.target.value})} />
                </div>
              </>
            )}

            {quickAddField.optionsEndpoint?.includes('material-shapes') && (
              <Input required label="Shape Name" value={quickAddData.shapeName || ''} onChange={(e) => setQuickAddData({...quickAddData, shapeName: e.target.value})} />
            )}

            {/* Fallback simple name input if endpoint is unknown */}
            {!['departments', 'plants', 'companies', 'shifts', 'material-shapes'].some(ep => quickAddField.optionsEndpoint?.includes(ep)) && (
              <Input required label="Name" value={quickAddData.name || ''} onChange={(e) => setQuickAddData({...quickAddData, name: e.target.value})} />
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setQuickAddField(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isQuickAdding}>Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </form>
  );
};

