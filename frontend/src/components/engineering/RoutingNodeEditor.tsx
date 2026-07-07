"use client";

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Connection,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Factory, Wrench, Settings, Play, CheckCircle, Save, X, Plus, Clock, Zap, ZoomIn, ZoomOut, Maximize, Cpu, Target, FileText, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

// --- Premium Custom Nodes ---

const StartNode = ({ isConnectable }: any) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
    className="relative flex items-center justify-center w-16 h-16 rounded-full bg-black/40 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-xl group"
  >
    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-[spin_4s_linear_infinite]" />
    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md group-hover:bg-emerald-500/40 transition-colors" />
    <Play className="w-6 h-6 text-emerald-400 ml-1 relative z-10" />
    <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-emerald-400 border-2 border-black !right-[-6px]" />
    <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-emerald-400 tracking-widest uppercase">Start Routing</div>
  </motion.div>
);

const EndNode = ({ isConnectable }: any) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
    className="relative flex items-center justify-center w-16 h-16 rounded-full bg-black/40 border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-xl group"
  >
    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-[spin_4s_linear_infinite_reverse]" />
    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:bg-blue-500/40 transition-colors" />
    <CheckCircle className="w-6 h-6 text-blue-400 relative z-10" />
    <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-blue-400 border-2 border-black !left-[-6px]" />
    <div className="absolute -bottom-8 whitespace-nowrap text-xs font-bold text-blue-400 tracking-widest uppercase">Quality Release</div>
  </motion.div>
);

