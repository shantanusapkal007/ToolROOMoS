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
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Master Options & Sources Configurator</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage dynamic dropdown lists, shop floor sections, CAD tools, work stages, and units without hardcoding.
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 border-indigo-500 dark:border-indigo-400 shadow-md scale-[1.02]'
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5 mb-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold ${isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                  {cat.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{cat.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Category Content Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{activeCategoryObj.label} Options</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                {options.length} item(s)
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeCategoryObj.desc}</p>
          </div>
        </div>

        {/* Add New Option Form */}
        <form onSubmit={handleAdd} className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 rounded-xl space-y-3">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add New {activeCategoryObj.label.slice(0, -1)} Option</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Display Label *</label>
              <input
                type="text"
                required
                placeholder="e.g. Laser Sintering"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. LASER_SINTERING"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isPending || !newLabel.trim()}
                className="w-full h-9 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{createMutation.isPending ? 'Saving...' : 'Add Option'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Options List */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading options...</div>
        ) : (
          <div className="overflow-hidden border border-slate-200/80 dark:border-slate-800/80 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Display Label</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 bg-white/50 dark:bg-slate-900/50">
                {options.map((opt) => (
                  <tr key={opt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {opt.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </td>
                    <td className="py-3 px-4">
                      {opt.isSystem ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-slate-400" /> System
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          User Added
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!opt.isSystem ? (
                        <button
                          onClick={() => handleDelete(opt.id, opt.label)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete Custom Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
