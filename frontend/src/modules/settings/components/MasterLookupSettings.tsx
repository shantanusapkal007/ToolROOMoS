"use client";

import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Wrench,
  Package,
  Activity,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useMasterLookups, useCreateCategoryOption, useDeleteCategoryOption } from '../../../hooks/useMasterLookups';
import { useToast } from '../../../components/ui/Toast';

const CATEGORIES = [
  { id: 'PRODUCTION_SECTION', label: 'Production Shops & Sections', icon: Layers, desc: 'Shopfloor departments (Machine Shop, Press Shop, Fabrication, Quality)' },
  { id: 'CAD_TOOL', label: 'CAD / CAM Software Tools', icon: Cpu, desc: 'Engineering design software (SolidWorks, UG NX, AutoCAD, Creo)' },
  { id: 'WORK_STAGE', label: 'Design Work Stages', icon: Wrench, desc: 'Design timesheet activities (3D Modeling, 2D Detailing, CAM, FEA)' },
  { id: 'UOM', label: 'Units of Measure (UOM)', icon: Package, desc: 'Inventory material units (NOS, SET, PCS, KG, MTR)' },
  { id: 'ASSET_CONDITION', label: 'Asset Physical Conditions', icon: Activity, desc: 'Equipment physical state (NEW, EXCELLENT, GOOD, FAIR, DAMAGED)' },
];

export function MasterLookupSettings() {
  const [selectedCategory, setSelectedCategory] = useState('PRODUCTION_SECTION');
  const [newLabel, setNewLabel] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { options, isLoading, refetch } = useMasterLookups(selectedCategory);
  const createMutation = useCreateCategoryOption();
  const deleteMutation = useDeleteCategoryOption();
  const { success, error } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    try {
      await createMutation.mutateAsync({
        category: selectedCategory,
        label: newLabel.trim(),
        code: newCode.trim() || undefined,
        description: newDesc.trim() || undefined,
      });
      success('Option Added', `"${newLabel}" added to ${selectedCategory.replace(/_/g, ' ')}`);
      setNewLabel('');
      setNewCode('');
      setNewDesc('');
      refetch();
    } catch (err: any) {
      error('Failed to Add', err.message || 'Error adding custom option.');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    try {
      await deleteMutation.mutateAsync({ id, category: selectedCategory });
      success('Option Deleted', `"${label}" removed.`);
      refetch();
    } catch (err: any) {
      error('Delete Failed', err.message || 'Could not delete option.');
    }
  };

  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory)!;

  return (
    <div className="h-full flex flex-col relative min-h-0">
      {/* Header */}
      <div className="p-5 border-b border-border-gray shrink-0 bg-white flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center border border-primary/20 shadow-subtle">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-section-heading font-bold text-ink tracking-tight">Master Options & Sources Configurator</h2>
          <p className="text-caption text-silver-blue">
            Manage dynamic dropdown lists, shop floor sections, CAD tools, work stages, and units without hardcoding.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar bg-[#fbfbfd]">
        {/* Category Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white border-primary shadow-subtle ring-1 ring-primary/20'
                    : 'bg-white border-border-gray hover:bg-[rgba(148,151,169,0.04)] shadow-subtle'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 rounded-[8px] ${isActive ? 'bg-primary text-white' : 'bg-primary-subtle text-primary'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-caption font-bold truncate ${isActive ? 'text-primary' : 'text-ink'}`}>
                    {cat.label}
                  </span>
                </div>
                <p className="text-small text-silver-blue line-clamp-2">{cat.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Add New Option Form */}
        <div className="p-4 bg-white border border-border-gray rounded-[12px] shadow-subtle">
          <h3 className="text-body font-bold text-ink mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span>Add New Option for {activeCategoryObj?.label}</span>
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-micro font-semibold uppercase text-silver-blue mb-1">Option Label *</label>
              <input
                type="text"
                required
                placeholder="e.g. Laser Cutting"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-border-gray rounded-[10px] text-caption text-ink focus:outline-none focus:border-primary shadow-subtle"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-micro font-semibold uppercase text-silver-blue mb-1">Short Code</label>
              <input
                type="text"
                placeholder="e.g. LASER"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 bg-white border border-border-gray rounded-[10px] text-caption font-mono uppercase text-ink focus:outline-none focus:border-primary shadow-subtle"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-micro font-semibold uppercase text-silver-blue mb-1">Description</label>
              <input
                type="text"
                placeholder="Optional description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-border-gray rounded-[10px] text-caption text-ink focus:outline-none focus:border-primary shadow-subtle"
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={createMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Add Option</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Existing Options List */}
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
          <div className="px-5 py-3 bg-[#fbfbfd] border-b border-border-gray flex items-center justify-between">
            <span className="text-micro font-semibold text-silver-blue uppercase tracking-wider">
              Existing Entries ({options?.length || 0})
            </span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-silver-blue text-caption animate-pulse">Loading category options...</div>
          ) : !options || options.length === 0 ? (
            <div className="p-8 text-center text-silver-blue text-caption">No options registered yet for this category.</div>
          ) : (
            <div className="divide-y divide-border-gray">
              {options.map((opt: any) => (
                <div key={opt.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#fbfbfd] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-primary-subtle text-primary flex items-center justify-center font-bold text-caption border border-primary/20">
                      {opt.code || opt.label.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-caption text-ink">{opt.label}</span>
                        {opt.code && (
                          <span className="px-2 py-0.5 bg-[rgba(148,151,169,0.08)] text-cool-gray text-[10px] font-mono font-semibold rounded">
                            {opt.code}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className="text-small text-silver-blue mt-0.5">{opt.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(opt.id, opt.label)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-silver-blue hover:text-accent-red hover:bg-[rgba(239,68,68,0.08)] rounded-[8px] transition-colors cursor-pointer"
                    title="Delete Option"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
