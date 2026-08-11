"use client";

import React, { useState, useMemo } from 'react';
import {
  Boxes, Package, Search, Filter, Layers, MapPin, Building2,
  Calendar, CheckCircle2, AlertCircle, ArrowUpRight, Tag, RefreshCw, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useProjectMaterialInventory } from '../../hooks/useInventory';
import { useProjects } from '../../hooks/useProjects';
import { formatCurrency, formatDate } from '../../lib/formatters';

export function ProjectMaterialInventoryTab() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: inventoryData, isLoading, refetch } = useProjectMaterialInventory({
    projectId: selectedProjectId,
    section: selectedSection,
    search: searchTerm,
  });

  const { data: projects = [] } = useProjects();

  const summary = inventoryData?.summary || {
    totalItems: 0,
    totalValue: 0,
    issuedCount: 0,
    issuedValue: 0,
    storeCount: 0,
    storeValue: 0,
  };

  const items = inventoryData?.items || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-[12px] bg-white border border-border-gray/80 shadow-subtle">
          <div className="flex items-center justify-between text-mute mb-2">
            <span className="text-caption font-semibold uppercase tracking-wider">Total Project Materials</span>
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-semibold text-ink">{summary.totalItems} Items</p>
          <p className="text-caption text-mute mt-0.5">Total Value: <span className="font-semibold text-zinc-800">{formatCurrency(summary.totalValue)}</span></p>
        </div>

        <div className="p-4 rounded-[12px] bg-amber-50/60 border border-amber-200/70 shadow-subtle">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-caption font-semibold uppercase tracking-wider">Issued to Shopfloor</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-semibold text-amber-950">{summary.issuedCount} Items</p>
          <p className="text-caption text-amber-700 mt-0.5">Value on Shopfloor: <span className="font-semibold">{formatCurrency(summary.issuedValue)}</span></p>
        </div>

        <div className="p-4 rounded-[12px] bg-emerald-50/60 border border-emerald-200/70 shadow-subtle">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-caption font-semibold uppercase tracking-wider">In Project Stores</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-semibold text-emerald-950">{summary.storeCount} Items</p>
          <p className="text-caption text-emerald-700 mt-0.5">Value in Store: <span className="font-semibold">{formatCurrency(summary.storeValue)}</span></p>
        </div>

        <div className="p-4 rounded-[12px] bg-purple-50/60 border border-purple-200/70 shadow-subtle">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-caption font-semibold uppercase tracking-wider">Shopfloor Sections</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-semibold text-purple-950">5 Active Zones</p>
          <p className="text-caption text-purple-700 mt-0.5">Press Shop, Machine Shop, etc.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-border-gray rounded-[12px] shadow-subtle">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search material grade, batch #, heat #, location, project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-caption rounded-[12px] border border-border-gray bg-canvas/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all text-ink"
            />
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-mute font-medium whitespace-nowrap">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2.5 py-1.5 text-caption font-medium rounded-[12px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} - {p.partName}
                </option>
              ))}
            </select>
          </div>

          {/* Location/Section Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-mute font-medium whitespace-nowrap">Location:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-2.5 py-1.5 text-caption font-medium rounded-[12px] border border-border-gray bg-white text-ink focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="ALL">All Locations</option>
              <option value="PROJECT_STORE">Project Store (Unissued)</option>
              <option value="PRESS_SHOP">Press Shop</option>
              <option value="MACHINE_SHOP">Machine Shop</option>
              <option value="TOOL_ROOM_FITTING">Tool Room Fitting</option>
              <option value="FABRICATION_INDIAN">Fabrication (Indian)</option>
              <option value="FABRICATION_EXPORT">Fabrication (Export)</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="p-1.5 text-mute hover:text-ink hover:bg-zinc-100 rounded-[12px] transition-colors cursor-pointer"
          title="Refresh Material Inventory"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Material Inventory W.R.T. Projects Table */}
      <div className="rounded-[12px] bg-white border border-border-gray overflow-hidden shadow-subtle">
        <div className="px-4 py-3 bg-canvas/80 border-b border-border-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-caption font-semibold text-ink">Project Material & Location Tracking Ledger</h3>
          </div>
          <span className="text-[11px] text-mute font-medium">
            Showing {items.length} material records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-caption">
            <thead>
              <tr className="bg-zinc-100/60 border-b border-border-gray text-mute font-semibold text-[11px] uppercase tracking-wider">
                <th className="p-3">Project</th>
                <th className="p-3">Material Grade & Description</th>
                <th className="p-3">Batch & Heat #</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3">Current Stored Location</th>
                <th className="p-3 text-right">Material Value</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="font-semibold text-zinc-600">No project material records found</p>
                    <p className="text-caption text-zinc-400 mt-0.5">Try adjusting your project or location filter.</p>
                  </td>
                </tr>
              ) : (
                items.map((item: any) => {
                  const isIssuedToShop = item.isIssued;

                  return (
                    <tr key={item.id} className="hover:bg-canvas/80 transition-colors">
                      {/* Project Name & Code */}
                      <td className="p-3">
                        <div className="font-semibold text-ink">{item.projectCode}</div>
                        <div className="text-[11px] text-mute truncate max-w-[160px]" title={item.projectName}>
                          {item.projectName}
                        </div>
                      </td>

                      {/* Material Grade */}
                      <td className="p-3">
                        <div className="font-semibold text-zinc-800">{item.materialGrade}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{item.materialCode}</div>
                      </td>

                      {/* Batch & Heat # */}
                      <td className="p-3">
                        <div className="font-mono font-medium text-zinc-700">{item.batchNumber}</div>
                        <div className="text-[10px] text-zinc-400">Heat: <span className="font-mono text-zinc-600">{item.heatNumber}</span></div>
                      </td>

                      {/* Quantity & Weight-Based Rate */}
                      <td className="p-3 text-right">
                        <div className="font-semibold text-ink">
                          {item.quantity} <span className="text-[10px] font-medium text-mute">NOS</span>
                        </div>
                        {item.unitCost > 0 && (
                          <div className="text-[10px] font-semibold text-mute">
                            @ {formatCurrency(item.unitCost)} <span className="text-zinc-400 font-normal">/ KG</span>
                          </div>
                        )}
                      </td>

                      {/* CRITICAL FEATURE REQUIREMENT: Location Column */}
                      <td className="p-3">
                        {isIssuedToShop ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-amber-50 border border-amber-200/80 text-amber-900 font-semibold text-caption shadow-subtle">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{item.currentLocation}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-semibold text-caption shadow-subtle">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item.currentLocation}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-zinc-400 mt-1 pl-1">
                          {item.warehouseName} · {item.rackBin}
                        </div>
                      </td>

                      {/* Value */}
                      <td className="p-3 text-right font-semibold text-ink">
                        {formatCurrency(item.materialValue)}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isIssuedToShop
                            ? 'bg-amber-100 text-amber-800'
                            : item.status?.includes('RESERVED')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-[11px] text-mute whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
