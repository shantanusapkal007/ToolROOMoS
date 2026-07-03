import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { EntityRegistry, EntityField } from '../../modules/settings/types';
import { api } from '../../lib/api';

interface ImportWizardProps {
  isOpen: boolean;
  registry: EntityRegistry;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ isOpen, registry, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<{row: number, message: string}[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    // Generate CSV header based on registry fields
    const headers = registry.fields.map(f => f.name);
    const csvContent = headers.join(',') + '\n';
    
    // Provide a dummy row as example
    const dummyRow = registry.fields.map(f => {
      if (f.type === 'select' && f.options) return f.options[0].value;
      if (f.type === 'number') return '0';
      return `Sample ${f.label}`;
    }).join(',');

    const blob = new Blob([csvContent + dummyRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${registry.id}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateData(results.data);
      },
      error: (error) => {
        setErrors([{ row: 0, message: `Failed to parse CSV: ${error.message}` }]);
        setStep(3);
      }
    });
  };

  const validateData = (data: any[]) => {
    const validationErrors: {row: number, message: string}[] = [];
    
    const validatedData = data.map((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header row
      const validatedRow: any = {};
      
      registry.fields.forEach(field => {
        const val = row[field.name];
        
        // Required check
        if (field.required && (!val || val.trim() === '')) {
          validationErrors.push({ row: rowNum, message: `Missing required field: ${field.name}` });
        }
        
        // Ensure values match expected options for selects
        if (field.type === 'select' && field.options && val) {
          const isValidOption = field.options.some(opt => opt.value === val);
          if (!isValidOption) {
            validationErrors.push({ row: rowNum, message: `Invalid value for ${field.name}: '${val}'. Expected one of: ${field.options.map(o => o.value).join(', ')}` });
          }
        }
        
        // Number coercion
        if (field.type === 'number' && val) {
          const num = Number(val);
          if (isNaN(num)) {
            validationErrors.push({ row: rowNum, message: `Invalid number for ${field.name}: '${val}'` });
          } else {
            validatedRow[field.name] = num;
            return;
          }
        }

        validatedRow[field.name] = val;
      });
      return validatedRow;
    });

    setParsedData(validatedData);
    setErrors(validationErrors);
    setStep(3);
  };

  const handleImport = async () => {
    if (errors.length > 0) return;
    
    setIsImporting(true);
    setProgress({ current: 0, total: parsedData.length });

    // Batch import: Send individual POST requests using Promise.all in chunks to prevent server overload
    const chunkSize = 10;
    let successCount = 0;
    const importErrors: {row: number, message: string}[] = [];

    for (let i = 0; i < parsedData.length; i += chunkSize) {
      const chunk = parsedData.slice(i, i + chunkSize);
      
      const promises = chunk.map(async (record, index) => {
        try {
          await api.post(`/api/v1${registry.apiEndpoint}`, record);
          successCount++;
          setProgress(p => ({ ...p, current: successCount }));
        } catch (err: any) {
          const rowNum = i + index + 2;
          importErrors.push({ 
            row: rowNum, 
            message: err.response?.data?.message || 'Server error during import'
          });
        }
      });

      await Promise.all(promises);
    }

    setIsImporting(false);

    if (importErrors.length > 0) {
      setErrors(importErrors);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="glass-panel w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-blue-400" />
              Import {registry.pluralName}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Bulk upload records via CSV</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-800 -z-10 -translate-y-1/2"></div>
            {[
              { num: 1, label: 'Template' },
              { num: 2, label: 'Upload' },
              { num: 3, label: 'Verify' }
            ].map(s => (
              <div key={s.num} className={`flex flex-col items-center ${step >= s.num ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${
                  step >= s.num ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400'
                }`}>
                  {s.num}
                </div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Download CSV Template</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Start by downloading the official template. It contains all the required column headers for {registry.pluralName}.
              </p>
              <button 
                onClick={() => { handleDownloadTemplate(); setStep(2); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Download Template
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Data</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Upload your completed CSV file. We'll validate the data before importing.
              </p>
              
              <input 
                type="file" 
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg border border-slate-700 font-medium transition-colors"
              >
                Select CSV File
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Validation Results</h3>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300 border border-slate-700">
                  {parsedData.length} records found
                </span>
              </div>

              {errors.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-red-400 font-semibold mb-3">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Found {errors.length} validation error(s)
                  </div>
                  <ul className="space-y-2 text-sm text-red-300 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {errors.map((err, i) => (
                      <li key={i} className="flex items-start">
                        <span className="w-16 shrink-0 font-mono text-red-400/70">Row {err.row}:</span>
                        <span>{err.message}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-red-500/20">
                    <button 
                      onClick={() => setStep(2)}
                      className="text-sm font-medium text-red-400 hover:text-red-300"
                    >
                      ← Upload a corrected file
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6 mb-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-emerald-400 font-semibold text-lg mb-1">Ready to Import</h4>
                  <p className="text-emerald-300/70 text-sm">All {parsedData.length} records passed validation.</p>
                </div>
              )}

              {/* Data Preview */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64 custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800/50 text-slate-400 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-4 py-3 font-medium">Row</th>
                        {registry.fields.map(f => (
                          <th key={f.name} className="px-4 py-3 font-medium">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 text-slate-300">
                          <td className="px-4 py-2 font-mono text-slate-500">{i + 2}</td>
                          {registry.fields.map(f => (
                            <td key={f.name} className="px-4 py-2">{row[f.name]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 5 && (
                  <div className="bg-slate-800/30 text-center py-2 text-xs font-medium text-slate-500 border-t border-slate-800">
                    Showing 5 of {parsedData.length} records
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="px-5 py-2.5 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          {step === 3 && errors.length === 0 && (
            <button 
              onClick={handleImport}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing ({progress.current}/{progress.total})
                </>
              ) : (
                'Start Import'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
