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
  const [deletingRecord, setDeletingRecord] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { success, error } = useToast();

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
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('status', 'ACTIVE');
      const query = `?${params.toString()}`;
      
      const res = await api.get(`${buildEndpoint()}${query}`);
      setData(normalizeList(res));
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

  const handleDelete = (record: any) => {
    setDeletingRecord(record);
  };

  const confirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      await api.delete(buildEndpoint(`/${deletingRecord.id}`));
      success('Record Archived', `Successfully archived ${registry.singularName}.`);
      setDeletingRecord(null);
      fetchData();
    } catch (err: any) {
      error('Deletion Failed', err.message || 'Failed to archive record.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      const payload = preparePayload(formData);
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
    <div className="h-full flex flex-col bg-white">
      {/* Dense Entity Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-border-gray shrink-0 bg-white gap-4">
        <div className="flex items-center">
          <span className="w-9 h-9 rounded-[10px] bg-primary text-white flex items-center justify-center mr-3 shadow-subtle">
            <Database className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight leading-tight">{registry.pluralName}</h2>
            <div className="flex items-center space-x-2 text-small font-medium text-silver-blue font-mono mt-0.5">
              <span>{data.length} Records</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-full md:w-64">
            <Input 
              placeholder={`Search ${registry.pluralName.toLowerCase()}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-silver-blue" />}
              className="py-2 text-caption"
            />
          </div>
          
          <Button 
            variant="white" 
            size="sm" 
            onClick={fetchData} 
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button 
            variant="white" 
            size="sm" 
            onClick={() => exportToCsv(registry.id, data, registry.columns)} 
            title="Export CSV"
          >
            <Download className="h-4 w-4 mr-1 text-silver-blue" /> Export
          </Button>

          <Button 
            variant="white" 
            size="sm" 
            onClick={() => setIsImportOpen(true)} 
            title="Import CSV"
          >
            <Upload className="h-4 w-4 mr-1 text-silver-blue" /> Import
          </Button>

          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
      </div>

      {/* Entity Table */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <SmartTable 
          columns={registry.columns} 
          data={data} 
          isLoading={isLoading} 
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onHistory={handleHistory}
          exportable={false}
          exportFilename={registry.singularName}
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
          <div className="space-y-4 max-h-[70vh] overflow-y-auto hide-scrollbar pr-2">
            <div className="bg-[rgba(148,151,169,0.04)] p-4 rounded-[12px] border border-border-gray space-y-3">
              <h4 className="text-caption font-semibold text-primary uppercase tracking-wider mb-2 border-b border-border-gray pb-1.5">Primary Details</h4>
              {registry.columns.map(col => (
                <div key={col.key} className="grid grid-cols-3 gap-3 border-b border-border-gray/60 pb-2 last:border-0 last:pb-0 p-1.5 -mx-1.5 rounded transition-colors">
                  <div className="text-small font-semibold text-cool-gray uppercase tracking-wider flex items-center">{col.label}</div>
                  <div className="col-span-2 text-caption text-ink font-medium">
                    {col.render ? col.render(viewingRecord[col.key], viewingRecord) : viewingRecord[col.key] || '-'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-[rgba(148,151,169,0.04)] p-4 rounded-[12px] border border-border-gray space-y-3">
              <h4 className="text-caption font-semibold text-primary uppercase tracking-wider mb-2 border-b border-border-gray pb-1.5">All Data Fields</h4>
              {registry.fields.map(field => {
                const rawVal = viewingRecord[field.name];
                let displayVal: any = '-';

                if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
                  if (typeof rawVal === 'boolean') {
                    displayVal = rawVal ? (
                      <span className="text-[#026b3f] bg-[rgba(20,158,97,0.16)] px-2 py-0.5 rounded-[6px] font-medium text-xs">Yes</span>
                    ) : (
                      <span className="text-[#484b5e] bg-[rgba(104,107,130,0.12)] px-2 py-0.5 rounded-[8px] font-medium text-xs">No</span>
                    );
                  } else if (field.name.endsWith('Id')) {
                    const relKey = field.name.slice(0, -2);
                    const relObj = viewingRecord[relKey];
                    if (relObj && typeof relObj === 'object') {
                      displayVal = relObj.departmentName || relObj.plantName || relObj.shiftName || relObj.companyName || relObj.name || rawVal;
                    } else {
                      displayVal = rawVal;
                    }
                  } else {
                    displayVal = rawVal;
                  }
                }

                return (
                  <div key={field.name} className="grid grid-cols-3 gap-3 border-b border-border-gray/60 pb-2 last:border-0 last:pb-0 p-1.5 -mx-1.5 rounded transition-colors">
                    <div className="text-small font-semibold text-cool-gray uppercase tracking-wider flex items-center">{field.label}</div>
                    <div className="col-span-2 text-caption text-ink font-medium">
                      {displayVal}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-border-gray">
              <Button variant="white" onClick={() => setIsViewOpen(false)}>Close</Button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        title={`Archive ${registry.singularName}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-caption text-cool-gray font-medium">
            Are you sure you want to archive <span className="font-semibold text-ink">{deletingRecord?.name || deletingRecord?.companyName || deletingRecord?.customerCode || deletingRecord?.vendorName || deletingRecord?.materialCode || deletingRecord?.machineCode || 'this record'}</span>? This will change its status to INACTIVE.
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-border-gray">
            <Button variant="ghost" onClick={() => setDeletingRecord(null)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              isLoading={isDeleting}
              onClick={confirmDelete}
            >
              Confirm Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
