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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-white/10 shrink-0 bg-white/5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center">
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mr-3 border border-blue-500/20">
              <Database className="w-4 h-4" />
            </span>
            {registry.pluralName}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage all {registry.pluralName.toLowerCase()} in the master database.</p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Input 
              placeholder={`Search...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button variant="ghost" onClick={fetchData} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={() => exportToCsv(registry.id, data, registry.columns)} title="Export CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={() => setIsImportOpen(true)} title="Import CSV">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="primary" onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />}>
            New
          </Button>
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
            <div className="bg-[#0B1018]/30 p-6 rounded-xl border border-white/5 space-y-4">
              {registry.columns.map(col => (
                <div key={col.key} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{col.label}</div>
                  <div className="col-span-2 text-sm text-white">
                    {col.render ? col.render(viewingRecord[col.key], viewingRecord) : viewingRecord[col.key] || '-'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-[#0B1018]/30 p-6 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">All Data Fields</h4>
              {registry.fields.map(field => (
                <div key={field.name} className="grid grid-cols-3 gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{field.label}</div>
                  <div className="col-span-2 text-sm text-white">
                    {viewingRecord[field.name] !== undefined && viewingRecord[field.name] !== null && viewingRecord[field.name] !== '' 
                      ? (typeof viewingRecord[field.name] === 'boolean' 
                          ? (viewingRecord[field.name] ? 'Yes' : 'No') 
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
