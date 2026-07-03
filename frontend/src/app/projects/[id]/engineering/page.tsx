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
  const [bomEstCost, setBomEstCost] = useState(5000);
  const [bomQty, setBomQty] = useState(2);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
    loadMaterials();
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
    if (!project || materials.length === 0) return;
    try {
      await api.post(`projects/${project.id}/bom`, {
        items: [{ materialId: materials[0].id, requiredQty: bomQty, estimatedCost: bomEstCost }]
      });
      setShowBomModal(false);
      success("BOM Generated", "The draft BOM has been successfully created.");
      loadProjectDetails(project.id);
    } catch (err: any) { error("Failed", err.message); }
  };

  const handleApproveBom = async () => {
    if (!project) return;
    try {
      const bomRes = await api.get(`projects/${project.id}/bom`);
      if (!bomRes.data) return warning("No BOM Found", "No draft BOM found to approve.");
      await api.put(`projects/${project.id}/bom/${bomRes.data.id}/approve`);
      success("BOM Approved", "The Bill of Materials has been approved for procurement.");
      loadProjectDetails(project.id);
    } catch (err: any) { error("Failed", err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold flex items-center text-white">Engineering Documentation</h2>
            <p className="text-slate-400">Manage Drawings, BOMs, and Engineering Specifications for {project.projectNumber}.</p>
          </div>
          <div className="space-x-3">
            <button onClick={() => setShowDrawingModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Add Drawing</button>
            <button onClick={() => setShowBomModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Create BOM</button>
            <button onClick={handleApproveBom} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">Approve BOM</button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <FileText className="h-6 w-6 text-blue-400 mb-3" />
            <h3 className="font-semibold text-white">Drawings Library</h3>
            <p className="text-sm text-slate-500 mt-1">{project.drawings?.length || 0} drawings imported</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <Layers className="h-6 w-6 text-blue-400 mb-3" />
            <h3 className="font-semibold text-white">Bill of Materials (BOM)</h3>
            <p className="text-sm text-slate-500 mt-1">{project.billOfMaterialHeaders?.length || 0} BOM revisions</p>
          </div>
        </div>
      </div>

      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
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
                <button type="button" onClick={() => setShowDrawingModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium">Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
            <h2 className="text-h4 font-bold mb-6 text-white">Draft BOM</h2>
            <form onSubmit={handleSubmitBom} className="space-y-4">
              <Input
                label="Estimated Cost"
                type="number"
                value={bomEstCost}
                onChange={(e) => setBomEstCost(Number(e.target.value))}
                required
              />
              <Input
                label="Quantity"
                type="number"
                value={bomQty}
                onChange={(e) => setBomQty(Number(e.target.value))}
                required
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowBomModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium">Save BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
