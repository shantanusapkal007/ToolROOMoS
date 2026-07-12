import React, { useState } from 'react';
import { Layout, Plus, Save, Settings, Type, Hash, List, CheckSquare, AlignLeft, GripVertical, Trash2, Calendar, ToggleLeft, CircleDot, Mail, UploadCloud, X, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
      const res = await fetch(`http://localhost:3000/api/v1/settings/forms/${activeForm}`);
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
      const res = await fetch('http://localhost:3000/api/v1/settings/forms', {
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
      success('Schema Saved', 'Advanced form schema saved successfully to database!');
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
      case 'text': return <Type className="w-4 h-4 text-blue-400" />;
      case 'number': return <Hash className="w-4 h-4 text-emerald-400" />;
      case 'select': return <List className="w-4 h-4 text-purple-400" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4 text-orange-400" />;
      case 'textarea': return <AlignLeft className="w-4 h-4 text-slate-400" />;
      case 'date': return <Calendar className="w-4 h-4 text-rose-400" />;
      case 'toggle': return <ToggleLeft className="w-4 h-4 text-green-400" />;
      case 'radio': return <CircleDot className="w-4 h-4 text-indigo-400" />;
      case 'contact': return <Mail className="w-4 h-4 text-yellow-400" />;
      case 'file': return <UploadCloud className="w-4 h-4 text-cyan-400" />;
      default: return <Type className="w-4 h-4 text-blue-400" />;
    }
  };

  const editingField = fields.find(f => f.id === editingFieldId);

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-md relative z-20">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mr-4 border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Advanced Form Builder</h2>
            <p className="text-sm text-slate-400">Design dynamic, responsive data entry schemas.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Select 
            value={activeForm}
            onChange={(e) => setActiveForm(e.target.value)}
            options={[
              { label: 'Customers Form', value: 'Customers' },
              { label: 'Vendors Form', value: 'Vendors' },
              { label: 'Materials Form', value: 'Materials' },
            ]}
          />
          <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={saveMutation.isPending}>
            Save Schema
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex relative z-10">
        {/* Left Sidebar - Toolbox */}
        <div className="w-64 border-r border-white/10 bg-[#050A14]/90 backdrop-blur-xl p-6 flex flex-col overflow-y-auto hide-scrollbar z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Input Elements</h3>
          <div className="space-y-2 mb-8">
            {[
              { type: 'text', label: 'Short Text' },
              { type: 'textarea', label: 'Long Text' },
              { type: 'number', label: 'Number' },
              { type: 'contact', label: 'Contact Info' },
            ].map(tool => (
              <ToolboxItem key={tool.type} tool={tool} addField={addField} getIcon={getIconForType} />
            ))}
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Selection</h3>
          <div className="space-y-2 mb-8">
            {[
              { type: 'select', label: 'Dropdown' },
              { type: 'radio', label: 'Radio Choice' },
              { type: 'checkbox', label: 'Checkbox' },
              { type: 'toggle', label: 'Toggle Switch' },
            ].map(tool => (
              <ToolboxItem key={tool.type} tool={tool} addField={addField} getIcon={getIconForType} />
            ))}
          </div>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Advanced</h3>
          <div className="space-y-2">
            {[
              { type: 'date', label: 'Date Picker' },
              { type: 'file', label: 'File Upload' },
            ].map(tool => (
              <ToolboxItem key={tool.type} tool={tool} addField={addField} getIcon={getIconForType} />
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 p-8 overflow-y-auto hide-scrollbar bg-[#02050A] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_100%)] relative">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#0B1018]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.05)] min-h-[600px] relative overflow-hidden transition-all duration-500">
              
              {/* Canvas Ambient Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="mb-8 border-b border-white/10 pb-4 relative z-10">
                <h3 className="text-2xl font-black text-white tracking-tight">{activeForm}</h3>
                <p className="text-sm text-slate-400 font-medium">Drag, drop, and configure fields for this entity.</p>
              </div>

              <div className="flex flex-wrap -mx-3 relative z-10">
                {isLoading ? (
                  <div className="w-full flex flex-col items-center justify-center py-24">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading Schema from Database...</p>
                  </div>
                ) : fields.length === 0 ? (
                  <div className="w-full text-center py-24 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center bg-white/[0.01]">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/10">
                      <Layout className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Blank Canvas</h3>
                    <p className="text-slate-400 max-w-sm font-medium leading-relaxed">Drag and drop premium field types from the left sidebar to start building this entity schema.</p>
                  </div>
                ) : (
                  fields.map((field) => {
                    const isEditing = editingFieldId === field.id;
                    const isHalf = field.width === 'half';
                    
                    return (
                      <div key={field.id} className={`p-3 transition-all duration-300 ${isHalf ? 'w-1/2' : 'w-full'}`}>
                        <div className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${isEditing ? 'bg-white/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.01]' : 'bg-[#050A14]/60 border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
                          
                          {/* Drag Handle */}
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-move p-1.5 text-slate-500 hover:text-white transition-opacity bg-[#0B1018] rounded-lg border border-white/10 shadow-lg z-20">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          {/* Field Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getIconForType(field.type)}
                              <Input 
                                value={field.label} 
                                onChange={(e) => updateField(field.id, { label: e.target.value })} 
                                className="!bg-transparent !border-transparent hover:!border-white/10 focus:!bg-[#050A14]/95 !px-2 !py-0.5 -ml-2 font-bold text-sm text-white w-auto inline-block transition-colors"
                              />
                              {field.required && <span className="text-red-500 font-bold">*</span>}
                            </div>
                          </div>
                          
                          {/* Field Mock UI */}
                          <div className="pointer-events-none opacity-90 transition-opacity">
                            <FieldPreview field={field} />
                          </div>

                          {field.helpText && (
                            <div className="mt-2 flex items-start text-[10px] text-slate-500">
                              <HelpCircle className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                              {field.helpText}
                            </div>
                          )}

                          {/* Hover Controls */}
                          <div className={`absolute right-4 top-4 flex items-center space-x-1 transition-opacity bg-[#0B1018]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl z-20 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button 
                              onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                              className={`p-1.5 rounded-lg transition-colors flex items-center ${isEditing ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button 
                              onClick={() => removeField(field.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {fields.length > 0 && (
                <div className="mt-12 pt-6 border-t border-white/10 flex justify-end space-x-4 relative z-10">
                  <Button variant="ghost" onClick={() => setFields([])}>Clear Canvas</Button>
                  <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={saveMutation.isPending}>Deploy Schema</Button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Sidebar - Field Settings Panel (Slide Over) */}
        <div className={`absolute top-0 right-0 h-full w-80 bg-[#050A14]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-10px_0_50px_rgba(0,0,0,0.5)] z-40 transition-transform duration-500 flex flex-col ${editingFieldId ? 'translate-x-0' : 'translate-x-full'}`}>
          {editingField && (
            <>
              <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Field Settings</h3>
                </div>
                <button onClick={() => setEditingFieldId(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 hide-scrollbar">
                
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Field Label</label>
                    <Input 
                      value={editingField.label} 
                      onChange={(e) => updateField(editingField.id, { label: e.target.value })} 
                      className="w-full text-sm"
                    />
                  </div>

                  {['text', 'number', 'textarea', 'contact', 'date'].includes(editingField.type) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Placeholder</label>
                      <Input 
                        value={editingField.placeholder || ''} 
                        onChange={(e) => updateField(editingField.id, { placeholder: e.target.value })} 
                        placeholder="e.g. Enter value..."
                        className="w-full text-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Help Text</label>
                    <Input 
                      value={editingField.helpText || ''} 
                      onChange={(e) => updateField(editingField.id, { helpText: e.target.value })} 
                      placeholder="Appears below the input..."
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                {/* Validation Settings */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Validation & Layout</h4>
                  
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
                    <span className="text-sm font-medium text-slate-300">Required Field</span>
                    <input 
                      type="checkbox" 
                      checked={editingField.required}
                      onChange={(e) => updateField(editingField.id, { required: e.target.checked })}
                      className="rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500/50 w-4 h-4"
                    />
                  </label>

                  <div className="space-y-1.5 mt-4">
                    <label className="text-xs font-medium text-slate-300">Field Width</label>
                    <div className="flex p-1 bg-black/50 rounded-lg border border-white/5">
                      <button 
                        onClick={() => updateField(editingField.id, { width: 'full' })}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${editingField.width !== 'half' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Full
                      </button>
                      <button 
                        onClick={() => updateField(editingField.id, { width: 'half' })}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${editingField.width === 'half' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Half
                      </button>
                    </div>
                  </div>
                </div>

                {/* Options (For Select & Radio) */}
                {['select', 'radio'].includes(editingField.type) && (
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      Options
                      <button 
                        onClick={() => {
                          const currentOptions = editingField.options || [];
                          updateField(editingField.id, { options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
                        }}
                        className="text-blue-400 hover:text-blue-300 flex items-center bg-blue-500/10 px-2 py-0.5 rounded"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </button>
                    </h4>
                    
                    <div className="space-y-2">
                      {(editingField.options || []).map((opt, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Input 
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(editingField.options || [])];
                              newOpts[i] = e.target.value;
                              updateField(editingField.id, { options: newOpts });
                            }}
                            className="flex-1 text-sm bg-black/40"
                          />
                          <button 
                            onClick={() => {
                              const newOpts = [...(editingField.options || [])];
                              newOpts.splice(i, 1);
                              updateField(editingField.id, { options: newOpts });
                            }}
                            className="p-2 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors border border-white/5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!editingField.options || editingField.options.length === 0) && (
                        <p className="text-xs text-slate-500 italic">No options defined.</p>
                      )}
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
    className="w-full flex items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/20 transition-all duration-300 text-sm text-slate-300 hover:text-white group hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5"
  >
    <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center shadow-inner group-hover:bg-white/5 transition-colors">
      {getIcon(tool.type)}
    </div>
    <span className="ml-3 font-semibold tracking-wide">{tool.label}</span>
    <div className="ml-auto w-6 h-6 rounded-md bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <Plus className="w-3.5 h-3.5" />
    </div>
  </button>
);

// Subcomponent: Field Preview Component
const FieldPreview = ({ field }: { field: FormField }) => {
  const commonGlass = "w-full bg-[#050A14]/90 border border-white/10 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] flex items-center";
  const placeholder = field.placeholder || 'Enter value...';

  switch(field.type) {
    case 'textarea':
      return <div className={`${commonGlass} h-24 p-3 items-start`}><span className="text-slate-600 text-sm">{placeholder}</span></div>;
    
    case 'select':
      return (
        <div className={`${commonGlass} h-11 px-4 justify-between`}>
          <span className="text-slate-500 text-sm font-medium">{placeholder || 'Select an option...'}</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      );
    
    case 'checkbox':
      return <div className="w-6 h-6 rounded-md border-2 border-white/20 bg-black/50 shadow-inner"></div>;
    
    case 'toggle':
      return (
        <div className="w-12 h-6 rounded-full bg-black/50 border border-white/10 relative shadow-inner flex items-center p-0.5">
          <div className="w-5 h-5 rounded-full bg-slate-400 shadow-md"></div>
        </div>
      );
    
    case 'radio':
      return (
        <div className="flex space-x-6">
          {(field.options?.length ? field.options.slice(0,3) : ['Option 1', 'Option 2']).map((opt, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i===0 ? 'border-blue-500' : 'border-white/20'}`}>
                {i===0 && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
              </div>
              <span className="text-sm text-slate-300 font-medium">{opt}</span>
            </div>
          ))}
          {(field.options?.length || 0) > 3 && <span className="text-slate-500 text-sm">+{field.options!.length - 3} more</span>}
        </div>
      );

    case 'date':
      return (
        <div className={`${commonGlass} h-11 px-4 justify-between`}>
          <span className="text-slate-600 text-sm">{placeholder || 'YYYY-MM-DD'}</span>
          <Calendar className="w-4 h-4 text-slate-600" />
        </div>
      );
    
    case 'contact':
      return (
        <div className={`${commonGlass} h-11 px-4`}>
          <Mail className="w-4 h-4 text-slate-600 mr-3" />
          <span className="text-slate-600 text-sm">{placeholder || 'email@example.com'}</span>
        </div>
      );
    
    case 'file':
      return (
        <div className="w-full h-24 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-slate-500">
          <UploadCloud className="w-6 h-6 mb-2 text-slate-600" />
          <span className="text-xs font-medium uppercase tracking-widest">Drop file here</span>
        </div>
      );

    case 'number':
    case 'text':
    default:
      return (
        <div className={`${commonGlass} h-11 px-4`}>
          <span className="text-slate-600 text-sm">{placeholder}</span>
        </div>
      );
  }
};