const OperationNode = ({ data, isConnectable, selected }: any) => {
  const isMachining = data.type === 'machining';
  const accentColor = isMachining ? 'blue' : 'purple';
  const AccentIcon = isMachining ? Factory : Wrench;

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative group rounded-2xl w-80 transition-all duration-500 ${
        selected 
          ? `bg-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.5),_0_0_20px_rgba(${isMachining ? '59,130,246' : '168,85,247'},0.3)] border-${accentColor}-500/50` 
          : 'bg-black/60 backdrop-blur-3xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-white/10 hover:border-white/20'
      } border overflow-visible`}
    >
      <div className="absolute inset-0 rounded-2xl border border-white/[0.05] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-${accentColor}-500/20 blur-[50px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700`} />

      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className={`w-4 h-4 rounded-full bg-black border-2 ${selected ? `border-${accentColor}-400 shadow-[0_0_10px_rgba(${isMachining ? '59,130,246' : '168,85,247'},0.8)]` : 'border-white/30'} !left-[-8px] transition-colors`} 
      />
      
      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
              isMachining ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
            }`}>
              <AccentIcon className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${
                  isMachining ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  OP {data.opCode}
                </span>
                {data.inspectionRequired && (
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                    INSP
                  </span>
                )}
              </div>
              <div className="text-base font-bold text-white tracking-tight mt-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                {data.label}
              </div>
            </div>
          </div>
        </div>
        
        {data.machine && (
          <div className="mb-3 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center text-xs text-slate-300">
            <div className="flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-2 text-slate-500" />
                <span className="font-medium text-white">{data.machineName || data.machine}</span>
            </div>
            {data.estimatedCost > 0 && (
                <div className="text-emerald-400 font-mono font-bold flex items-center">
                    <IndianRupee className="w-3 h-3 mr-0.5" />
                    {data.estimatedCost.toFixed(2)}
                </div>
            )}
          </div>
        )}

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center group-hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center text-[10px] text-slate-400 uppercase tracking-widest mb-1">
              <Settings className="w-3 h-3 mr-1" /> Setup
            </div>
            <div className="text-sm font-bold text-white">{data.setupTime} <span className="text-[10px] text-slate-500 font-normal">hrs</span></div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col items-center justify-center group-hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center text-[10px] text-slate-400 uppercase tracking-widest mb-1">
              <Clock className="w-3 h-3 mr-1" /> Runtime
            </div>
            <div className="text-sm font-bold text-white">{data.runTime} <span className="text-[10px] text-slate-500 font-normal">hrs</span></div>
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable} 
        className={`w-4 h-4 rounded-full bg-black border-2 ${selected ? `border-${accentColor}-400 shadow-[0_0_10px_rgba(${isMachining ? '59,130,246' : '168,85,247'},0.8)]` : 'border-white/30'} !right-[-8px] transition-colors`} 
      />
    </motion.div>
  );
};

const nodeTypes = {
  operationNode: OperationNode,
  startNode: StartNode,
  endNode: EndNode,
};

// Initial Nodes (Empty)
const emptyNodes = [
  { id: 'start', type: 'startNode', position: { x: 50, y: 250 }, data: {} },
  { id: 'end', type: 'endNode', position: { x: 500, y: 250 }, data: {} },
];

const emptyEdges: any[] = [];

// Fetch Machines
const fetchMachines = async () => {
  const res = await api.get('/master-data/machines?limit=100');
  return Array.isArray(res) ? res : res.data;
};

// Fetch Operations
const fetchOperations = async () => {
  const res = await api.get('/master-data/operations?limit=100');
  return Array.isArray(res) ? res : res.data;
};

// --- Custom Viewport Controls ---
const CustomControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  return (
    <div className="absolute bottom-6 left-6 z-50 flex items-center p-1.5 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      <motion.button whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.9 }} onClick={() => zoomIn()} className="p-2.5 rounded-xl text-white transition-colors" title="Zoom In">
        <ZoomIn className="w-5 h-5" />
      </motion.button>
      <div className="w-px h-6 bg-white/10 mx-1" />
      <motion.button whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.9 }} onClick={() => zoomOut()} className="p-2.5 rounded-xl text-white transition-colors" title="Zoom Out">
        <ZoomOut className="w-5 h-5" />
      </motion.button>
      <div className="w-px h-6 bg-white/10 mx-1" />
      <motion.button whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.9 }} onClick={() => fitView({ duration: 800 })} className="p-2.5 rounded-xl text-white transition-colors" title="Fit View">
        <Maximize className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

interface RoutingNodeEditorProps {
  onClose: () => void;
  onSave: (nodes: any, edges: any) => void;
  initialRouting?: any;
}

export const RoutingNodeEditor = ({ onClose, onSave, initialRouting }: RoutingNodeEditorProps) => {
  const initNodes = React.useMemo(() => {
    if (!initialRouting || !initialRouting.operations || initialRouting.operations.length === 0) return emptyNodes;
    
    const parsedNodes: any[] = [{ id: 'start', type: 'startNode', position: { x: 50, y: 250 }, data: {} }];
    initialRouting.operations.forEach((op: any, i: number) => {
      parsedNodes.push({
        id: `op${i+1}`,
        type: 'operationNode',
        position: { x: 250 + (i * 250), y: 200 + (i % 2 === 0 ? -50 : 50) },
        data: {
          opCode: op.sequenceOrder?.toString() || `${(i+1)*10}`,
          label: op.operation?.operationName || 'Operation',
          operationId: op.operationId || '',
          type: 'machining',
          setupTime: Number(op.estimatedSetupTime || 0),
          runTime: Number(op.estimatedHours || 0),
          machine: op.plannedMachineId || '',
          machineName: op.plannedMachine?.machineName || '',
          estimatedCost: 0,
        }
      });
    });
    parsedNodes.push({ id: 'end', type: 'endNode', position: { x: 250 + (initialRouting.operations.length * 250), y: 250 }, data: {} });
    return parsedNodes;
  }, [initialRouting]);

  const initEdges = React.useMemo(() => {
    if (!initialRouting || !initialRouting.operations || initialRouting.operations.length === 0) return emptyEdges;
    
    const parsedEdges: any[] = [];
    parsedEdges.push({ id: 'e-start', source: 'start', target: 'op1', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 3, opacity: 0.6 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } });
    for (let i = 1; i < initialRouting.operations.length; i++) {
       parsedEdges.push({ id: `e-op${i}-op${i+1}`, source: `op${i}`, target: `op${i+1}`, type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 3, opacity: 0.6 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } });
    }
    parsedEdges.push({ id: `e-end`, source: `op${initialRouting.operations.length}`, target: 'end', type: 'smoothstep', animated: true, style: { stroke: '#a855f7', strokeWidth: 3, opacity: 0.6 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' } });
    return parsedEdges;
  }, [initialRouting]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data: machinesData = [] } = useQuery({ queryKey: ['machines'], queryFn: fetchMachines });
  const machines = Array.isArray(machinesData) ? machinesData : [];

  const { data: operationsData = [] } = useQuery({ queryKey: ['operations'], queryFn: fetchOperations });
  const operations = Array.isArray(operationsData) ? operationsData : [];

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      animated: true, 
      style: { stroke: '#3b82f6', strokeWidth: 3, opacity: 0.8 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }, eds)),
    [setEdges],
  );

  const handleAddNode = () => {
    const newNodeId = `op${nodes.length + 1}`;
    const newNode = {
      id: newNodeId,
      type: 'operationNode',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { opCode: `${(nodes.length - 1) * 10}`, label: 'New Operation', operationId: '', type: 'machining', setupTime: 1, runTime: 5, machine: '', machineName: '', inspectionRequired: false, notes: '', estimatedCost: 0 },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateSelectedNodeData = (field: string, value: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          const updatedData = { ...node.data, [field]: value };
          
          // Re-calculate cost if machine, setupTime, or runTime changes
          if (['machine', 'setupTime', 'runTime'].includes(field)) {
            let machineHourlyRate = 0;
            if (field === 'machine') {
                const selectedMachine = machines.find((m: any) => m.id === value);
                machineHourlyRate = selectedMachine ? Number(selectedMachine.hourlyRate) : 0;
                updatedData.machineName = selectedMachine ? selectedMachine.machineName : '';
            } else {
                const selectedMachine = machines.find((m: any) => m.id === updatedData.machine);
                machineHourlyRate = selectedMachine ? Number(selectedMachine.hourlyRate) : 0;
            }
            const totalHours = Number(updatedData.setupTime || 0) + Number(updatedData.runTime || 0);
            updatedData.estimatedCost = totalHours * machineHourlyRate;
          }
          
          return { ...node, data: updatedData } as any;
        }
        return node;
      })
    );
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-2xl"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col rounded-[2rem] overflow-hidden bg-[#050914]/80 shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/[0.08]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />
          
          {/* Header */}
          <div className="relative z-20 px-8 py-5 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">Visual Routing Editor</h2>
                <p className="text-sm text-slate-400 font-medium tracking-wide">Design spatial manufacturing workflows with magnetic connections.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleAddNode} 
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold tracking-wider uppercase rounded-xl flex items-center shadow-inner transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Operation
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }} 
                whileTap={{ scale: 0.95 }}
                onClick={() => onSave(nodes, edges)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold tracking-wider uppercase rounded-xl flex items-center shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all"
              >
                <Save className="w-4 h-4 mr-2" /> Deploy Routing
              </motion.button>
              <div className="w-px h-8 bg-white/10 mx-2" />
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white shadow-inner transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden relative">
            {/* Canvas Area */}
            <div className="flex-1 w-full h-full relative bg-[#02040A]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.05)_0%,_transparent_60%)] pointer-events-none" />
              
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  onNodeClick={(_, node) => {
                    if (node.type === 'operationNode') setSelectedNodeId(node.id);
                  }}
                  onPaneClick={() => setSelectedNodeId(null)}
                  fitView
                  className="dark-theme"
                  defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 3 }, animated: true }}
                >
                  <CustomControls />
                  <MiniMap 
                    className="!bg-[#050914]/90 !backdrop-blur-xl !border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] !bottom-6 !right-6" 
                    nodeColor={(node) => {
                      if (node.type === 'startNode') return '#10b981';
                      if (node.type === 'endNode') return '#3b82f6';
                      return '#8b5cf6';
                    }} 
                    maskColor="rgba(0, 0, 0, 0.6)"
                  />
                  <Background color="rgba(255,255,255,0.05)" gap={30} size={1.5} />
                </ReactFlow>
              </ReactFlowProvider>
            </div>

            {/* Properties Side Panel */}
            <AnimatePresence>
              {selectedNode && selectedNode.data && (
                <motion.div
                  initial={{ x: 400, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 400, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 40 }}
                  className="w-96 bg-[#0B1120]/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20"
                >
                  <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Operation Analysis</h3>
                        <p className="text-xs text-slate-400 font-medium">Configure machine \u0026 parameters</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedNodeId(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Op Code</label>
                        <input 
                          type="text" 
                          value={selectedNode.data.opCode}
                          onChange={(e) => updateSelectedNodeData('opCode', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Op Type</label>
                        <select 
                          value={selectedNode.data.type}
                          onChange={(e) => updateSelectedNodeData('type', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none"
                        >
                          <option value="machining">Machining</option>
                          <option value="external">External</option>
                          <option value="assembly">Assembly</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operation Name</label>
                      <select 
                        value={selectedNode.data.operationId || ''}
                        onChange={(e) => {
                          const op = operations.find((o: any) => o.id === e.target.value);
                          updateSelectedNodeData('operationId', e.target.value);
                          if (op) {
                            setTimeout(() => updateSelectedNodeData('label', op.operationName), 0);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none"
                      >
                        <option value="">-- Select Operation --</option>
                        {operations.map((op: any) => (
                          <option key={op.id} value={op.id}>{op.operationName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                      <div className="flex items-center text-sm font-bold text-slate-200 mb-2">
                        <Cpu className="w-4 h-4 mr-2 text-blue-400" /> System Analysis & Machine
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Work Center / Machine</label>
                        <select 
                          value={selectedNode.data.machine}
                          onChange={(e) => updateSelectedNodeData('machine', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none"
                        >
                          <option value="">-- Select Machine --</option>
                          {machines.map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.machineName} - ₹{Number(m.hourlyRate).toFixed(2)}/hr
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Setup Time (hrs)</label>
                          <input 
                            type="number" step="0.1"
                            value={selectedNode.data.setupTime}
                            onChange={(e) => updateSelectedNodeData('setupTime', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Run Time (hrs)</label>
                          <input 
                            type="number" step="0.1"
                            value={selectedNode.data.runTime}
                            onChange={(e) => updateSelectedNodeData('runTime', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={selectedNode.data.inspectionRequired}
                            onChange={(e) => updateSelectedNodeData('inspectionRequired', e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${selectedNode.data.inspectionRequired ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                          <div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform ${selectedNode.data.inspectionRequired ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Quality Inspection Required</div>
                          <div className="text-xs text-slate-500">Flag for mandatory QC check after operation.</div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <FileText className="w-3 h-3 mr-1" /> Tooling & Notes
                      </label>
                      <textarea 
                        value={selectedNode.data.notes}
                        onChange={(e) => updateSelectedNodeData('notes', e.target.value)}
                        rows={4}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
                        placeholder="Add special instructions, required tools, etc..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
