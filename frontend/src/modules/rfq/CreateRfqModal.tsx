"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, Briefcase, PlusCircle, Building2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RfqService } from "@/services/rfq.service";
import { useProjects } from "@/hooks/useProjects";

interface CreateRfqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialProjectId?: string;
}

interface RfqItemRow {
  partName: string;
  partDescription: string;
  quantity: number;
  uom: string;
  specifications: string;
  drawingReference: string;
}

const EMPTY_ITEM: RfqItemRow = {
  partName: "",
  partDescription: "",
  quantity: 1,
  uom: "NOS",
  specifications: "",
  drawingReference: "",
};

export function CreateRfqModal({ isOpen, onClose, onCreated, initialProjectId }: CreateRfqModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const { data: projects = [] } = useProjects();

  // ─── Form State ───────────────────────────────────────────
  const [mode, setMode] = useState<"NEW_PROJECT" | "EXISTING_PROJECT">(
    initialProjectId ? "EXISTING_PROJECT" : "NEW_PROJECT"
  );
  const [projectId, setProjectId] = useState<string>(initialProjectId || "");
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<RfqItemRow[]>([{ ...EMPTY_ITEM }]);

  // ─── Fetch Customers ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      import("@/services/master-data.service").then(({ MasterDataService }) => {
        MasterDataService.getRegistry('customers').then((data: any) => {
          setCustomers(Array.isArray(data) ? data : data?.data || []);
        }).catch(() => setCustomers([]));
      });
    }
  }, [isOpen]);

  // ─── Sync when initialProjectId changes ───────────────────
  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
      setMode("EXISTING_PROJECT");
    }
  }, [initialProjectId]);

  // ─── Auto-fill from selected project ──────────────────────
  useEffect(() => {
    if (mode === "EXISTING_PROJECT" && projectId && projects.length > 0) {
      const proj = projects.find((p: any) => p.id === projectId);
      if (proj) {
        if (proj.customerId) setCustomerId(proj.customerId);
        if (!subject) setSubject(`Tooling Modification / Addon for ${proj.partName || proj.projectNumber}`);
        if (proj.targetDeliveryDate && !expectedDeliveryDate) {
          setExpectedDeliveryDate(proj.targetDeliveryDate.slice(0, 10));
        }
      }
    }
  }, [mode, projectId, projects]);

  // ─── Auto-fill contact from customer ──────────────────────
  useEffect(() => {
    if (customerId) {
      const cust = customers.find((c) => c.id === customerId);
      if (cust) {
        setContactPerson(cust.contactPerson || "");
        setContactEmail(cust.contactEmail || "");
        setContactPhone(cust.contactPhone || "");
      }
    }
  }, [customerId, customers]);

  // ─── Item Management ──────────────────────────────────────
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof RfqItemRow, value: any) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  // ─── Submit ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setError("");
    if (!customerId) { setError("Please select a customer."); return; }
    if (!subject.trim()) { setError("Please enter a subject."); return; }
    if (items.length === 0 || !items[0].partName.trim()) { setError("Add at least one item with a part name."); return; }

    setSaving(true);
    try {
      await RfqService.createRfq({
        customerId,
        projectId: mode === "EXISTING_PROJECT" && projectId ? projectId : undefined,
        subject: subject.trim(),
        description: description.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        remarks: remarks.trim() || undefined,
        items: items.filter((i) => i.partName.trim()).map((i) => ({
          partName: i.partName.trim(),
          partDescription: i.partDescription.trim() || undefined,
          quantity: Number(i.quantity) || 1,
          uom: i.uom || "NOS",
          specifications: i.specifications.trim() || undefined,
          drawingReference: i.drawingReference.trim() || undefined,
        })),
      });
      // Reset form
      setCustomerId("");
      setProjectId("");
      setSubject("");
      setDescription("");
      setContactPerson("");
      setContactEmail("");
      setContactPhone("");
      setExpectedDeliveryDate("");
      setRemarks("");
      setItems([{ ...EMPTY_ITEM }]);
      onCreated();
    } catch (err: any) {
      setError(err?.message || "Failed to create RFQ.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-body-sm text-ink bg-white border border-border-gray rounded-[10px] placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
  const labelClass = "block text-caption font-semibold text-cool-gray mb-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Request for Quotation (RFQ)"
      subtitle="Create a pre-sales enquiry for a new project, or quote modifications for an existing project"
      maxWidth="3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={saving}>
            Create RFQ
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-semantic-danger-subtle border border-semantic-danger/20 rounded-[10px] p-3 text-body-sm text-semantic-danger-dark">
            {error}
          </div>
        )}

        {/* ─── Mode Selector (New Project vs Existing Project) ─ */}
        {!initialProjectId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-canvas border border-border-gray rounded-[12px]">
            <button
              type="button"
              onClick={() => { setMode("NEW_PROJECT"); setProjectId(""); }}
              className={`flex items-center gap-2.5 p-3 rounded-[10px] text-left transition-all cursor-pointer ${
                mode === "NEW_PROJECT"
                  ? "bg-white border border-primary/30 shadow-subtle text-ink font-semibold"
                  : "text-cool-gray hover:text-ink"
              }`}
            >
              <div className={`p-2 rounded-[8px] ${mode === "NEW_PROJECT" ? "bg-primary-subtle text-primary" : "bg-hairline/20 text-mute"}`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-body-sm font-medium">New Project Enquiry</p>
                <p className="text-caption text-mute">Prospective enquiry to be converted to a Project when won</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("EXISTING_PROJECT")}
              className={`flex items-center gap-2.5 p-3 rounded-[10px] text-left transition-all cursor-pointer ${
                mode === "EXISTING_PROJECT"
                  ? "bg-white border border-primary/30 shadow-subtle text-ink font-semibold"
                  : "text-cool-gray hover:text-ink"
              }`}
            >
              <div className={`p-2 rounded-[8px] ${mode === "EXISTING_PROJECT" ? "bg-primary-subtle text-primary" : "bg-hairline/20 text-mute"}`}>
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-body-sm font-medium">Existing Project</p>
                <p className="text-caption text-mute">Quote for modification, ECR, tooling repair, or spare cavity</p>
              </div>
            </button>
          </div>
        )}

        {/* ─── Existing Project Selector ─────────────────────── */}
        {mode === "EXISTING_PROJECT" && (
          <div className="bg-primary-subtle/30 border border-primary/20 rounded-[12px] p-4 space-y-2">
            <label className={labelClass}>Associated Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!!initialProjectId}
              className={inputClass}
            >
              <option value="">Select Existing Project...</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.projectNumber} — {p.partName} ({p.customer?.companyName || "No Customer"})
                </option>
              ))}
            </select>
            <p className="text-caption text-mute">
              Customer details and part references will be automatically linked to this Project.
            </p>
          </div>
        )}

        {/* ─── Header Fields ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName} ({c.customerCode})</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Subject / Enquiry Title *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Injection Mould for Dashboard Panel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Person</label>
            <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Name" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@company.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Phone</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 9876543210" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Expected Delivery Date</label>
            <input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} className={inputClass} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description / Scope</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional technical requirements, drawing notes, scope..." rows={2} className={inputClass} />
          </div>
        </div>

        {/* ─── Line Items ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-body font-semibold text-ink">Line Items ({items.length})</h3>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addItem}>
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-canvas border border-border-gray rounded-[10px] p-4 relative group">
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="absolute top-3 right-3 p-1 rounded-[6px] text-mute hover:text-semantic-danger-dark hover:bg-semantic-danger-subtle transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Part Name *</label>
                    <input type="text" value={item.partName} onChange={(e) => updateItem(idx, "partName", e.target.value)} placeholder="e.g. Core Insert / Top Plate" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Qty</label>
                    <input type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} min={1} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>UOM</label>
                    <select value={item.uom} onChange={(e) => updateItem(idx, "uom", e.target.value)} className={inputClass}>
                      <option value="NOS">NOS</option>
                      <option value="KG">KG</option>
                      <option value="SET">SET</option>
                      <option value="MTR">MTR</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Description / Size</label>
                    <input type="text" value={item.partDescription} onChange={(e) => updateItem(idx, "partDescription", e.target.value)} placeholder="Material, Dimensions, Grade..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Specifications</label>
                    <input type="text" value={item.specifications} onChange={(e) => updateItem(idx, "specifications", e.target.value)} placeholder="Tolerances, Hardness..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Drawing Ref</label>
                    <input type="text" value={item.drawingReference} onChange={(e) => updateItem(idx, "drawingReference", e.target.value)} placeholder="DWG-001 Rev B" className={inputClass} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Remarks ───────────────────────────────────────── */}
        <div>
          <label className={labelClass}>Remarks</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Commercial notes, vendor exclusions, etc." rows={2} className={inputClass} />
        </div>
      </div>
    </Modal>
  );
}
