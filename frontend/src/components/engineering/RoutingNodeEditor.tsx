"use client";

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Connection,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Factory, Wrench, Settings, ArrowRight, Save, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

// Custom Operation Node
const OperationNode = ({ data, isConnectable }: any) => {
  return (
    <div className="bg-[#0B1018]/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.05)] w-64">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-black" />
      
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${data.type === 'machining' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
              {data.type === 'machining' ? <Factory className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Op {data.opCode}</div>
              <div className="text-sm font-bold text-white leading-tight">{data.label}</div>
            </div>
          </div>
        </div>
        <div className="mt-2 bg-black/40 rounded-lg p-2 border border-white/5 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Est. Setup:</span> <span className="text-white font-medium">{data.setupTime} hrs</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Est. Runtime:</span> <span className="text-white font-medium">{data.runTime} hrs</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-500 border-2 border-black" />
    </div>
  );
};

// Custom Node Types mapping
const nodeTypes = {
  operationNode: OperationNode,
};

// Initial Nodes
const initialNodes = [
  {
    id: 'start',
    type: 'input',
    data: { label: 'Raw Material (Start)' },
    position: { x: 50, y: 150 },
    className: 'bg-emerald-900/50 text-emerald-400 font-bold border-emerald-500/30 rounded-full px-4 py-2 text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  },
  {
    id: 'op1',
    type: 'operationNode',
    position: { x: 300, y: 100 },
    data: { opCode: '10', label: 'CNC Milling', type: 'machining', setupTime: 2.5, runTime: 12.0 },
  },
  {
    id: 'op2',
    type: 'operationNode',
    position: { x: 600, y: 200 },
    data: { opCode: '20', label: 'Heat Treatment', type: 'external', setupTime: 0, runTime: 24.0 },
  },
  {
    id: 'end',
    type: 'output',
    data: { label: 'Quality Insp. (End)' },
    position: { x: 900, y: 150 },
    className: 'bg-blue-900/50 text-blue-400 font-bold border-blue-500/30 rounded-full px-4 py-2 text-xs shadow-[0_0_15px_rgba(59,130,246,0.2)]',
  },
];

// Initial Edges
const initialEdges = [
  { id: 'e1-op1', source: 'start', target: 'op1', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'eop1-op2', source: 'op1', target: 'op2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
  { id: 'eop2-end', source: 'op2', target: 'end', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
];

interface RoutingNodeEditorProps {
  onClose: () => void;
  onSave: (nodes: any, edges: any) => void;
}

export const RoutingNodeEditor = ({ onClose, onSave }: RoutingNodeEditorProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const handleAddNode = () => {
    const newNode = {
      id: `op${nodes.length + 1}`,
      type: 'operationNode',
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      data: { opCode: `${nodes.length * 10}`, label: 'New Operation', type: 'machining', setupTime: 1, runTime: 5 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0B1018]/95 border border-white/10 rounded-3xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Visual Routing Editor</h2>
              <p className="text-xs text-slate-400 font-medium">Drag, drop, and connect operations to build the manufacturing flow.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleAddNode} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold rounded-lg flex items-center transition-all">
              <Plus className="w-4 h-4 mr-2" /> Add Operation
            </button>
            <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={() => onSave(nodes, edges)}>
              Deploy Routing
            </Button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-4">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full h-full relative bg-[#02050A]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="dark-theme"
          >
            <Controls className="!bg-black/50 !border-white/10 !fill-white" />
            <MiniMap 
              className="!bg-[#0B1018] !border-white/10 rounded-xl overflow-hidden" 
              nodeColor={(node) => {
                if (node.type === 'input') return '#10b981';
                if (node.type === 'output') return '#3b82f6';
                return '#8b5cf6';
              }} 
            />
            <Background color="#ffffff" gap={20} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
