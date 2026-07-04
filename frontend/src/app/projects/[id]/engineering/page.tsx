"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { FileText, Layers } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";

export default function EngineeringTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error, warning } = useToast();
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingNum, setDrawingNum] = useState("");

  const [showBomModal, setShowBomModal] = useState(false);
  const [bomItems, setBomItems] = useState([{ materialId: "", requiredQty: 1, estimatedCost: 0 }]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [activeBom, setActiveBom] = useState<any>(null);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
    loadMaterials();
    loadBomData();
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaterials = async () => {
    try {
      const res = await api.get("master-data/materials");
      setMaterials(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBomData = async () => {
    try {
      const res = await api.get(`projects/${resolvedParams.id}/bom`);
      setActiveBom(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await api.post(`projects/${project.id}/drawings`, {
        drawingNumber: drawingNum,
        fileUrl: `s3://toolroomos/drawings/${drawingNum.toLowerCase()}.dxf`,
      });
      setShowDrawingModal(false);
      success("Drawing Uploaded", "The drawing was successfully attached to this project.");
      loadProjectDetails(project.id);
    } catch (err: any) { error("Upload Failed", err.message); }
  };

  const handleSubmitBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    // Validate items
    if (bomItems.some(i => !i.materialId || i.requiredQty <= 0)) {
      return error("Validation Error", "All BOM items must have a material and quantity > 0.");
    }

    try {
      await api.post(`projects/${project.id}/bom`, {
        items: bomItems
      });
      setShowBomModal(false);
      success("BOM Generated", "The draft BOM has been successfully created.");
      loadProjectDetails(project.id);
      loadBomData();
    } catch (err: any) { error("Failed", err.message); }
  };

  const handleApproveBom = async () => {
    if (!project || !activeBom) return;
    try {
      await api.put(`projects/${project.id}/bom/${activeBom.id}/approve`);
      success("BOM Approved", "The Bill of Materials has been approved for procurement.");
      loadProjectDetails(project.id);
      loadBomData();
    } catch (err: any) { error("Failed", err.message); }
  };

  const addBomItemRow = () => {
    setBomItems([...bomItems, { materialId: "", requiredQty: 1, estimatedCost: 0 }]);
  };

  const removeBomItemRow = (index: number) => {
    const newItems = [...bomItems];
    newItems.splice(index, 1);
    setBomItems(newItems);
  };

  const updateBomItem = (index: number, field: string, value: any) => {
    const newItems = [...bomItems] as any[];
    newItems[index][field] = value;
    setBomItems(newItems);
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in flex flex-col">
      <div className="glass-panel p-6 mb-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h2 className="text-h3 font-bold text-white flex items-center">
              <Layers className="h-6 w-6 mr-3 text-blue-400" />
              Engineering & Design
            </h2>
            <p className="text-sm text-slate-400 mt-1">Manage CAD Drawings and Bill of Materials (BOM) for {project.projectNumber}.</p>
          </div>
          <div className="space-x-3 flex">
            <button onClick={() => setShowDrawingModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center">
              Add Drawing
            </button>
            <button onClick={() => {
              setBomItems([{ materialId: "", requiredQty: 1, estimatedCost: 0 }]);
              setShowBomModal(true);
            }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center">
              Create New BOM
            </button>
            {activeBom && activeBom.approvalStatus === 'PENDING' && (
              <button onClick={handleApproveBom} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all flex items-center">
                Approve Active BOM
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-blue-500/30 transition-all">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-400 mr-3" />
              <h3 className="font-bold text-white">Drawings Library</h3>
            </div>
            
            <div className="space-y-3">
              {project.drawings && project.drawings.length > 0 ? project.drawings.map((dwg: any) => (
                <div key={dwg.id} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                  <span className="font-mono text-sm text-blue-300 font-bold">{dwg.drawingNumber}</span>
                  <span className="text-xs text-slate-500">Rev {dwg.revision}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-500 italic">No drawings attached.</p>
              )}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-blue-500/30 transition-all flex flex-col max-h-[400px]">
            <div className="flex items-center mb-4 shrink-0 justify-between">
              <div className="flex items-center">
                <Layers className="h-6 w-6 text-blue-400 mr-3" />
                <h3 className="font-bold text-white">Active BOM</h3>
              </div>
              {activeBom && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  activeBom.approvalStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {activeBom.approvalStatus}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
              {activeBom && activeBom.items ? (
                <>
                  <div className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                    <span>Material</span>
                    <span>Qty</span>
                  </div>
                  {activeBom.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                      <span className="text-sm text-slate-300 font-medium">
                        {item.material?.materialName || 'Unknown Material'}
                      </span>
                      <span className="font-mono text-blue-400 font-bold">{item.requiredQty}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total Est. Cost</span>
                    <span className="text-emerald-400 font-bold font-mono">₹{activeBom.totalEstimatedCost}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 italic">No active BOM exists for this project.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up border border-blue-500/20">
            <h2 className="text-h4 font-bold mb-6 text-white">Import CAD Drawing</h2>
            <form onSubmit={handleUploadDrawing} className="space-y-4">
              <Input
                label="Drawing Reference"
                type="text"
                value={drawingNum}
                onChange={(e) => setDrawingNum(e.target.value)}
                required
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowDrawingModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-panel w-full max-w-3xl p-8 animate-slide-up border border-blue-500/20 max-h-[90vh] flex flex-col">
            <h2 className="text-h4 font-bold mb-6 text-white shrink-0">Draft New BOM</h2>
            
            <form onSubmit={handleSubmitBom} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="grid grid-cols-12 gap-4 mb-2">
                  <div className="col-span-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Material</div>
                  <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Qty</div>
                  <div className="col-span-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Cost (Total)</div>
                  <div className="col-span-1"></div>
                </div>
                
                {bomItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <select
                        required
                        className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 transition-colors"
                        value={item.materialId}
                        onChange={(e) => updateBomItem(index, 'materialId', e.target.value)}
                      >
                        <option value="">Select Material...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.materialName} ({m.materialGrade})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 transition-colors"
                        value={item.requiredQty}
                        onChange={(e) => updateBomItem(index, 'requiredQty', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500/50 transition-colors"
                        value={item.estimatedCost}
                        onChange={(e) => updateBomItem(index, 'estimatedCost', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button 
                        type="button" 
                        onClick={() => removeBomItemRow(index)}
                        className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        disabled={bomItems.length === 1}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={addBomItemRow}
                  className="w-full py-3 mt-4 border-2 border-dashed border-blue-500/30 text-blue-400 rounded-lg font-bold text-sm hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                >
                  + Add Material Line
                </button>
              </div>

              <div className="flex space-x-3 pt-6 shrink-0 border-t border-white/10 mt-6">
                <button type="button" onClick={() => setShowBomModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Save Draft BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
