import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { EntityRegistry } from '../types';
import { SmartTable } from '../../../components/ui/SmartTable';
import { SmartForm } from '../../../components/ui/SmartForm';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { HistoryTimeline } from '../../../components/ui/HistoryTimeline';
import { api } from '../../../lib/api';
import { exportToCsv } from '../../../lib/exportUtils';
import { Download, Upload } from 'lucide-react';

interface EntityViewProps {
  registry: EntityRegistry;
}

export const EntityView: React.FC<EntityViewProps> = ({ registry }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDelete = async (record: any) => {
    if (confirm(`Are you sure you want to archive this ${registry.singularName}?`)) {
      try {
        await api.delete(`${registry.apiEndpoint}/${record.id}`);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete record');
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
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Validation failed. Please check your inputs.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Entity Toolbar */}
      <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
        <div className="w-72">
          <Input 
            placeholder={`Search ${registry.pluralName}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" onClick={fetchData} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={() => exportToCsv(registry.id, data, registry.columns)} leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="secondary" onClick={() => alert('Import Wizard coming soon.')} leftIcon={<Upload className="h-4 w-4" />}>
            Import
          </Button>
          <Button variant="primary" onClick={handleCreateNew} leftIcon={<Plus className="h-4 w-4" />}>
            New {registry.singularName}
          </Button>
        </div>
      </div>

      {/* Entity Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <SmartTable 
          columns={registry.columns} 
          data={data} 
          isLoading={isLoading} 
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
