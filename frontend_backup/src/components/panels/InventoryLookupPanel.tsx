import React from 'react';
import { Package, MapPin, Activity, Tag, BarChart2 } from 'lucide-react';

interface InventoryLookupPanelProps {
  materialName?: string;
  grade?: string;
}

export function InventoryLookupPanel({ materialName, grade }: InventoryLookupPanelProps) {
  if (!materialName) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full">
        <Package className="w-8 h-8 text-white/10 mb-2" />
        <p className="text-sm text-zinc-500 font-medium">Select a material to view inventory context</p>
      </div>
    );
  }

  // Mock data for demo purposes, this would normally be fetched based on materialName
  const stockData = {
    current: 450,
    reserved: 50,
    available: 400,
    incoming: 120,
    avgCost: 1500,
    lastPurchase: '2026-06-25',
    heatNumbers: ['HT-9921', 'HT-9922'],
    offcuts: 2,
    warehouse: 'Main Toolroom',
    rack: 'R-14',
    relatedProjects: 3,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-sm font-bold text-zinc-100 truncate" title={materialName}>{materialName}</h3>
        {grade && <p className="text-xs text-zinc-400 mt-1">Grade: {grade}</p>}
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar p-4 flex flex-col gap-5">
        
        {/* Stock Summary */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <BarChart2 className="w-3.5 h-3.5" />
            Stock Summary
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Current Stock</span>
            <span className="font-medium text-zinc-100">{stockData.current} Kg</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Reserved</span>
            <span className="font-medium text-amber-400">{stockData.reserved} Kg</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Available</span>
            <span className="font-bold text-green-400">{stockData.available} Kg</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Incoming PO</span>
            <span className="font-medium text-blue-400">{stockData.incoming} Kg</span>
          </div>
        </div>

        {/* Pricing Context */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <Tag className="w-3.5 h-3.5" />
            Pricing Context
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Average Cost</span>
            <span className="font-medium text-zinc-100">₹ {stockData.avgCost.toLocaleString()} / Kg</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Last Purchase</span>
            <span className="font-medium text-zinc-100">{stockData.lastPurchase}</span>
          </div>
        </div>

        {/* Traceability & Location */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" />
            Traceability
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Heat Numbers</span>
            <span className="font-medium text-zinc-100 truncate max-w-[120px]" title={stockData.heatNumbers.join(', ')}>
              {stockData.heatNumbers.join(', ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Location</span>
            <span className="font-medium text-zinc-100">{stockData.warehouse}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Rack/Bin</span>
            <span className="font-medium text-zinc-100">{stockData.rack}</span>
          </div>
        </div>
        
        {/* Usability */}
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4 mt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Available Off-cuts</span>
            <span className="font-medium text-purple-400">{stockData.offcuts} Pcs</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Related Projects</span>
            <span className="font-medium text-blue-400 cursor-pointer hover:underline">{stockData.relatedProjects} Active</span>
          </div>
        </div>

      </div>
    </div>
  );
}
