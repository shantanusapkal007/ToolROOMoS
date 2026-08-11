import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Download, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { EntityRegistry, EntityField } from '../../modules/settings/types';
import { api } from '../../lib/api';
import { Button } from './Button';
import { Modal } from './Modal';

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
    const headers = registry.fields.map(f => f.name);
    const csvContent = headers.join(',') + '\n';
    
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
    const newErrors: {row: number, message: string}[] = [];
    const validRows: any[] = [];

    data.forEach((row, idx) => {
      let isRowValid = true;
      const rowNum = idx + 2;

      registry.fields.forEach(field => {
        const val = row[field.name];
        
        if (field.required && (val === undefined || val === null || val === '')) {
          newErrors.push({ row: rowNum, message: `Missing required field: ${field.label}` });
          isRowValid = false;
        }

        if (val && field.type === 'number' && isNaN(Number(val))) {
          newErrors.push({ row: rowNum, message: `Field ${field.label} must be a valid number` });
          isRowValid = false;
        }
      });

      if (isRowValid) {
        validRows.push(row);
      }
    });

    setParsedData(validRows);
    setErrors(newErrors);
    setStep(3);
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    setProgress({ current: 0, total: parsedData.length });

    const endpoint = registry.apiEndpoint || `/master-data/${registry.id}`;
    const batchSize = 10;
    const importErrors: {row: number, message: string}[] = [];

    for (let i = 0; i < parsedData.length; i += batchSize) {
      const chunk = parsedData.slice(i, i + batchSize);
      
      const promises = chunk.map(async (item, idx) => {
        const rowNum = i + idx + 2;
        try {
          await api.post(endpoint, item);
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        } catch (err: any) {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import ${registry.pluralName}`}
      subtitle="Bulk upload records via CSV template"
      maxWidth="xl"
    >
      <div className="space-y-6">
        
        {/* Stepper */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
          {[
            { num: 1, label: 'Download Template' },
            { num: 2, label: 'Upload CSV File' },
            { num: 3, label: 'Verify & Confirm' }
          ].map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-micro font-semibold border ${
                step >= s.num ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
              }`}>
                {s.num}
              </div>
              <span className={`text-caption font-semibold ${step >= s.num ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 bg-primary-subtle border border-blue-200 rounded-full flex items-center justify-center mx-auto text-primary">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-section-title font-semibold text-zinc-900">Download CSV Template</h3>
            <p className="text-caption text-zinc-500 max-w-md mx-auto">
              Download the official template pre-formatted with column headers for {registry.pluralName}.
            </p>
            <div className="pt-2">
              <Button 
                onClick={() => { handleDownloadTemplate(); setStep(2); }}
              >
                <Download className="w-4 h-4" />
                <span>Download Template & Proceed</span>
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center py-8 space-y-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-lg p-8 cursor-pointer transition-colors max-w-md mx-auto bg-zinc-50"
            >
              <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <p className="text-caption font-semibold text-zinc-800">Click to Select CSV File</p>
              <p className="text-micro text-zinc-400 mt-1">Supports standard CSV spreadsheets</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="white" onClick={() => setStep(1)}>Back</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-3 rounded-[12px]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-caption font-semibold text-zinc-800">{parsedData.length} Valid Records Ready</span>
              </div>
              {errors.length > 0 && (
                <div className="flex items-center gap-1.5 text-red-600 text-caption font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.length} Errors Found</span>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-red-200 bg-red-50/50 rounded-[12px] p-3 space-y-1">
                <p className="text-micro font-semibold text-red-700 uppercase">Validation Warnings:</p>
                {errors.map((err, i) => (
                  <div key={i} className="text-caption text-red-600">
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}

            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-caption font-semibold text-zinc-700">
                  <span>Importing Records...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all" 
                    style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
              <Button variant="white" onClick={() => setStep(2)} disabled={isImporting}>Re-upload</Button>
              <Button 
                onClick={handleExecuteImport} 
                disabled={isImporting || parsedData.length === 0}
              >
                {isImporting ? 'Importing Records...' : `Confirm & Import ${parsedData.length} Records`}
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
