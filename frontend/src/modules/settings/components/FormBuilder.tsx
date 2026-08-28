"use client";

import React, { useState } from 'react';
import { Layout, Plus, Save, Settings, Type, Hash, List, CheckSquare, AlignLeft, GripVertical, Trash2, Calendar, ToggleLeft, CircleDot, Mail, UploadCloud, X, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBaseUrl } from '../../../lib/api';

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date' | 'toggle' | 'radio' | 'contact' | 'file';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  width?: 'full' | 'half';
}

const initialFields: FormField[] = [
  { id: '1', type: 'text', label: 'Company Name', required: true, placeholder: 'e.g. Acme Corp', width: 'full' },
  { id: '2', type: 'select', label: 'Industry', required: false, options: ['Manufacturing', 'Aerospace', 'Automotive'], width: 'half' },
  { id: '3', type: 'date', label: 'Est. Launch Date', required: false, width: 'half' },
];

export const FormBuilder = () => {
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [activeForm, setActiveForm] = useState('Customers');

  const { data: savedForm, isLoading } = useQuery({
    queryKey: ['form', activeForm],
    queryFn: async () => {
      const res = await fetch(`${getBaseUrl()}/settings/forms/${activeForm}`);
      if (!res.ok) throw new Error('Failed to fetch form');
      const json = await res.json();
      return json.data;
    }
  });

  const [fields, setFields] = useState<FormField[]>(initialFields);

  React.useEffect(() => {
    if (savedForm && savedForm.schema) {
      setFields(savedForm.schema as FormField[]);
    } else {
      setFields(initialFields);
    }
  }, [savedForm, activeForm]);

  const saveMutation = useMutation({
    mutationFn: async (schemaData: FormField[]) => {
      const res = await fetch(`${getBaseUrl()}/settings/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: activeForm,
          name: `${activeForm} Form`,
          schema: schemaData
        })
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', activeForm] });
      success('Schema Saved', 'Form schema saved successfully to database!');
    },
    onError: () => {
      error('Save Failed', 'Could not save the form schema to the database.');
    }
  });

  // Settings Panel State
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const addField = (type: FieldType) => {
    const newField: FormField = { 
      id: Date.now().toString(), 
      type, 
      label: 'New Field', 
      required: false,
      width: 'full',
      options: (type === 'select' || type === 'radio') ? ['Option 1', 'Option 2'] : undefined
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  const handleSave = () => {
    saveMutation.mutate(fields);
  };

  const getIconForType = (type: FieldType) => {
    switch(type) {
      case 'text': return <Type className="w-4 h-4 text-primary" />;
      case 'number': return <Hash className="w-4 h-4 text-emerald-600" />;
      case 'select': return <List className="w-4 h-4 text-primary" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4 text-amber-600" />;
      case 'textarea': return <AlignLeft className="w-4 h-4 text-cool-gray" />;
      case 'date': return <Calendar className="w-4 h-4 text-rose-600" />;
      case 'toggle': return <ToggleLeft className="w-4 h-4 text-emerald-600" />;
      case 'radio': return <CircleDot className="w-4 h-4 text-primary" />;
      case 'contact': return <Mail className="w-4 h-4 text-amber-600" />;
      case 'file': return <UploadCloud className="w-4 h-4 text-primary" />;
      default: return <Type className="w-4 h-4 text-primary" />;
    }
  };

  const editingField = fields.find(f => f.id === editingFieldId);

  return (
    <div className="h-full flex flex-col relative min-h-0 bg-[#fbfbfd]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white z-20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-subtle shrink-0">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight">Advanced Form & Schema Builder</h2>
            <p className="text-caption text-cool-gray mt-0.5">Design dynamic, responsive data entry schemas for master entities.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-48">
            <Select 
              value={activeForm}
              onChange={(e) => setActiveForm(e.target.value)}
              options={[
                { label: 'Customers Form', value: 'Customers' },
                { label: 'Vendors Form', value: 'Vendors' },
                { label: 'Materials Form', value: 'Materials' },
              ]}
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={saveMutation.isPending} className="h-9 px-4 font-semibold text-xs shadow-subtle">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Schema</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-10 min-h-0">
        {/* Left Sidebar - Toolbox */}
        <div className="w-60 border-r border-border-gray bg-white p-4 flex flex-col overflow-y-auto custom-scrollbar z-20 shrink-0">
          <span className="text-[10px] font-bold text-cool-gray uppercase tracking-wider mb-2 block">
            Input Elements
          </span>
          <div className="space-y-1.5 mb-6">
            {[
              { type: 'text', label: 'Short Text' },
              { type: 'textarea', label: 'Long Text' },
              { type: 'number', label: 'Number' },
              { type: 'contact', label: 'Contact Info' },
            ].map(tool => (
              <ToolboxItem key={tool.type} tool={tool} addField={addField} getIcon={getIconForType} />
            ))}
          </div>

          <span className="text-[10px] font-bold text-cool-gray uppercase tracking-wider mb-2 block">
            Selection Controls
          </span>
          <div className="space-y-1.5 mb-6">
            {[
              { type: 'select', label: 'Dropdown' },
              { type: 'radio', label: 'Radio Choice' },
              { type: 'checkbox', label: 'Checkbox' },
              { type: 'toggle', label: 'Toggle Switch' },
            ].map(tool => (
              <ToolboxItem key={tool.type} tool={tool} addField={addField} getIcon={getIconForType} />
            ))}
          </div>

          <span className="text-[10px] font-bold text-cool-gray uppercase tracking-wider mb-2 block">
            Advanced Elements
          </span>
          <div className="space-y-1.5">
            {[
              { type: 'date', label: 'Date Picker' },
              { type: 'file', label: 'File Upload' },
            ].map(tool => (
              <ToolboxItem key={tool.type} tool={tool} addField={addField} getIcon={getIconForType} />
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#fbfbfd] relative">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-border-gray rounded-[12px] p-6 shadow-subtle min-h-[500px] relative overflow-hidden">
              
              <div className="mb-6 border-b border-border-gray pb-3">
                <h3 className="text-sm font-bold text-ink">{activeForm} Entity Schema</h3>
                <p className="text-xs text-cool-gray">Click or drag elements from the left toolbox to configure this form.</p>
              </div>

              <div className="flex flex-wrap -mx-2.5">
                {isLoading ? (
                  <div className="w-full flex flex-col items-center justify-center py-24">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-3"></div>
                    <p className="text-cool-gray font-medium animate-pulse text-xs">Loading Schema...</p>
                  </div>
                ) : fields.length === 0 ? (
                  <div className="w-full text-center py-20 border-2 border-dashed border-border-gray rounded-[12px] flex flex-col items-center justify-center bg-slate-50">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Layout className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-ink mb-1">Blank Form Schema</h3>
                    <p className="text-xs text-cool-gray max-w-sm">Click input elements from the left toolbox to start building fields.</p>
                  </div>
                ) : (
                  fields.map((field) => {
                    const isEditing = editingFieldId === field.id;
                    const isHalf = field.width === 'half';
                    
                    return (
                      <div key={field.id} className={`p-2.5 ${isHalf ? 'w-1/2' : 'w-full'}`}>
                        <div className={`group relative flex flex-col p-4 rounded-[10px] border transition-all ${
                          isEditing 
                            ? 'bg-primary/5 border-primary shadow-subtle ring-1 ring-primary/20' 
                            : 'bg-white border-border-gray hover:border-primary/40 shadow-subtle'
                        }`}>
                          
                          {/* Drag Handle */}
                          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-move p-1 text-cool-gray hover:text-ink bg-white rounded-[6px] border border-border-gray shadow-subtle z-20">
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          
                          {/* Field Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getIconForType(field.type)}
                              <input 
                                value={field.label} 
                                onChange={(e) => updateField(field.id, { label: e.target.value })} 
                                className="bg-transparent border-b border-transparent hover:border-border-gray focus:border-primary focus:bg-white px-1.5 py-0.5 font-bold text-xs text-ink focus:outline-none rounded transition-colors"
                              />
                              {field.required && <span className="text-rose-500 font-bold text-xs">*</span>}
                            </div>
                          </div>
                          
                          {/* Field Mock UI */}
                          <div className="pointer-events-none opacity-90">
                            <FieldPreview field={field} />
                          </div>

                          {field.helpText && (
                            <div className="mt-1.5 flex items-start text-[11px] text-cool-gray">
                              <HelpCircle className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                              {field.helpText}
                            </div>
                          )}

                          {/* Hover Controls */}
                          <div className={`absolute right-3 top-3 flex items-center space-x-1 bg-white p-1 rounded-[8px] border border-border-gray shadow-subtle z-20 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button 
                              onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                              className={`p-1 rounded-[6px] transition-colors cursor-pointer ${isEditing ? 'bg-primary text-white' : 'text-cool-gray hover:text-ink hover:bg-slate-100'}`}
                              title="Field Settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => removeField(field.id)}
                              className="p-1 rounded-[6px] text-cool-gray hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove Field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {fields.length > 0 && (
                <div className="mt-8 pt-4 border-t border-border-gray flex justify-end space-x-3">
                  <Button variant="white" size="sm" onClick={() => setFields([])} className="h-9">Clear Canvas</Button>
                  <Button variant="primary" size="sm" onClick={handleSave} isLoading={saveMutation.isPending} className="h-9 font-semibold">
                    <Save className="w-4 h-4 mr-1.5" />
                    <span>Save Schema</span>
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Sidebar - Field Settings Panel (Slide Over) */}
        <div className={`absolute top-0 right-0 h-full w-80 bg-white border-l border-border-gray shadow-elevation z-40 transition-transform duration-300 flex flex-col ${editingFieldId ? 'translate-x-0' : 'translate-x-full'}`}>
          {editingField && (
            <>
              <div className="p-4 border-b border-border-gray flex items-center justify-between shrink-0 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-ink">Field Properties</h3>
                </div>
                <button onClick={() => setEditingFieldId(null)} className="p-1.5 rounded-[8px] text-cool-gray hover:text-ink hover:bg-slate-100 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                
                {/* Basic Settings */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-cool-gray uppercase tracking-wider block">Basic Config</span>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-cool-gray">Field Label</label>
                    <Input 
                      value={editingField.label} 
                      onChange={(e) => updateField(editingField.id, { label: e.target.value })} 
                      className="w-full text-xs"
                    />
                  </div>

                  {['text', 'number', 'textarea', 'contact', 'date'].includes(editingField.type) && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-cool-gray">Placeholder</label>
                      <Input 
                        value={editingField.placeholder || ''} 
                        onChange={(e) => updateField(editingField.id, { placeholder: e.target.value })} 
                        placeholder="e.g. Enter value..."
                        className="w-full text-xs"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-cool-gray">Help Text</label>
                    <Input 
                      value={editingField.helpText || ''} 
                      onChange={(e) => updateField(editingField.id, { helpText: e.target.value })} 
                      placeholder="Appears below the input..."
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                {/* Validation Settings */}
                <div className="space-y-3 pt-4 border-t border-border-gray">
                  <span className="text-[10px] font-bold text-cool-gray uppercase tracking-wider block">Layout & Rules</span>
                  
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-[10px] bg-slate-50 border border-border-gray hover:bg-slate-100 transition-colors">
                    <span className="text-xs font-bold text-ink">Required Field</span>
                    <input 
                      type="checkbox" 
                      checked={editingField.required}
                      onChange={(e) => updateField(editingField.id, { required: e.target.checked })}
                      className="rounded border-border-gray text-primary focus:ring-primary w-4 h-4"
                    />
                  </label>

                  <div className="space-y-1 mt-2">
                    <label className="text-[11px] font-semibold text-cool-gray">Field Width</label>
                    <div className="flex p-1 bg-slate-100 rounded-[10px] border border-border-gray">
                      <button 
                        onClick={() => updateField(editingField.id, { width: 'full' })}
                        className={`flex-1 text-xs font-semibold py-1 rounded-[8px] transition-colors cursor-pointer ${editingField.width !== 'half' ? 'bg-primary text-white shadow-subtle' : 'text-cool-gray hover:text-ink'}`}
                      >
                        Full (100%)
                      </button>
                      <button 
                        onClick={() => updateField(editingField.id, { width: 'half' })}
                        className={`flex-1 text-xs font-semibold py-1 rounded-[8px] transition-colors cursor-pointer ${editingField.width === 'half' ? 'bg-primary text-white shadow-subtle' : 'text-cool-gray hover:text-ink'}`}
                      >
                        Half (50%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Options (For Select & Radio) */}
                {['select', 'radio'].includes(editingField.type) && (
                  <div className="space-y-3 pt-4 border-t border-border-gray">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cool-gray uppercase tracking-wider">Dropdown Options</span>
                      <button 
                        onClick={() => {
                          const currentOptions = editingField.options || [];
                          updateField(editingField.id, { options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
                        }}
                        className="text-primary hover:text-primary-dark flex items-center bg-primary/10 px-2 py-0.5 rounded-[6px] text-[11px] font-bold cursor-pointer border border-primary/20"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </button>
                    </div>
                    
                    <div className="space-y-1.5">
                      {(editingField.options || []).map((opt, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Input 
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(editingField.options || [])];
                              newOpts[i] = e.target.value;
                              updateField(editingField.id, { options: newOpts });
                            }}
                            className="flex-1 text-xs"
                          />
                          <button 
                            onClick={() => {
                              const newOpts = [...(editingField.options || [])];
                              newOpts.splice(i, 1);
                              updateField(editingField.id, { options: newOpts });
                            }}
                            className="p-2 text-cool-gray hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-[8px] transition-colors border border-border-gray cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Toolbox Item
const ToolboxItem = ({ tool, addField, getIcon }: { tool: any, addField: any, getIcon: any }) => (
  <button 
    onClick={() => addField(tool.type)}
    className="w-full flex items-center p-2 rounded-[10px] bg-white border border-border-gray hover:border-primary/40 hover:bg-slate-50 transition-colors text-xs text-ink font-semibold group shadow-subtle cursor-pointer"
  >
    <div className="w-7 h-7 rounded-[8px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
      {getIcon(tool.type)}
    </div>
    <span className="ml-2.5 truncate">{tool.label}</span>
    <div className="ml-auto w-5 h-5 rounded-[6px] bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-cool-gray group-hover:text-primary">
      <Plus className="w-3 h-3" />
    </div>
  </button>
);

// Subcomponent: Field Preview Component
const FieldPreview = ({ field }: { field: FormField }) => {
  const commonGlass = "w-full bg-slate-50 border border-border-gray rounded-[8px] flex items-center text-xs text-cool-gray";
  const placeholder = field.placeholder || 'Enter value...';

  switch(field.type) {
    case 'textarea':
      return <div className={`${commonGlass} h-20 p-2.5 items-start`}><span>{placeholder}</span></div>;
    
    case 'select':
      return (
        <div className={`${commonGlass} h-9 px-3 justify-between`}>
          <span className="text-cool-gray">{placeholder || 'Select an option...'}</span>
          <ChevronDown className="w-4 h-4 text-cool-gray" />
        </div>
      );
    
    case 'checkbox':
      return <div className="w-5 h-5 rounded-[6px] border border-border-gray bg-slate-50"></div>;
    
    case 'toggle':
      return (
        <div className="w-9 h-5 rounded-full bg-slate-200 relative flex items-center p-0.5">
          <div className="w-4 h-4 rounded-full bg-white shadow-subtle"></div>
        </div>
      );
    
    case 'radio':
      return (
        <div className="flex space-x-4">
          {(field.options?.length ? field.options.slice(0,3) : ['Option 1', 'Option 2']).map((opt, i) => (
            <div key={i} className="flex items-center space-x-1.5">
              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${i===0 ? 'border-primary' : 'border-border-gray'}`}>
                {i===0 && <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>}
              </div>
              <span className="text-xs text-cool-gray">{opt}</span>
            </div>
          ))}
        </div>
      );

    case 'date':
      return (
        <div className={`${commonGlass} h-9 px-3 justify-between`}>
          <span>{placeholder || 'YYYY-MM-DD'}</span>
          <Calendar className="w-4 h-4 text-cool-gray" />
        </div>
      );
    
    case 'contact':
      return (
        <div className={`${commonGlass} h-9 px-3`}>
          <Mail className="w-4 h-4 text-cool-gray mr-2" />
          <span>{placeholder || 'email@example.com'}</span>
        </div>
      );
    
    case 'file':
      return (
        <div className="w-full h-20 border-2 border-dashed border-border-gray rounded-[10px] bg-slate-50 flex flex-col items-center justify-center text-cool-gray">
          <UploadCloud className="w-5 h-5 mb-1 text-cool-gray" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Drop file here</span>
        </div>
      );

    case 'number':
    case 'text':
    default:
      return (
        <div className={`${commonGlass} h-9 px-3`}>
          <span>{placeholder}</span>
        </div>
      );
  }
};
