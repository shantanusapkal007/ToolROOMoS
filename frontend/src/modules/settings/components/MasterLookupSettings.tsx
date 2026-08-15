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
  Tag,
  Search,
  CheckCircle2,
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
  const [searchTerm, setSearchTerm] = useState('');

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
  const ActiveIcon = activeCategoryObj?.icon || Tag;

  const filteredOptions = (options || []).filter((opt: any) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      opt.label?.toLowerCase().includes(q) ||
      opt.code?.toLowerCase().includes(q) ||
      opt.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col relative min-h-0 bg-[#fbfbfd]">
      {/* Header Banner */}
      <div className="p-5 border-b border-border-gray shrink-0 bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-subtle shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight">Master Options & Sources Configurator</h2>
            <p className="text-caption text-cool-gray mt-0.5">
              Manage dynamic dropdown sources, shop floor sections, CAD tools, work stages, and units without hardcoding.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-border-gray rounded-full text-xs font-semibold text-cool-gray">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          Zero Hardcoding Engine
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
        {/* Category Cards Grid */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-cool-gray mb-3 block">
            Select Configuration Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchTerm('');
                  }}
                  className={`p-4 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-white border-primary shadow-subtle ring-2 ring-primary/20'
                      : 'bg-white border-border-gray hover:border-primary/40 hover:bg-slate-50 shadow-subtle'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`p-2 rounded-[8px] shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold leading-tight ${isActive ? 'text-primary' : 'text-ink'}`}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-cool-gray line-clamp-2 leading-relaxed">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add New Option Card */}
        <div className="p-5 bg-white border border-border-gray rounded-[12px] shadow-subtle">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-[6px] bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-ink">
              Add New Option to <span className="text-primary">{activeCategoryObj?.label}</span>
            </h3>
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-cool-gray mb-1.5">
                Display Label <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Laser Cutting Station"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full h-9 px-3 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-medium text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-cool-gray mb-1.5">
                System Code (Unique)
              </label>
              <input
                type="text"
                placeholder="e.g. LASER_CUT"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                className="w-full h-9 px-3 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-mono font-semibold uppercase text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-cool-gray mb-1.5">
                Description / Remarks
              </label>
              <input
                type="text"
                placeholder="Optional description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full h-9 px-3 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-medium text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="w-full h-9 font-semibold text-xs shadow-subtle"
                isLoading={createMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Option
              </Button>
            </div>
          </form>
        </div>

        {/* Existing Options Registry Card */}
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
          {/* Card Header & Search Filter */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-border-gray flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ActiveIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Configured Entries ({filteredOptions.length})
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-cool-gray absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-white border border-border-gray rounded-[8px] text-xs text-ink placeholder:text-cool-gray focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="p-12 text-center text-cool-gray text-xs font-medium animate-pulse space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Loading master options for {activeCategoryObj?.label}...</p>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-cool-gray flex items-center justify-center mx-auto">
                <Tag className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-ink">No Registered Options Found</p>
              <p className="text-[11px] text-cool-gray max-w-sm mx-auto">
                {searchTerm ? 'No entries match your search query.' : `No custom options configured yet for ${activeCategoryObj?.label}.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-gray/70">
              {filteredOptions.map((opt: any, idx: number) => (
                <div
                  key={opt.id || idx}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Clean Category Avatar */}
                    <div className="w-9 h-9 rounded-[8px] bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                      <ActiveIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-xs text-ink truncate">{opt.label}</span>
                        {opt.code && (
                          <span className="px-2 py-0.5 bg-slate-100 border border-border-gray text-cool-gray text-[10px] font-mono font-semibold rounded-[4px] shrink-0">
                            {opt.code}
                          </span>
                        )}
                      </div>
                      {opt.description ? (
                        <p className="text-[11px] text-cool-gray mt-0.5 truncate">{opt.description}</p>
                      ) : (
                        <p className="text-[11px] text-mute mt-0.5 italic">Standard System Option</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => handleDelete(opt.id, opt.label)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-cool-gray hover:text-rose-600 hover:bg-rose-50 rounded-[6px] transition-colors cursor-pointer"
                      title="Delete Option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
