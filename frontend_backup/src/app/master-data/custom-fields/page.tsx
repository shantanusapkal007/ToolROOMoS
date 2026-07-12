"use client";

import React, { useState, useEffect } from 'react';
import { UniversalTable } from '@/components/tables/UniversalTable';
import { ColumnDef } from '@tanstack/react-table';
import { SmartForm } from '@/components/ui/SmartForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Plus, Database, RefreshCw, Trash2 } from 'lucide-react';
import { EntityField } from '@/modules/settings/types';

const columns = [
  { key: 'module', label: 'Module' },
  { key: 'fieldName', label: 'Field Name' },
  { key: 'fieldType', label: 'Field Type' },
  { key: 'isRequired', label: 'Required', render: (val: any, _row?: any) => val ? 'Yes' : 'No' },
  { key: 'sortOrder', label: 'Sort Order' },
];

const formFields: EntityField[] = [
  { 
    name: 'module', 
    label: 'Module', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Customers', value: 'customers' },
      { label: 'Vendors', value: 'vendors' },
      { label: 'Materials', value: 'materials' },
      { label: 'Machines', value: 'machines' },
      { label: 'Employees', value: 'employees' },
      { label: 'Purchase Orders', value: 'purchase-orders' },
      { label: 'Goods Receipts', value: 'goods-receipts' },
      { label: 'Invoices', value: 'invoices' }
    ]
  },
  { name: 'fieldName', label: 'Field Name', type: 'text', required: true },
  { 
    name: 'fieldType', 
    label: 'Field Type', 
    type: 'select', 
    required: true,
    options: [
      { label: 'Text', value: 'TEXT' },
      { label: 'Number', value: 'NUMBER' },
      { label: 'Date', value: 'DATE' },
      { label: 'Checkbox', value: 'CHECKBOX' },
      { label: 'Dropdown', value: 'DROPDOWN' },
      { label: 'Currency', value: 'CURRENCY' }
    ]
  },
  { name: 'optionsStr', label: 'Options (comma separated for Dropdown)', type: 'text' },
  { name: 'isRequired', label: 'Is Required?', type: 'checkbox' },
  { name: 'sortOrder', label: 'Sort Order', type: 'number' }
];

export default function CustomFieldsPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error } = useToast();

  const tableColumns = React.useMemo<ColumnDef<any, any>[]>(() => {
    return [
      ...columns.map(c => ({
        accessorKey: c.key,
        header: c.label,
        cell: c.render ? ({ getValue, row }: any) => c.render!(getValue(), row.original) : undefined
      })),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button 
            onClick={(e) => { e.stopPropagation(); handleDelete(row.original); }} 
            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )
      }
    ];
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('common/custom-fields/definitions');
      setData(res.data || res);
    } catch (err: any) {
      error('Failed to load custom fields', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (formData: any) => {
    try {
      const payload = { ...formData };
      if (payload.optionsStr) {
        payload.options = payload.optionsStr.split(',').map((s: string) => s.trim());
      }
      
      await api.post('common/custom-fields/definitions', payload);
      success('Success', 'Custom field defined successfully.');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      error('Creation Failed', err.message);
    }
  };

  const handleDelete = async (record: any) => {
    if (confirm('Are you sure you want to delete this custom field? Existing data might become orphaned.')) {
      try {
        await api.delete(`common/custom-fields/definitions/${record.id}`);
        success('Success', 'Field deleted.');
        fetchData();
      } catch (err: any) {
        error('Deletion Failed', err.message);
      }
    }
  };

  return (
    <div className="h-full flex flex-col w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-white/5 shrink-0 bg-white/[0.01] backdrop-blur-2xl gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mr-3 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
            <Database className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Custom Fields Configuration</h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
              <span>{data.length} Fields Defined</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto relative z-10">
          <button onClick={fetchData} title="Refresh" className="p-1.5 text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <button onClick={() => setIsModalOpen(true)} className="relative bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Field
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        <UniversalTable 
          columns={tableColumns} 
          data={data} 
          isLoading={isLoading} 
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Define Custom Field"
        maxWidth="md"
      >
        <SmartForm
          fields={formFields}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
