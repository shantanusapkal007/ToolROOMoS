import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Download, Upload, Database } from 'lucide-react';
import { EntityRegistry } from '../types';
import { SmartTable } from '../../../components/ui/SmartTable';
import { SmartForm } from '../../../components/ui/SmartForm';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { HistoryTimeline } from '../../../components/ui/HistoryTimeline';
import { ImportWizard } from '../../../components/ui/ImportWizard';
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
  const { success, error } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Assuming all our master data APIs return { data: any[] } or an array directly
      const res = await api.get(`${registry.apiEndpoint}?search=${searchQuery}`);
      setData(res.data?.data || res.data || []);
    } catch (err: any) {
      console.error(`Failed to fetch ${registry.pluralName}`, err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [registry.apiEndpoint, searchQuery]);

  const handleCreateNew = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
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
        await api.delete(`${registry.apiEndpoint}/${record.id}`);
        success('Record Archived', `Successfully deleted ${registry.singularName}.`);
        fetchData();
      } catch (err: any) {
        error('Deletion Failed', err.message || 'Failed to delete record');
      }
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingRecord) {
        await api.put(`${registry.apiEndpoint}/${editingRecord.id}`, formData);
      } else {
        await api.post(registry.apiEndpoint, formData);
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
      {/* Entity Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-white/5 shrink-0 bg-[#050A14]/80 backdrop-blur-2xl gap-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center mb-1">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-4 border border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]">
              <Database className="w-5 h-5" />
            </span>
            {registry.pluralName}
          </h2>
          <div className="flex items-center space-x-3 text-sm text-slate-400 ml-[56px]">
            <p>Manage all {registry.pluralName.toLowerCase()} in the master database.</p>
            <span className="text-white/20">·</span>
            <span className="bg-white/5 px-2 py-0.5 rounded text-emerald-400 font-mono text-xs font-bold border border-white/10">
              {data.length} Records
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto relative z-10">
          <div className="w-full md:w-64 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
            <div className="relative">
              <Input 
                placeholder={`Search ${registry.pluralName}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
          <Button variant="ghost" onClick={fetchData} title="Refresh" className="hover:text-emerald-400 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={() => exportToCsv(registry.id, data, registry.columns)} title="Export CSV" className="hover:border-emerald-500/30 transition-colors">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={() => setIsImportOpen(true)} title="Import CSV" className="hover:border-emerald-500/30 transition-colors">
            <Upload className="h-4 w-4" />
          </Button>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <Button variant="primary" onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />} className="relative border-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide">
              New {registry.singularName}
            </Button>
          </div>
        </div>
      </div>

      {/* Entity Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <SmartTable 
          columns={registry.columns} 
          data={data} 
          isLoading={isLoading} 
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onHistory={handleHistory}
        />
      </div>

      {/* Form Modal */}
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
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`${registry.singularName} Details`}
        maxWidth="2xl"
      >
        {viewingRecord && (
          <div className="space-y-6">
            <div className="bg-[#0B1018]/60 p-6 rounded-2xl border border-white/5 space-y-4 shadow-inner hover:border-emerald-500/20 transition-colors">
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Primary Details</h4>
              {registry.columns.map(col => (
                <div key={col.key} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0 hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">{col.label}</div>
                  <div className="col-span-2 text-sm text-white font-medium">
                    {col.render ? col.render(viewingRecord[col.key], viewingRecord) : viewingRecord[col.key] || '-'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-[#0B1018]/60 p-6 rounded-2xl border border-white/5 space-y-4 shadow-inner hover:border-emerald-500/20 transition-colors">
              <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">All Data Fields</h4>
              {registry.fields.map(field => (
                <div key={field.name} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0 hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-colors">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">{field.label}</div>
                  <div className="col-span-2 text-sm text-white">
                    {viewingRecord[field.name] !== undefined && viewingRecord[field.name] !== null && viewingRecord[field.name] !== '' 
                      ? (typeof viewingRecord[field.name] === 'boolean' 
                          ? (viewingRecord[field.name] ? <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">Yes</span> : <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded font-bold">No</span>) 
                          : viewingRecord[field.name])
                      : '-'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setIsViewOpen(false)} variant="secondary">Close</Button>
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
