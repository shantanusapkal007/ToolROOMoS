"use client";

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Sidebar } from "../components/layout/Sidebar";
import { MissionControl } from "../components/dashboard/MissionControl";
import { WorkflowTimeline } from "../components/workspace/WorkflowTimeline";
import { SettingsModule } from "../modules/settings/SettingsModule";
import { 
  FileText, Hammer, ShoppingCart, CheckSquare, 
  Truck, DollarSign, Clock, Users, ArrowRight,
  Activity, Plus, CheckCircle2, Factory, Package, Layers
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "projects" | "master-data" | "reports">("dashboard");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectTab, setProjectTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);

  // --- State for Forms & Modals ---
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectNumber, setNewProjectNumber] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newCustomerPo, setNewCustomerPo] = useState("");
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState("");

  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [drawingNum, setDrawingNum] = useState("");
  
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomEstCost, setBomEstCost] = useState(5000);
  const [bomQty, setBomQty] = useState(2);
  
  const [showPoModal, setShowPoModal] = useState(false);
  const [poNum, setPoNum] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [poRate, setPoRate] = useState(5000);
  const [poQty, setPoQty] = useState(2);
  
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnNum, setGrnNum] = useState("");
  const [grnHeatNum, setGrnHeatNum] = useState("HEAT-2026-X");

  const [showMsdrModal, setShowMsdrModal] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [setupTime, setSetupTime] = useState(2);
  const [cuttingTime, setCuttingTime] = useState(8);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invNum, setInvNum] = useState("");
  const [invAmount, setInvAmount] = useState(45000);

  // --- API Fetchers ---
  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("projects");
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setSelectedProject(res.data);
    } catch (err) {
      console.error("Failed to load project details", err);
    }
  };

  const loadMasterData = async () => {
    try {
      const [custRes, vendRes, matRes, machRes, empRes] = await Promise.all([
        api.get("master-data/customers"),
        api.get("master-data/vendors"),
        api.get("master-data/materials"),
        api.get("master-data/machines"),
        api.get("master-data/employees"),
      ]);
      setCustomers(custRes.data || []);
      setVendors(vendRes.data || []);
      setMaterials(matRes.data || []);
      setMachines(machRes.data || []);
      setEmployees(empRes.data || []);

      if (custRes.data?.length > 0) setSelectedCustomerId(custRes.data[0].id);
      if (machRes.data?.length > 0) {
        setSelectedMachineId(machRes.data[0].id);
        setSelectedPlantId(machRes.data[0].plantId);
      }
      if (empRes.data?.length > 0) setSelectedEmployeeId(empRes.data[0].id);
      if (vendRes.data?.length > 0) setSelectedVendorId(vendRes.data[0].id);
    } catch (err) {
      console.error("Failed to load master registers", err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadMasterData();
  }, []);

  // --- Handlers ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("projects", {
        projectNumber: newProjectNumber,
        partName: newPartName,
        customerPoNumber: newCustomerPo,
        customerId: selectedCustomerId,
        plantId: selectedPlantId || "PL-01",
      });
      setShowNewProjectModal(false);
      loadProjects();
      loadProjectDetails(res.data.id);
    } catch (err: any) { alert(err.message); }
  };

  const handleUploadDrawing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`projects/${selectedProject.id}/drawings`, {
        drawingNumber: drawingNum,
        fileUrl: `s3://toolroomos/drawings/${drawingNum.toLowerCase()}.dxf`,
      });
      setShowDrawingModal(false);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleSubmitBom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || materials.length === 0) return;
    try {
      await api.post(`projects/${selectedProject.id}/bom`, {
        items: [{ materialId: materials[0].id, requiredQty: bomQty, estimatedCost: bomEstCost }]
      });
      setShowBomModal(false);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleApproveBom = async () => {
    if (!selectedProject) return;
    try {
      const bomRes = await api.get(`projects/${selectedProject.id}/bom`);
      if (!bomRes.data) return alert("No draft BOM found.");
      await api.put(`projects/${selectedProject.id}/bom/${bomRes.data.id}/approve`);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || materials.length === 0) return;
    try {
      await api.post(`projects/${selectedProject.id}/purchase-orders`, {
        vendorId: selectedVendorId,
        poNumber: poNum,
        items: [{ materialId: materials[0].id, orderedQty: poQty, agreedRate: poRate }]
      });
      setShowPoModal(false);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const poRes = await api.get(`projects/${selectedProject.id}/purchase-orders`);
      if (!poRes.data || poRes.data.length === 0) return alert("No active PO found.");
      const activePo = poRes.data[0];
      await api.post(`projects/${selectedProject.id}/goods-receipts`, {
        poHeaderId: activePo.id,
        grnNumber: grnNum,
        items: [{
          poItemId: activePo.items[0].id,
          receivedQty: activePo.items[0].orderedQty,
          acceptedQty: activePo.items[0].orderedQty,
          actualRate: activePo.items[0].agreedRate,
          heatNumber: grnHeatNum,
        }]
      });
      setShowGrnModal(false);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleIssueMaterial = async () => {
    if (!selectedProject) return;
    try {
      const grnRes = await api.get(`projects/${selectedProject.id}/goods-receipts`);
      if (!grnRes.data || grnRes.data.length === 0) return alert("No received material available.");
      await api.post(`projects/${selectedProject.id}/material-issues`, {
        issueNumber: `ISS-${Date.now().toString().slice(-4)}`,
        items: [{ inventoryBatchId: grnRes.data[0].items[0].inventoryBatchId || "temp-batch", issuedQty: grnRes.data[0].items[0].acceptedQty }]
      });
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleLogMsdr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await api.post(`projects/${selectedProject.id}/machine-shop-reports`, {
        machineId: selectedMachineId,
        employeeId: selectedEmployeeId,
        reportDate: new Date().toISOString(),
        startTime: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        setupTime: setupTime,
        cuttingTime: cuttingTime,
        producedQty: 1,
      });
      setShowMsdrModal(false);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handlePassInspection = async () => {
    if (!selectedProject) return;
    try {
      await api.post(`projects/${selectedProject.id}/inspections`, { inspectedQty: 1, passedQty: 1, result: "PASS" });
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateDispatch = async () => {
    if (!selectedProject) return;
    try {
      await api.post(`projects/${selectedProject.id}/dispatches`, {
        dispatchNumber: `DISP-${Date.now().toString().slice(-4)}`,
        dispatchQty: 1, logisticsCost: 250,
      });
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      const dispRes = await api.get(`projects/${selectedProject.id}/dispatches`);
      if (!dispRes.data || dispRes.data.length === 0) return alert("No dispatch note found.");
      await api.post(`projects/${selectedProject.id}/invoices`, {
        dispatchNoteId: dispRes.data[0].id,
        invoiceNumber: invNum,
        subtotal: invAmount,
        taxAmount: invAmount * 0.18,
        totalAmount: invAmount * 1.18,
      });
      setShowInvoiceModal(false);
      await loadProjectDetails(selectedProject.id);
      loadProjects();
    } catch (err: any) { alert(err.message); }
  };

  // ----------------------------------------------------
  // RENDER MISSION CONTROL INTERFACE
  // ----------------------------------------------------
  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setSelectedProject={setSelectedProject} 
      />

      <main className="flex-1 h-full flex flex-col relative z-0 pl-16">
        
        {/* VIEW ROUTER */}
        {activeTab === "master-data" && !selectedProject && (
          <SettingsModule />
        )}

        {activeTab === "dashboard" && !selectedProject && (
          <MissionControl 
            projects={projects} 
            onSelectProject={(proj) => {
              loadProjectDetails(proj.id);
              setActiveTab("projects");
              setProjectTab("overview");
            }} 
          />
        )}

        {activeTab === "projects" && !selectedProject && (
          <div className="flex-1 p-12 overflow-y-auto pl-32 animate-fade-in">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-h1 tracking-tight mb-2">Projects</h1>
                <p className="text-h5 text-slate-400">All active factory orders.</p>
              </div>
              <button 
                onClick={() => setShowNewProjectModal(true)}
                className="glass-panel px-6 py-3 font-semibold hover:bg-white/10 flex items-center shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Initialize Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(proj => (
                <div 
                  key={proj.id} 
                  onClick={() => {
                    loadProjectDetails(proj.id);
                    setProjectTab("overview");
                  }}
                  className="glass-panel p-6 cursor-pointer group hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] flex flex-col justify-between"
                >
                  <div className="mb-8">
                    <p className="text-xs font-bold text-slate-500 tracking-widest mb-1">{proj.projectNumber}</p>
                    <h3 className="text-h4 font-semibold text-white group-hover:text-blue-400 transition-colors">{proj.partName}</h3>
                    <p className="text-sm text-slate-400 mt-2">{proj.customer?.name || "Customer Pending"}</p>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-4">
                    <div className="flex items-center text-xs font-medium text-slate-300">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                      {proj.currentStage}
                    </div>
                    <span className="text-xs text-slate-500">{new Date(proj.deliveryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECT WORKSPACE (The Core Layer) */}
        {selectedProject && (
          <div className="flex-1 h-full flex flex-col pl-32 pr-12 animate-slide-up">
            
            {/* Linear Style Context Header */}
            <header className="pt-12 pb-8 flex flex-col justify-between shrink-0">
              <div className="flex items-center text-sm font-semibold text-slate-500 mb-6 uppercase tracking-widest">
                <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setSelectedProject(null)}>Projects</span>
                <span className="mx-2">/</span>
                <span className="text-blue-400">{selectedProject.projectNumber}</span>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-h1 tracking-tight text-white mb-2">{selectedProject.partName}</h1>
                  <p className="text-h6 text-slate-400 font-normal">Customer PO: {selectedProject.customerPoNumber}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-2">Delivery Target</div>
                  <div className="text-h4 font-bold text-white flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-500" />
                    {new Date(selectedProject.deliveryDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </header>

            {/* Visual Timeline Navigation */}
            <WorkflowTimeline currentStage={selectedProject.currentStage} />

            {/* Project Navigation Tabs */}
            <div className="flex space-x-8 border-b border-white/10 mb-8 mt-4 px-2 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button onClick={() => setProjectTab("overview")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "overview" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Overview</button>
              <button onClick={() => setProjectTab("engineering")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "engineering" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Engineering</button>
              <button onClick={() => setProjectTab("purchase")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "purchase" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Purchase</button>
              <button onClick={() => setProjectTab("inventory")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "inventory" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Inventory</button>
              <button onClick={() => setProjectTab("production")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "production" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Production</button>
              <button onClick={() => setProjectTab("quality")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "quality" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Quality</button>
              <button onClick={() => setProjectTab("dispatch")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "dispatch" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Dispatch</button>
              <button onClick={() => setProjectTab("finance")} className={`pb-4 text-sm font-bold tracking-wider uppercase transition-all ${projectTab === "finance" ? "text-blue-400 border-b-2 border-blue-400" : "text-slate-400 hover:text-slate-200"}`}>Finance</button>
            </div>

            {projectTab === "overview" && (
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-8 pb-32">
              
              {/* Main Action Panel (Left 2 Columns) */}
              <div className="col-span-2 space-y-6">
                
                <div className="glass-panel p-8">
                  <h2 className="text-h4 font-semibold mb-6 flex items-center">
                    <Activity className="h-5 w-5 mr-3 text-blue-500" />
                    Current Stage Actions
                  </h2>

                  {/* Contextual Actions based on Stage */}
                  <div className="space-y-4">
                    {["CREATED", "ENGINEERING"].includes(selectedProject.currentStage) && (
                      <div className="flex space-x-4">
                        <button onClick={() => setShowDrawingModal(true)} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg transition-all">Import Drawing</button>
                        <button onClick={() => setShowBomModal(true)} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg transition-all">Create Draft BOM</button>
                        <button onClick={handleApproveBom} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg transition-all">Approve BOM</button>
                      </div>
                    )}

                    {selectedProject.currentStage === "PROCUREMENT" && (
                      <button onClick={() => setShowPoModal(true)} className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg transition-all">Generate Vendor PO</button>
                    )}

                    {selectedProject.currentStage === "MATERIAL_AVAILABLE" && (
                      <div className="flex space-x-4">
                        <button onClick={() => setShowGrnModal(true)} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg transition-all">Receive Material (GRN)</button>
                        <button onClick={handleIssueMaterial} className="px-5 py-2.5 rounded-lg glass-panel hover:bg-white/10 text-white font-medium transition-all">Issue to Floor</button>
                      </div>
                    )}

                    {selectedProject.currentStage === "PRODUCTION" && (
                      <button onClick={() => setShowMsdrModal(true)} className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-lg transition-all">Log Machine Time</button>
                    )}

                    {selectedProject.currentStage === "INSPECTION" && (
                      <button onClick={handlePassInspection} className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg transition-all">Log Quality PASS</button>
                    )}

                    {selectedProject.currentStage === "DISPATCH_READY" && (
                      <button onClick={handleCreateDispatch} className="px-5 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg transition-all">Log Dispatch Note</button>
                    )}

                    {selectedProject.currentStage === "INVOICED" && (
                      <button onClick={() => setShowInvoiceModal(true)} className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium shadow-lg transition-all">Generate Tax Invoice</button>
                    )}
                  </div>
                </div>

                {/* Document Gallery */}
                <div className="glass-panel p-8">
                  <h3 className="text-h6 font-medium mb-6 text-slate-300">Project Documents</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProject.drawings?.map((drw: any) => (
                      <div key={drw.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                        <FileText className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                        <p className="font-semibold text-sm truncate">{drw.drawingNumber}</p>
                        <p className="text-xs text-slate-500 mt-1">Rev {drw.revision}</p>
                      </div>
                    ))}
                    {selectedProject.projectCostSummary && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                        <DollarSign className="h-8 w-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                        <p className="font-semibold text-sm">Cost Ledger</p>
                        <p className="text-xs text-slate-500 mt-1">Auto-generated</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Sidebar Panel (Right Column) */}
              <div className="col-span-1 space-y-6">
                
                {/* Financial Pipeline (Visual Flow) */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-6">COST PIPELINE</h3>
                  
                  <div className="relative border-l border-white/10 ml-3 space-y-6">
                    
                    <div className="relative pl-6">
                      <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-slate-500"></div>
                      <p className="text-xs text-slate-500">Estimated Material</p>
                      <p className="font-semibold text-white">${selectedProject.projectCostSummary?.estimatedMaterialCost || 0}</p>
                    </div>
                    
                    <div className="relative pl-6">
                      <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-amber-500"></div>
                      <p className="text-xs text-slate-500">Actual Sourced Cost</p>
                      <p className="font-semibold text-white">${selectedProject.projectCostSummary?.actualMaterialCost || 0}</p>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-purple-500"></div>
                      <p className="text-xs text-slate-500">Machine Production</p>
                      <p className="font-semibold text-white">${selectedProject.projectCostSummary?.machineCost || 0}</p>
                    </div>

                    <div className="relative pl-6">
                      <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-orange-500"></div>
                      <p className="text-xs text-slate-500">Logistics / Dispatch</p>
                      <p className="font-semibold text-white">${selectedProject.projectCostSummary?.logisticsCost || 0}</p>
                    </div>

                    <div className="relative pl-6 mt-8 border-t border-white/10 pt-4">
                      <div className="absolute left-[-5px] top-6 h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                      <p className="text-xs text-green-400 font-bold tracking-widest uppercase">Net Profitability</p>
                      <p className="text-h3 font-bold text-white drop-shadow-md">${
                        (selectedProject.projectCostSummary?.invoicedRevenue || 0) - 
                        (selectedProject.projectCostSummary?.totalActualCost || 0)
                      }</p>
                    </div>

                  </div>
                </div>

                {/* Live Activity Feed */}
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-bold text-slate-400 tracking-wider mb-6">ACTIVITY FEED</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto hide-scrollbar">
                    {selectedProject.projectActivities?.map((act: any) => (
                      <div key={act.id} className="flex flex-col text-sm border-b border-white/5 pb-4 last:border-0">
                        <span className="text-xs text-slate-500 mb-1">{new Date(act.performedAt).toLocaleTimeString()}</span>
                        <span className="font-medium text-slate-200">{act.action}</span>
                        <span className="text-slate-400">{act.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
            )}

            {projectTab === "engineering" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Engineering Documentation</h2>
                    <p className="text-slate-400 mb-6">Manage Drawings, BOMs, and Engineering Specifications for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <FileText className="h-6 w-6 text-blue-400 mb-3" />
                        <h3 className="font-semibold text-white">Drawings Library</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.drawings?.length || 0} drawings imported</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <Layers className="h-6 w-6 text-blue-400 mb-3" />
                        <h3 className="font-semibold text-white">Bill of Materials (BOM)</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.billOfMaterialHeaders?.length || 0} BOM revisions</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}
            
            {projectTab === "purchase" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Purchase & Procurement</h2>
                    <p className="text-slate-400 mb-6">Manage Vendor POs, RFQs, and Material Sourcing for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <ShoppingCart className="h-6 w-6 text-amber-400 mb-3" />
                        <h3 className="font-semibold text-white">Purchase Orders</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.purchaseOrderHeaders?.length || 0} external orders</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {projectTab === "inventory" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Inventory & Shop Floor</h2>
                    <p className="text-slate-400 mb-6">Manage Goods Receipts (GRN), Material Issues, and Machine Routing for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <Package className="h-6 w-6 text-emerald-400 mb-3" />
                        <h3 className="font-semibold text-white">Goods Receipts (GRN)</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.goodsReceiptHeaders?.length || 0} receipts logged</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <Factory className="h-6 w-6 text-purple-400 mb-3" />
                        <h3 className="font-semibold text-white">Material Issues</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.materialIssueHeaders?.length || 0} issues to floor</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {projectTab === "production" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Production & Manufacturing</h2>
                    <p className="text-slate-400 mb-6">Manage Shop Floor Routing and Machine Operations for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <Activity className="h-6 w-6 text-cyan-400 mb-3" />
                        <h3 className="font-semibold text-white">Machine Logs (MSDR)</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.machineShopReports?.length || 0} operations logged</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {projectTab === "quality" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Quality Assurance</h2>
                    <p className="text-slate-400 mb-6">Manage Quality Inspections and NCRs for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <CheckSquare className="h-6 w-6 text-green-400 mb-3" />
                        <h3 className="font-semibold text-white">Inspection Reports</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.inspectionHeaders?.length || 0} inspections logged</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {projectTab === "dispatch" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Logistics & Dispatch</h2>
                    <p className="text-slate-400 mb-6">Manage Packing and Dispatch Notes for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <Truck className="h-6 w-6 text-blue-400 mb-3" />
                        <h3 className="font-semibold text-white">Dispatch Notes</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.dispatchNotes?.length || 0} dispatches completed</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}

            {projectTab === "finance" && (
               <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
                  <div className="glass-panel p-8">
                    <h2 className="text-h4 font-semibold mb-6 flex items-center text-white">Finance & Billing</h2>
                    <p className="text-slate-400 mb-6">Manage Invoices and Cost Analysis for {selectedProject.projectNumber}.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <DollarSign className="h-6 w-6 text-green-400 mb-3" />
                        <h3 className="font-semibold text-white">Invoices</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedProject.invoiceHeaders?.length || 0} invoices generated</p>
                      </div>
                    </div>
                  </div>
               </div>
            )}
          </div>
        )}

      </main>

      {/* MODALS: Quick implementations replacing standard boxes with Glass panels */}
      {showDrawingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up bg-[#0B1018]">
            <h2 className="text-h4 font-bold mb-6 text-white">Import CAD Drawing</h2>
            <form onSubmit={handleUploadDrawing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Drawing Reference</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all" 
                  value={drawingNum} onChange={(e) => setDrawingNum(e.target.value)} required 
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowDrawingModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGrnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up bg-[#0B1018]">
            <h2 className="text-h4 font-bold mb-2 text-white">Receive Material</h2>
            <p className="text-slate-400 mb-6 text-sm">Fulfill the vendor purchase order.</p>
            <form onSubmit={handleCreateGrn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">GRN Number</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all" value={grnNum} onChange={(e) => setGrnNum(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Heat / Batch Number</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all" value={grnHeatNum} onChange={(e) => setGrnHeatNum(e.target.value)} required />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">Receive (GRN)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Modals simplified for brevity but utilizing glass panels... */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-8 animate-slide-up bg-[#0B1018]">
            <h2 className="text-h3 font-bold mb-6 text-white tracking-tight">Initialize Mission</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Project No.</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-all outline-none" value={newProjectNumber} onChange={e => setNewProjectNumber(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Part Name</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-all outline-none" value={newPartName} onChange={e => setNewPartName(e.target.value)} required />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-6 py-3 mr-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">Launch Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
