'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Download, Upload, Database, Eye, Edit2, Trash2, History } from 'lucide-react';
import { EntityRegistry } from '../types';
import { UniversalTable } from '../../../components/tables/UniversalTable';
import { ColumnDef } from '@tanstack/react-table';
import { SmartForm } from '../../../components/ui/SmartForm';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { HistoryTimeline } from '../../../components/ui/HistoryTimeline';
import { ImportWizard } from '../../../components/ui/ImportWizard';
import { CustomFieldsPanel } from '../../../components/forms/CustomFieldsPanel';
import { api } from '../../../lib/api';
import { exportToCsv } from '../../../lib/exportUtils';
import { useToast } from '../../../components/ui/Toast';

interface EntityViewProps {
  registry: EntityRegistry;
}

export const EntityView: React.FC<EntityViewProps> = ({ registry }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [viewingRecord, setViewingRecord] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customFieldDefs, setCustomFieldDefs] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const { success, error } = useToast();

  const tableColumns = React.useMemo<ColumnDef<any, any>[]>(() => {
    return [
      ...registry.columns.map(c => ({
        accessorKey: c.key,
        header: c.label,
        cell: c.render ? ({ getValue, row }: any) => c.render!(getValue(), row.original) : undefined
      })),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleView(row.original); }} className="p-1.5 text-zinc-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-md transition-colors"><Eye className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }} className="p-1.5 text-zinc-400 hover:text-blue-400 bg-white/5 hover:bg-white/10 rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }} className="p-1.5 text-zinc-400 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); handleHistory(row.original); }} className="p-1.5 text-zinc-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded-md transition-colors"><History className="w-3.5 h-3.5" /></button>
          </div>
        )
      }
    ];
  }, [registry.columns]);

  const buildEndpoint = (suffix = '') => {
    const base = registry.apiEndpoint.replace(/^\/+/, '');
    return suffix ? `${base}${suffix}` : base;
  };

  const normalizeList = (response: any) => {
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response)) return response;
    return [];
  };

  const preparePayload = (raw: any) => {
    const payload: any = {};
    registry.fields.forEach((field) => {
      const value = raw[field.name];
      if (value === '' || value === undefined || value === null) return;
      payload[field.name] = field.type === 'number' ? Number(value) : value;
    });
    return payload;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Assuming all our master data APIs return { data: any[] } or an array directly
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('status', 'ACTIVE'); // Hide deleted (INACTIVE) records
      const query = `?${params.toString()}`;
      
      const res = await api.get(`${buildEndpoint()}${query}`);
      setData(normalizeList(res));

      // Fetch custom fields definitions
      try {
        const customFieldsRes = await api.get(`common/custom-fields/definitions/${registry.id}`);
        setCustomFieldDefs(normalizeList(customFieldsRes));
      } catch (err) {
        console.warn('Could not fetch custom field definitions', err);
      }
    } catch (err: any) {
      console.error(`Failed to fetch ${registry.pluralName}`, err);
      error('Load Failed', err.message || `Failed to load ${registry.pluralName}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [registry.apiEndpoint, searchQuery]);

  const handleCreateNew = () => {
    setEditingRecord(null);
    setCustomFieldValues({});
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setCustomFieldValues(record.customFields || {});
    setIsModalOpen(true);
  };

  const handleHistory = (record: any) => {
    setEditingRecord(record);
    setIsHistoryOpen(true);
  };

  const handleView = (record: any) => {
    setViewingRecord(record);
    setIsViewOpen(true);
  };

  const handleDelete = async (record: any) => {
    if (confirm(`Are you sure you want to archive this ${registry.singularName}?`)) {
      try {
        await api.delete(buildEndpoint(`/${record.id}`));
        success('Record Archived', `Successfully deleted ${registry.singularName}.`);
        fetchData();
      } catch (err: any) {
        error('Deletion Failed', err.message || 'Failed to delete record');
      }
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const payload = preparePayload(formData);
      payload.customFields = customFieldValues;
      
      if (editingRecord) {
        await api.put(buildEndpoint(`/${editingRecord.id}`), payload);
      } else {
        await api.post(buildEndpoint(), payload);
      }
      setIsModalOpen(false);
      success('Success', `Successfully saved ${registry.singularName}.`);
      fetchData();
    } catch (err: any) {
      error('Validation Failed', err.message || 'Validation failed. Please check your inputs.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Dense Entity Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-white/5 shrink-0 bg-white/[0.01] backdrop-blur-2xl gap-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-3 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
            <Database className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{registry.pluralName}</h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              <span>{data.length} Records</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto relative z-10">
          <div className="w-full md:w-56 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
            <div className="relative">
              <Input 
                placeholder={`Search...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-3.5 w-3.5" />}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
          <button onClick={fetchData} title="Refresh" className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => exportToCsv(registry.id, data, registry.columns)} title="Export CSV" className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setIsImportOpen(true)} title="Import CSV" className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors">
            <Upload className="h-3.5 w-3.5" />
          </button>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <button onClick={handleCreateNew} className="relative bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        <UniversalTable 
          columns={tableColumns} 
          data={data} 
          isLoading={isLoading} 
          onRowClick={handleView}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? `Edit ${registry.singularName}` : `Create ${registry.singularName}`}
        maxWidth="2xl"
      >
        <SmartForm
          fields={registry.fields}
          initialData={editingRecord}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        >
          <CustomFieldsPanel
            module={registry.id}
            definitions={customFieldDefs}
            values={customFieldValues}
            onChange={setCustomFieldValues}
          />
        </SmartForm>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`${registry.singularName} Details`}
        maxWidth="2xl"
      >
        {viewingRecord && (
          <div className="space-y-8 max-h-[70vh] overflow-y-auto hide-scrollbar pr-2 pb-4">
            <div className="relative">
              <h4 className="text-[11px] font-semibold text-emerald-400/90 uppercase tracking-widest mb-4 flex items-center">
                Primary Details
              </h4>
              <div className="space-y-1">
                {registry.columns.map(col => (
                  <div key={col.key} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-2.5 pt-2.5 first:pt-0 last:border-0 last:pb-0 hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors">
                    <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide flex items-center">{col.label}</div>
                    <div className="col-span-2 text-sm text-white font-medium flex items-center">
                      {col.render ? col.render(viewingRecord[col.key], viewingRecord) : viewingRecord[col.key] || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative pt-8 border-t border-white/5">
              <h4 className="text-[11px] font-semibold text-emerald-400/90 uppercase tracking-widest mb-4 flex items-center">
                All Data Fields
              </h4>
              <div className="space-y-1">
                {registry.fields.map(field => (
                  <div key={field.name} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-2.5 pt-2.5 first:pt-0 last:border-0 last:pb-0 hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-colors">
                    <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide flex items-center">{field.label}</div>
                    <div className="col-span-2 text-sm text-white font-medium flex items-center">
                      {viewingRecord[field.name] !== undefined && viewingRecord[field.name] !== null && viewingRecord[field.name] !== '' 
                        ? (typeof viewingRecord[field.name] === 'boolean' 
                            ? (viewingRecord[field.name] ? <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] shadow-[inset_0_1px_2px_rgba(16,185,129,0.2)]">Yes</span> : <span className="text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">No</span>) 
                            : viewingRecord[field.name])
                        : <span className="text-slate-600">-</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Modal */}
      <ImportWizard
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        registry={registry}
        onSuccess={() => {
          setIsImportOpen(false);
          fetchData();
        }}
      />

      {/* History Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Audit History: ${editingRecord?.name || editingRecord?.customerCode || editingRecord?.vendorName || registry.singularName}`}
        maxWidth="md"
      >
        <HistoryTimeline 
          events={[
            { id: '1', action: 'CREATED', timestamp: editingRecord?.createdAt || new Date().toISOString(), user: editingRecord?.createdBy || 'SystemAdmin' },
            { id: '2', action: 'UPDATED', timestamp: editingRecord?.updatedAt || new Date().toISOString(), user: editingRecord?.updatedBy || 'SystemAdmin', details: 'Updated core details' }
          ]} 
        />
      </Modal>
    </div>
  );
};

