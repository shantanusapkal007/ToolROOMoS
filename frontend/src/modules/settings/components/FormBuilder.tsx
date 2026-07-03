import React, { useState } from 'react';
import { Layout, Plus, Save, Settings, Type, Hash, List, CheckSquare, AlignLeft, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

interface FormField {
  id: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  label: string;
  required: boolean;
}

const initialFields: FormField[] = [
  { id: '1', type: 'text', label: 'Company Name', required: true },
  { id: '2', type: 'select', label: 'Industry', required: false },
  { id: '3', type: 'textarea', label: 'Description', required: false },
];

export const FormBuilder = () => {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [activeForm, setActiveForm] = useState('Customers');
  const [isSaving, setIsSaving] = useState(false);

  const addField = (type: FormField['type']) => {
    setFields([...fields, { id: Date.now().toString(), type, label: 'New Field', required: false }]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Form schema saved successfully!');
    }, 1000);
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'text': return <Type className="w-4 h-4 text-blue-400" />;
      case 'number': return <Hash className="w-4 h-4 text-emerald-400" />;
      case 'select': return <List className="w-4 h-4 text-purple-400" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4 text-orange-400" />;
      case 'textarea': return <AlignLeft className="w-4 h-4 text-slate-400" />;
      default: return <Type className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mr-4 border border-pink-500/20">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Form Builder</h2>
            <p className="text-sm text-slate-400">Dynamically configure fields for master data entities.</p>
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
          <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave} isLoading={isSaving}>
            Save Schema
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Toolbox */}
        <div className="w-64 border-r border-white/10 bg-[#0B1018]/30 p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Add Field</h3>
          <div className="space-y-2">
            {[
              { type: 'text', label: 'Text Input' },
              { type: 'number', label: 'Number Input' },
              { type: 'select', label: 'Dropdown' },
              { type: 'textarea', label: 'Long Text' },
              { type: 'checkbox', label: 'Checkbox' },
            ].map(tool => (
              <button 
                key={tool.type}
                onClick={() => addField(tool.type as FormField['type'])}
                className="w-full flex items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm text-slate-300 hover:text-white group"
              >
                {getIconForType(tool.type)}
                <span className="ml-3 font-medium">{tool.label}</span>
                <Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 p-8 overflow-y-auto hide-scrollbar bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_100%)] relative">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#0B1018]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),_inset_0_1px_0_rgba(255,255,255,0.05)] min-h-[500px]">
              
              <div className="mb-8 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">Preview: {activeForm}</h3>
                <p className="text-sm text-slate-400">Live preview of your dynamic form layout.</p>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="group relative flex items-start p-4 -mx-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                    {/* Drag Handle */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-move p-1 text-slate-500 hover:text-white transition-opacity">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    {/* Field Preview */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-full">
                          <Input 
                            value={field.label} 
                            onChange={(e) => updateField(field.id, { label: e.target.value })} 
                            className="!bg-transparent !border-transparent hover:!border-white/10 focus:!bg-[#050A14]/95 !px-2 !py-1 -ml-2 font-semibold text-sm text-slate-300 w-auto inline-block"
                          />
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                      </div>
                      
                      {/* Mock Input Field based on type */}
                      <div className="pointer-events-none opacity-80">
                        {field.type === 'textarea' ? (
                          <div className="w-full bg-[#050A14]/95 border border-white/10 rounded-xl h-24 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
                        ) : field.type === 'select' ? (
                          <div className="w-full bg-[#050A14]/95 border border-white/10 rounded-xl h-[42px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] flex items-center px-4 justify-between">
                            <span className="text-slate-500 text-sm">Select an option...</span>
                            <List className="w-4 h-4 text-slate-500" />
                          </div>
                        ) : field.type === 'checkbox' ? (
                          <div className="w-6 h-6 rounded-md border border-white/10 bg-[#050A14]/95 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"></div>
                        ) : (
                          <div className="w-full bg-[#050A14]/95 border border-white/10 rounded-xl h-[42px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] flex items-center px-4">
                            <span className="text-slate-600 text-sm">Text input...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Field Controls */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center space-x-2 transition-opacity bg-[#0B1018] p-2 rounded-lg border border-white/10 shadow-xl">
                      <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-400 hover:text-white mr-2 border-r border-white/10 pr-4">
                        <input 
                          type="checkbox" 
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 w-3 h-3"
                        />
                        <span>Required</span>
                      </label>
                      <button 
                        onClick={() => removeField(field.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Layout className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Blank Canvas</h3>
                    <p className="text-slate-400 max-w-sm">Drag and drop field types from the left sidebar to start building this form.</p>
                  </div>
                )}
              </div>
              
              {fields.length > 0 && (
                <div className="mt-12 pt-6 border-t border-white/10 flex justify-end space-x-3">
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="primary">Submit Form</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
