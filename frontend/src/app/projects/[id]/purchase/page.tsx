"use client";

import React, { useState } from 'react';
import { api } from "../../../../lib/api";
import { ShoppingCart, Plus, FileText, Package, ArrowRight, ChevronRight, CheckCircle2, Clock, X, Calendar, Activity, Info, Download, Trash2, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useMasterData } from "../../../../hooks/useMasterData";
import { usePurchaseOrders, useCreatePurchaseOrder, useProcessGRN, useUpdatePurchaseOrder } from "../../../../hooks/useProcurement";
import { motion } from 'framer-motion';
import { PremiumDrawer } from '../../../../components/ui/PremiumDrawer';
import { Edit2 } from "lucide-react";

export default function PurchaseTab({ params }: { params: Promise<{ id: string }> }) {
  const { error, success } = useToast();
  const resolvedParams = React.use(params);
  
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useProject(resolvedParams.id);
  const { data: vendors } = useMasterData('vendors');
  const { data: materials } = useMasterData('materials');
  const { data: warehouses } = useMasterData('warehouses');
  const { data: purchaseOrders, refetch: refetchPurchaseOrders } = usePurchaseOrders(resolvedParams.id);

  const createPOMutation = useCreatePurchaseOrder(resolvedParams.id);
  const updatePOMutation = useUpdatePurchaseOrder(resolvedParams.id);
  const processGRNMutation = useProcessGRN(resolvedParams.id);

  const [showPoModal, setShowPoModal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [viewingPoDetails, setViewingPoDetails] = useState<any>(null);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  
  const [poNum, setPoNum] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [poItems, setPoItems] = useState<any[]>([{ materialId: "", orderedQty: 1, agreedRate: 0, dimensions: "", hsnCode: "", gstPercent: 18, uom: "NOS", discount: 0, cgst: 9, sgst: 9, basicValue: 0 }]);
  
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [grnData, setGrnData] = useState({
    grnNumber: "",
    supplierChallan: "",
    warehouseId: "DEFAULT-WH",
    remarks: "",
    items: [{ poItemId: "", receivedQty: 1, acceptedQty: 1, rejectedQty: 0, actualRate: 0, heatNumber: "", toolNo: "", detNo: "", length: 0, width: 0, height: 0, apWeight: 0, totalWeight: 0, basicCost: 0, gst: 0, total: 0, remarks: "" }]
  });

  const filteredVendors = (vendors || []).filter((v: any) => v.vendorType === 'MATERIAL_SUPPLIER');

  if (projectLoading || !project) return null;

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    if (poItems.some(i => !i.materialId || i.orderedQty <= 0 || i.agreedRate <= 0)) {
      return error("Validation Error", "All items must have a material, quantity, and rate > 0.");
    }

    try {
      if (editingPoId) {
        await updatePOMutation.mutateAsync({
          poId: editingPoId,
          data: {
            vendorId: selectedVendorId,
            poNumber: poNum,
            expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
            items: poItems
          }
        });
      } else {
        await createPOMutation.mutateAsync({
          vendorId: selectedVendorId,
          poNumber: poNum,
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
          items: poItems
        });
      }
      setShowPoModal(false);
      refetchProject();
      
      setPoNum("");
      setSelectedVendorId("");
      setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
      setEditingPoId(null);
    } catch (err: any) {}
  };

  const openEditPoModal = (po: any) => {
    setEditingPoId(po.id);
    setPoNum(po.poNumber);
    setSelectedVendorId(po.vendorId || "");
    setExpectedDeliveryDate(po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : "");
    setPoItems(po.items.map((i: any) => ({
      materialId: i.materialId,
      orderedQty: i.orderedQty,
      agreedRate: i.agreedRate,
      dimensions: i.dimensions || "",
      hsnCode: i.hsnCode || "",
      gstPercent: i.gstPercent || 18,
      uom: i.uom || "NOS",
      discount: i.discount || 0,
      cgst: i.cgst || (i.gstPercent ? i.gstPercent / 2 : 9),
      sgst: i.sgst || (i.gstPercent ? i.gstPercent / 2 : 9),
      basicValue: i.basicValue || (i.orderedQty * i.agreedRate - (i.discount || 0))
    })));
    setShowPoModal(true);
    setViewingPoDetails(null);
  };

  const openGrnModal = (po: any) => {
    setSelectedPo(po);
    const defaultWH = warehouses && warehouses.length > 0 ? warehouses[0].id : "DEFAULT-WH";
    setGrnData({
      grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
      supplierChallan: "",
      warehouseId: defaultWH,
      remarks: "",
      items: po.items.map((i: any) => ({
        poItemId: i.id,
        receivedQty: i.orderedQty - (i.receivedQty || 0),
        acceptedQty: i.orderedQty - (i.receivedQty || 0),
        rejectedQty: 0,
        heatNumber: "",
        toolNo: i.customFields?.toolNo || "",
        detNo: i.customFields?.detNo || "",
        length: i.customFields?.L || 0,
        width: i.customFields?.W || 0,
        height: i.customFields?.H || 0,
        apWeight: i.customFields?.apWt || 0,
        totalWeight: i.customFields?.totalWt || 0,
        actualRate: i.agreedRate,
        basicCost: i.customFields?.basicCost || 0,
        gst: i.customFields?.gst || 0,
        total: i.customFields?.total || 0,
        remarks: ""
      }))
    });
    setShowGrnModal(true);
  };

  const handleImportPO = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const allRows: any[][] = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
        if (allRows.length === 0) throw new Error("Empty Excel file");

        let docPoNum = "";
        let docVendor = "";
        
        allRows.forEach(row => {
          row.forEach((cell, cellIdx) => {
            if (!cell) return;
            const strCell = cell.toString().trim().toLowerCase();
            if (strCell.includes("po number") || strCell.includes("ponumber")) {
              const val = row[cellIdx + 1] || row[cellIdx + 2];
              if (val) docPoNum = val.toString().trim();
            }
            if (strCell.includes("vendor") || strCell.includes("supplier")) {
              const val = row[cellIdx + 1] || row[cellIdx + 2];
              if (val) docVendor = val.toString().trim();
            }
          });
        });

        if (docPoNum) setPoNum(docPoNum);
        if (docVendor) {
          const matchedVendor = vendors?.find((v:any) => v.vendorName.toLowerCase().includes(docVendor.toLowerCase()));
          if (matchedVendor) setSelectedVendorId(matchedVendor.id);
        }

        let headerRowIndex = -1;
        let colMapping: any = {};
        
        for (let r = 0; r < allRows.length; r++) {
          const row = allRows[r];
          let matches = 0;
          let tempMapping: any = {};

          row.forEach((cell, c) => {
            if (!cell) return;
            const clean = cell.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (clean.includes("material") || clean.includes("desc") || clean.includes("part")) { tempMapping.material = c; matches++; }
            if (clean.includes("qty") || clean.includes("quantity")) { tempMapping.qty = c; matches++; }
            if (clean.includes("rate") || clean.includes("price")) { tempMapping.rate = c; matches++; }
            if (clean.includes("discount") || clean.includes("disc")) { tempMapping.disc = c; }
            if (clean.includes("gst")) { tempMapping.gst = c; }
            if (clean.includes("uom") || clean.includes("unit")) { tempMapping.uom = c; }
            if (clean.includes("dim") || clean.includes("size")) { tempMapping.dim = c; }
            if (clean.includes("hsn")) { tempMapping.hsn = c; }
          });
          
          if (matches >= 2) {
            headerRowIndex = r;
            colMapping = tempMapping;
            break;
          }
        }

        if (headerRowIndex === -1) throw new Error("Could not detect table headers automatically.");

        const parsedItems: any[] = [];
        
        for (let r = headerRowIndex + 1; r < allRows.length; r++) {
          const row = allRows[r];
          const isBlank = row.every(c => c === undefined || c === null || c === '');
          if (isBlank) continue;

          const matStr = colMapping.material !== undefined ? row[colMapping.material]?.toString() : "";
          if (!matStr || matStr.toLowerCase().includes("grand total")) continue;

          let matchedMaterialId = "";
          let hsn = "";
          let defaultGst = 18;
          if (matStr) {
            const mat = materials?.find((m:any) => 
              (m.materialCode && matStr.toLowerCase().includes(m.materialCode.toLowerCase())) || 
              (m.materialGrade && matStr.toLowerCase().includes(m.materialGrade.toLowerCase()))
            );
            if (mat) {
              matchedMaterialId = mat.id;
              hsn = mat.hsnCode || "";
              defaultGst = mat.gstPercent ? Number(mat.gstPercent) : 18;
            }
          }

          const qty = colMapping.qty !== undefined ? (Number(row[colMapping.qty]) || 1) : 1;
          const rate = colMapping.rate !== undefined ? (Number(row[colMapping.rate]) || 0) : 0;
          const disc = colMapping.disc !== undefined ? (Number(row[colMapping.disc]) || 0) : 0;
          const gst = colMapping.gst !== undefined ? (Number(row[colMapping.gst]) || defaultGst) : defaultGst;
          const uom = colMapping.uom !== undefined ? (row[colMapping.uom]?.toString() || "NOS") : "NOS";
          const dim = colMapping.dim !== undefined ? (row[colMapping.dim]?.toString() || "") : "";
          const hsnVal = colMapping.hsn !== undefined ? (row[colMapping.hsn]?.toString() || hsn) : hsn;

          const basicValue = (qty * rate) - disc;

          parsedItems.push({
            materialId: matchedMaterialId,
            orderedQty: qty,
            agreedRate: rate,
            dimensions: dim,
            hsnCode: hsnVal,
            gstPercent: gst,
            uom: uom,
            discount: disc,
            cgst: gst / 2,
            sgst: gst / 2,
            basicValue: basicValue
          });
        }
        
        if (parsedItems.length > 0) {
          setPoItems(parsedItems);
          success("PO Imported", `Successfully imported ${parsedItems.length} items from Excel.`);
        } else {
          error("PO Import Failed", "No valid items found in the Excel sheet.");
        }
      } catch (err: any) {
        error("PO Import Failed", err.message);
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportGRN = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const allRows: any[][] = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
        if (allRows.length === 0) throw new Error("Empty Excel file");

        let docRmSlipNo = "";
        
        allRows.forEach(row => {
          row.forEach((cell, cellIdx) => {
            if (!cell) return;
            const strCell = cell.toString().trim().toLowerCase();
            if (strCell.includes("rm slip no") || strCell.includes("rmslip")) {
              const val = row[cellIdx + 1] || row[cellIdx + 2];
              if (val) docRmSlipNo = val.toString().trim();
            }
          });
        });

        if (docRmSlipNo) {
          setGrnData(prev => ({ ...prev, supplierChallan: docRmSlipNo }));
        }

        let headerRowIndex = -1;
        let colMapping: any = {};
        
        for (let r = 0; r < allRows.length; r++) {
          const row = allRows[r];
          let matches = 0;
          let tempMapping: any = {};

          row.forEach((cell, c) => {
            if (!cell) return;
            const clean = cell.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            if (clean.includes("toolno")) { tempMapping.toolNo = c; matches++; }
            if (clean.includes("detno")) { tempMapping.detNo = c; matches++; }
            if (clean === "l") { tempMapping.l = c; }
            if (clean === "w") { tempMapping.w = c; }
            if (clean === "h") { tempMapping.h = c; }
            if (clean.includes("qty") || clean.includes("quantity")) { tempMapping.qty = c; matches++; }
            if (clean.includes("apwt") || clean.includes("weight")) { tempMapping.apWt = c; matches++; }
            if (clean.includes("totalwt")) { tempMapping.totalWt = c; }
          });
          
          if (matches >= 2) {
            headerRowIndex = r;
            colMapping = tempMapping;
            break;
          }
        }

        if (headerRowIndex === -1) throw new Error("Could not detect table headers automatically.");

        const importedItems: any[] = [];
        
        for (let r = headerRowIndex + 1; r < allRows.length; r++) {
          const row = allRows[r];
          const isBlank = row.every(c => c === undefined || c === null || c === '');
          if (isBlank) continue;

          const toolNo = colMapping.toolNo !== undefined ? row[colMapping.toolNo]?.toString() : "";
          const detNo = colMapping.detNo !== undefined ? row[colMapping.detNo]?.toString() : "";
          if (toolNo?.toLowerCase().includes("grand total")) continue;

          const qty = colMapping.qty !== undefined ? Number(row[colMapping.qty]) || 0 : 0;
          const apWt = colMapping.apWt !== undefined ? Number(row[colMapping.apWt]) || 0 : 0;
          const l = colMapping.l !== undefined ? Number(row[colMapping.l]) || 0 : 0;
          const w = colMapping.w !== undefined ? Number(row[colMapping.w]) || 0 : 0;
          const h = colMapping.h !== undefined ? Number(row[colMapping.h]) || 0 : 0;
          
          if (qty > 0 || apWt > 0) {
            importedItems.push({ toolNo, detNo, qty, apWt, l, w, h });
          }
        }

        if (importedItems.length > 0) {
          setGrnData(prev => {
            const newItems = [...prev.items];
            importedItems.forEach((imp, idx) => {
              if (newItems[idx]) {
                newItems[idx].toolNo = imp.toolNo || newItems[idx].toolNo;
                newItems[idx].detNo = imp.detNo || newItems[idx].detNo;
                newItems[idx].length = imp.l || newItems[idx].length;
                newItems[idx].width = imp.w || newItems[idx].width;
                newItems[idx].height = imp.h || newItems[idx].height;
                newItems[idx].apWeight = imp.apWt;
                newItems[idx].acceptedQty = imp.qty;
                newItems[idx].receivedQty = imp.qty;
                newItems[idx].totalWeight = imp.apWt * imp.qty;
                
                const rate = newItems[idx].actualRate || 0;
                const basicCost = newItems[idx].totalWeight * rate;
                newItems[idx].basicCost = basicCost;
                
                const gstPercent = 18; 
                newItems[idx].gst = basicCost * (gstPercent / 100);
                newItems[idx].total = newItems[idx].basicCost + newItems[idx].gst;
              }
            });
            return { ...prev, items: newItems };
          });
          success("GRN Imported", `Successfully imported ${importedItems.length} items from Excel.`);
        } else {
          error("GRN Import Failed", "No valid items found in the Excel sheet.");
        }
      } catch (err: any) {
        error("GRN Import Failed", err.message);
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportPO = (po: any) => {
    if (!po) return;
    
    const documentData: any[][] = [];

    documentData.push(["KRUPA TOOLS & STAMPING LTD."]);
    documentData.push(["                                             GUT NO.23,PLOT NO.45 MIDC WALUJ, AURANGABAD-431136                                                                                                                                                                    "]);
    documentData.push(["GST NO :  27AAKCK1751B1ZS"]);
    documentData.push(["Manufacturers of Press Tools,Jig Fixtures,Die sets, Gauge,All Types of Engineering Works"]);
    documentData.push(["PURCHASE ORDER"]);
    documentData.push([]);
    documentData.push([null, "Vendour Name ", po.vendor?.companyName || po.vendor?.vendorName || "NEW ERA METALS", null, null, null, null, null, null, null, "P.O.NO", po.poNumber]);
    documentData.push([null, " Address", "45B SHREE JI ARCADE, TATA ROAD NO2,MUMBAI", null, null, null, null, null, null, null, "DATE", po.createdAt ? new Date(po.createdAt).toLocaleDateString() : new Date().toLocaleDateString()]);
    documentData.push([null, "GST NO", po.vendor?.taxId || "27ATGPJ6102R1ZB", null, null, null, null, null, null, null, "REF.", "BY EMAIL"]);
    documentData.push([null, "Contact Details", po.vendor?.contactEmail || po.vendor?.contactPhone || ""]);
    documentData.push(["Dear Sir,"]);
    documentData.push(["Kindly supply the following material / services in accordance with the terms and conditions mentioned below."]);
    
    documentData.push(["SR NO","Material Description","HSN","QTY","UOM","Rate / Unit   (INR)","DISC.","Basic Value (INR)","CGST     ",null,"SGST",null,"TOTAL VALUE"]);
    documentData.push([null,null,null,null,null,null,null,null,"% ","Value (INR)","% ","Value(INR)"]);

    let grandQty = 0;
    let grandBasic = 0;
    let grandTotal = 0;

    po.items?.forEach((item: any, idx: number) => {
      const qty = Number(item.orderedQty || 0);
      const rate = Number(item.agreedRate || 0);
      const disc = Number(item.discount || 0);
      grandQty += qty;
      
      const basicVal = (qty * rate) - disc;
      const gstPercent = Number(item.gstPercent || 18);
      const cgstVal = basicVal * ((gstPercent/2) / 100);
      const sgstVal = basicVal * ((gstPercent/2) / 100);
      const totalVal = basicVal + cgstVal + sgstVal;

      grandBasic += basicVal;
      grandTotal += totalVal;

      documentData.push([
        idx + 1,
        `${item.material?.materialCode || ''} ${item.dimensions ? item.dimensions : ''}`,
        item.hsnCode || "",
        qty,
        item.uom || "NOS",
        rate,
        disc,
        basicVal,
        (gstPercent/2) / 100, // 0.09
        cgstVal,
        (gstPercent/2) / 100, // 0.09
        sgstVal,
        totalVal
      ]);
    });

    documentData.push([]);
    documentData.push([]);
    documentData.push([]);
    documentData.push([null,null,null,null,null,null,null,null,null,null,null,null, grandTotal]);
    documentData.push([null,null,`Rs. ${grandTotal} /-`]);
    documentData.push(["Purchase Order value (INR)", null, "TOTAL IN WORDS CALCULATED HERE"]);
    documentData.push([]);
    documentData.push([null, "*TERMS & CONDITIONS ", null, null, null, null, null, null, "*COMMERCIAL INFORMATION :"]);
    documentData.push([null, "*Delivery schedule :-  2-3 DAY"]);

    const ws = XLSX.utils.aoa_to_sheet(documentData);
    
    // Add structural cell merges for visual replication of the PO Template
    ws['!merges'] = [
      // Top Headers (Rows 0-4)
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }, // KRUPA TOOLS
      { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } }, // Address
      { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } }, // GST NO
      { s: { r: 3, c: 0 }, e: { r: 3, c: 12 } }, // Manufacturers of...
      { s: { r: 4, c: 0 }, e: { r: 4, c: 12 } }, // PURCHASE ORDER
      
      // Vendor Details Block (Rows 6-9)
      { s: { r: 6, c: 2 }, e: { r: 6, c: 8 } }, // Vendor Name value
      { s: { r: 6, c: 11 }, e: { r: 6, c: 12 } }, // P.O.NO value
      
      { s: { r: 7, c: 2 }, e: { r: 7, c: 8 } }, // Address value
      { s: { r: 7, c: 11 }, e: { r: 7, c: 12 } }, // Date value
      
      { s: { r: 8, c: 2 }, e: { r: 8, c: 8 } }, // GST value
      { s: { r: 8, c: 11 }, e: { r: 8, c: 12 } }, // REF value
      
      { s: { r: 9, c: 2 }, e: { r: 9, c: 8 } }, // Contact Details value

      // Salutations (Rows 10-11)
      { s: { r: 10, c: 0 }, e: { r: 10, c: 12 } }, // Dear Sir
      { s: { r: 11, c: 0 }, e: { r: 11, c: 12 } }, // Kindly supply...

      // Table Headers (Row 12 - 13)
      { s: { r: 12, c: 0 }, e: { r: 13, c: 0 } }, // SR NO (vertical merge)
      { s: { r: 12, c: 1 }, e: { r: 13, c: 1 } }, // Material Description (vertical merge)
      { s: { r: 12, c: 2 }, e: { r: 13, c: 2 } }, // HSN (vertical merge)
      { s: { r: 12, c: 3 }, e: { r: 13, c: 3 } }, // QTY (vertical merge)
      { s: { r: 12, c: 4 }, e: { r: 13, c: 4 } }, // UOM (vertical merge)
      { s: { r: 12, c: 5 }, e: { r: 13, c: 5 } }, // Rate (vertical merge)
      { s: { r: 12, c: 6 }, e: { r: 13, c: 6 } }, // DISC (vertical merge)
      { s: { r: 12, c: 7 }, e: { r: 13, c: 7 } }, // Basic Value (vertical merge)
      
      { s: { r: 12, c: 8 }, e: { r: 12, c: 9 } }, // CGST (horizontal merge)
      { s: { r: 12, c: 10 }, e: { r: 12, c: 11 } }, // SGST (horizontal merge)
      
      { s: { r: 12, c: 12 }, e: { r: 13, c: 12 } }, // TOTAL VALUE (vertical merge)
    ];

    const wscols = [
      { wch: 8 },  { wch: 35 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, 
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PO NO-34");
    
    XLSX.writeFile(wb, `PO_${po.poNumber}.xlsx`);
  };

  const handleExportGRN = (po: any) => {
    if (!po) return;
    
    const documentData: any[][] = [];

    documentData.push(["KRUPA TOOLS & STAMPINGS LTD."]);
    documentData.push(["GUT NO.23 PLOT NO.45 KAMLAPUR MIDC, WALUJ AURANAGABAD."]);
    documentData.push([]);
    documentData.push(["VENDOR NAME & ADDRESS", po.vendor?.companyName || po.vendor?.vendorName || "STEEL HUB", null, null, null, null, null, null, null, "RM SLIP NO", po.customFields?.rmSlipNo || "PUR/26-27/0035"]);
    documentData.push([null, po.vendor?.address || "WALUJ", null, null, null, null, null, null, null, "DATE", po.createdAt ? new Date(po.createdAt).toLocaleDateString() : new Date().toLocaleDateString()]);
    documentData.push([]);
    documentData.push(["KINDLY SUPPLY THE FOLLOWING ITEMS AS PER TERMS & CONDITIONS MENTIONED BELOW."]);
    
    const headers = ["SR.NO","TOOL NO","DET NO","L","W","H","MATERIAL","QTY","AP WT.","TOTAL WT","RATE","BASIC COST","GST ","TOTAL"];
    documentData.push(headers);

    let grandQty = 0;
    let grandTotalWt = 0;
    let grandBasicCost = 0;
    let grandGst = 0;
    let grandTotal = 0;

    po.items?.forEach((item: any, idx: number) => {
      // Find the corresponding GRN item either from the direct relation or from the included headers
      const grnItem = item.goodsReceiptItems?.[0] || 
                      po.goodsReceiptHeaders?.[0]?.items?.find((i: any) => i.poItemId === item.id);
      
      const qty = grnItem ? Number(grnItem.acceptedQty) : Number(item.orderedQty);
      const rate = Number(item.agreedRate || 0);
      
      const apWt = Number(grnItem?.apWeight || 0);
      const totalWt = Number(grnItem?.totalWeight || (apWt * qty) || 0);
      
      const basicCost = Number(grnItem?.basicCost || (totalWt * rate) || 0);
      const gstPercent = Number(item.gstPercent || 18);
      const gst = Number(grnItem?.gst || (basicCost * (gstPercent / 100)) || 0);
      const total = Number(grnItem?.total || (basicCost + gst) || 0);

      grandQty += qty;
      grandTotalWt += totalWt;
      grandBasicCost += basicCost;
      grandGst += gst;
      grandTotal += total;

      documentData.push([
        idx + 1,
        grnItem?.toolNo || po.customFields?.toolNo || "-",
        grnItem?.detNo || "-",
        grnItem?.length || "-",
        grnItem?.width || "-",
        grnItem?.height || "-",
        item.material?.materialCode || "",
        qty,
        apWt > 0 ? apWt : "",
        totalWt > 0 ? totalWt : "",
        rate,
        basicCost,
        gst,
        total
      ]);
    });

    documentData.push([
      null, null, null, null, null, null, null, 
      grandQty, 
      null, 
      grandTotalWt, 
      null, 
      grandBasicCost, 
      grandGst, 
      grandTotal
    ]);

    const ws = XLSX.utils.aoa_to_sheet(documentData);
    
    // Apply exact template merges for RM Slip
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }, // KRUPA TOOLS
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } }, // Address
      
      { s: { r: 3, c: 1 }, e: { r: 3, c: 8 } }, // Vendor Name value
      { s: { r: 4, c: 1 }, e: { r: 4, c: 8 } }, // Address value
      
      { s: { r: 6, c: 0 }, e: { r: 6, c: 13 } }, // KINDLY SUPPLY...
    ];

    const wscols = [
      { wch: 6 },  { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, 
      { wch: 15 }, { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MS");
    
    XLSX.writeFile(wb, `RMSlip_${po.poNumber}.xlsx`);
  };

  const handleIssuePO = async (poId: string) => {
    try {
      await api.post(`/projects/${resolvedParams.id}/purchase-orders/${poId}/issue`);
      success('Purchase Order issued successfully.');
      setViewingPoDetails(null);
      refetchPurchaseOrders();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to issue purchase order.');
    }
  };

  const handleDeletePO = async (poId: string) => {
    if (!window.confirm('Are you sure you want to delete this Purchase Order? This action cannot be undone.')) return;
    try {
      await api.delete(`/projects/${resolvedParams.id}/purchase-orders/${poId}`);
      success('Purchase Order deleted successfully.');
      refetchPurchaseOrders();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete purchase order.');
    }
  };

  const handleProcessGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !selectedPo) return;
    
    try {
      await processGRNMutation.mutateAsync({
        poHeaderId: selectedPo.id,
        grnNumber: grnData.grnNumber,
        supplierChallan: grnData.supplierChallan,
        warehouseId: grnData.warehouseId,
        remarks: grnData.remarks,
        items: grnData.items
      });
      setShowGrnModal(false);
      refetchProject();
    } catch (err: any) {}
  };

  const addPoItemRow = () => setPoItems([...poItems, { materialId: "", orderedQty: 1, agreedRate: 0, dimensions: "", hsnCode: "", gstPercent: 18 }]);
  const removePoItemRow = (index: number) => setPoItems(poItems.filter((_, i) => i !== index));
  const updatePoItem = (index: number, field: string, value: any) => {
    const newItems = [...poItems] as any[];
    newItems[index][field] = value;
    setPoItems(newItems);
  };

  return (
    <div className="flex-1 h-full flex flex-col animate-fade-in min-h-0 max-w-7xl mx-auto w-full px-2">
      
      <div className="flex justify-between items-center shrink-0 mb-6 bg-white border border-black/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 mr-3 text-amber-700 shadow-sm">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Procurement & Sourcing</h2>
        </div>
        <button 
          onClick={() => {
            setEditingPoId(null);
            setPoNum("");
            setSelectedVendorId("");
            setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
            setShowPoModal(true);
          }} 
          className="group relative px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all duration-300 shadow-elevation hover:shadow-elevation"
        >
          <span className="relative z-10 flex items-center text-amber-700 font-black tracking-widest text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Generate Vendor PO
          </span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-12">
        {purchaseOrders && purchaseOrders.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {purchaseOrders.map((po: any, i: number) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                key={po.id} 
                className="group relative rounded-2xl bg-white border border-zinc-200 p-4 flex flex-col overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-0.5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-[20px] -mr-10 -mt-10 pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-1.5">
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">{po.poNumber}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-widest ${
                        po.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                      }`}>
                        {po.status === 'CLOSED' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {po.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs flex items-center">
                      <Package className="w-3 h-3 mr-1.5 opacity-50" />
                      {po.vendor?.vendorName || 'Unknown Vendor'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Total Value</div>
                    <div className="text-lg text-amber-700 font-black tracking-widest tracking-tight font-mono">&#8377;{Number(po.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-50 rounded-xl p-3 border border-zinc-200 mb-4 relative z-10">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center">
                    <FileText className="w-3 h-3 mr-1.5" />
                    Order Items
                  </h4>
                  <div className="space-y-2">
                    {po.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center group/item bg-white p-2 rounded-lg border border-zinc-100 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-zinc-700">{item.material?.materialName}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-bold">{Number(item.orderedQty).toLocaleString(undefined, {maximumFractionDigits:2})} {Number(item.orderedQty) === 1 ? "unit" : "units"} ordered</span>
                        </div>
                        <div className="text-right flex flex-col">
                          <span className="text-xs text-zinc-600 font-mono font-bold">&#8377;{Number(item.lineTotal || (item.orderedQty * item.agreedRate)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-mono">@ &#8377;{Number(item.agreedRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-black/5 relative z-10 flex gap-2">
                  <button
                    onClick={() => setViewingPoDetails(po)}
                    className={`font-bold text-xs py-2.5 rounded-xl transition-all duration-300 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-900 shadow-sm flex-1`}
                  >
                    View Details
                  </button>
                  {po.status === 'DRAFT' && (
                    <button
                      onClick={() => handleIssuePO(po.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-transparent font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <span>Issue PO</span>
                    </button>
                  )}
                  {(po.status === 'ISSUED' || po.status === 'PARTIAL') && (
                    <button
                      onClick={() => openGrnModal(po)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border border-transparent font-bold text-xs flex items-center justify-center space-x-1"
                    >
                      <span>Process GRN</span>
                    </button>
                  )}
                  {(po.status === 'DRAFT' || po.status === 'ON_HOLD') && (
                    <button
                      onClick={() => openEditPoModal(po)}
                      className="px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-md border border-transparent flex items-center justify-center"
                      title="Edit Purchase Order"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {(po.status === 'DRAFT' || po.status === 'ON_HOLD') && (
                    <button
                      onClick={() => handleDeletePO(po.id)}
                      className="px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-sm flex items-center justify-center"
                      title="Delete Purchase Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 px-4 rounded-[2rem] border border-dashed border-black/10 bg-white">
            <div className="w-24 h-24 mb-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-md flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-amber-400 opacity-80" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-3 tracking-tight">No Purchase Orders Yet</h3>
            <p className="text-zinc-500 max-w-md text-center mb-8">Generate a purchase order to begin procuring raw materials and components for this project.</p>
            <button 
              onClick={() => setShowPoModal(true)}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl shadow-elevation transition-all hover:scale-105 active:scale-95"
            >
              Create First PO
            </button>
          </div>
        )}
      </div>

      {/* Create PO Drawer */}
      <PremiumDrawer
        isOpen={showPoModal}
        onClose={() => {
          setShowPoModal(false);
          setEditingPoId(null);
          setPoNum("");
          setSelectedVendorId("");
          setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0 }]);
        }}
        title={editingPoId ? "Edit Purchase Order" : "Create Purchase Order"}
        subtitle={editingPoId ? "Modify PO details" : "Generate a new vendor PO for raw materials"}
        width="2xl"
      >
        <form onSubmit={handleSavePo} className="flex flex-col space-y-6 h-full p-6">
          <div className="grid grid-cols-2 gap-6 shrink-0 bg-black/[0.02] p-6 rounded-2xl border border-black/5">
            <Input
              label="PO Number (Auto-generated if empty)"
              value={poNum}
              onChange={(e) => setPoNum(e.target.value)}
              placeholder="Leave blank to auto-generate"
            />
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Vendor</label>
              <Select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                options={filteredVendors.map((v: any) => ({ value: v.id, label: v.vendorName }))}
              />
            </div>
            <Input
              label="Expected Delivery Date"
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar bg-black/5 p-6 rounded-2xl border border-black/5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Order Lines</h4>
              <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-bold text-xs transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import PO</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportPO} />
              </label>
            </div>
            <div className="grid grid-cols-12 gap-2 mb-3">
              <div className="col-span-12 md:col-span-2 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Material</div>
              <div className="col-span-6 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Dim</div>
              <div className="col-span-6 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">HSN</div>
              <div className="col-span-6 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">UOM</div>
              <div className="col-span-6 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Qty</div>
              <div className="col-span-5 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Rate</div>
              <div className="col-span-5 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Disc</div>
              <div className="col-span-5 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Basic</div>
              <div className="col-span-5 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider">GST%</div>
              <div className="col-span-5 md:col-span-1 text-[10px] font-black text-zinc-500 uppercase tracking-wider text-right">Value</div>
              <div className="col-span-1"></div>
            </div>
            
            <div className="space-y-3">
              {poItems.map((item, index) => {
                const basicVal = (Number(item.orderedQty || 0) * Number(item.agreedRate || 0)) - Number(item.discount || 0);
                const gstVal = basicVal * (Number(item.gstPercent || 0) / 100);
                const totalVal = basicVal + gstVal;

                return (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-black/[0.02] p-2 rounded-xl border border-black/5">
                    <div className="col-span-12 md:col-span-2">
                      <Select
                        value={item.materialId}
                        onChange={(e) => {
                           const val = e.target.value;
                           const mat = materials?.find((m: any) => m.id === val);
                           const newItems = [...poItems];
                           newItems[index].materialId = val;
                           if (mat) {
                              newItems[index].hsnCode = mat.hsnCode || "";
                              newItems[index].gstPercent = mat.gstPercent ? Number(mat.gstPercent) : 18;
                           }
                           setPoItems(newItems);
                        }}
                        options={(materials || []).map((m: any) => ({ value: m.id, label: `${m.materialCode}` }))}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <input
                        type="text"
                        placeholder="Dim"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] focus:shadow-elevation transition-all outline-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                        value={item.dimensions || ""}
                        onChange={(e) => updatePoItem(index, 'dimensions', e.target.value)}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <input
                        type="text"
                        placeholder="HSN"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] outline-none"
                        value={item.hsnCode || ""}
                        onChange={(e) => updatePoItem(index, 'hsnCode', e.target.value)}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <input
                        type="text"
                        placeholder="UOM"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] outline-none"
                        value={item.uom || "NOS"}
                        onChange={(e) => updatePoItem(index, 'uom', e.target.value)}
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <input
                        type="number" min="1" step="0.01" required placeholder="Qty"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] outline-none"
                        value={item.orderedQty}
                        onChange={(e) => updatePoItem(index, 'orderedQty', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-5 md:col-span-1">
                      <input
                        type="number" min="0" step="0.01" required placeholder="Rate"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] outline-none"
                        value={item.agreedRate}
                        onChange={(e) => updatePoItem(index, 'agreedRate', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-5 md:col-span-1">
                      <input
                        type="number" min="0" step="0.01" placeholder="Disc"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] outline-none"
                        value={item.discount || 0}
                        onChange={(e) => updatePoItem(index, 'discount', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-5 md:col-span-1">
                      <div className="w-full bg-black/5 border border-black/5 rounded-lg px-2 py-2 text-xs text-zinc-600 font-mono flex items-center h-[34px]">
                        {basicVal.toFixed(1)}
                      </div>
                    </div>
                    <div className="col-span-5 md:col-span-1">
                      <input
                        type="number" min="0" step="0.01" placeholder="GST%"
                        className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-2 text-xs text-zinc-900 focus:border-amber-500/40 focus:bg-white/[0.04] outline-none"
                        value={item.gstPercent || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updatePoItem(index, 'gstPercent', val);
                          updatePoItem(index, 'cgst', val / 2);
                          updatePoItem(index, 'sgst', val / 2);
                        }}
                      />
                    </div>
                    <div className="col-span-5 md:col-span-1 flex justify-end items-center h-[34px]">
                       <span className="text-amber-700 font-black tracking-widest text-xs font-mono">
                         {totalVal.toFixed(1)}
                       </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button type="button" onClick={() => removePoItemRow(index)} className="w-8 h-8 rounded-lg bg-black/[0.02] border border-black/10/[0.05] text-red-400 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all" disabled={poItems.length === 1}>
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button 
              type="button" 
              onClick={addPoItemRow}
              className="w-full py-4 mt-6 border-2 border-dashed border-amber-500/20 text-amber-500 rounded-xl font-bold text-sm hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
            >
              + Add Another Item
            </button>
          </div>

          <div className="flex space-x-4 pt-4 shrink-0 border-t border-black/10 mt-auto">
            <button type="button" onClick={() => {
              setShowPoModal(false);
              setEditingPoId(null);
              setPoNum("");
              setSelectedVendorId("");
              setPoItems([{ materialId: "", orderedQty: 1, agreedRate: 0, dimensions: "", hsnCode: "", gstPercent: 18 }]);
            }} className="flex-1 px-6 py-4 rounded-xl bg-black/5 hover:bg-black/10 font-bold text-zinc-900 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-bold text-zinc-900 shadow-elevation transition-all">
              {editingPoId ? "Save Changes" : "Generate Purchase Order"}
            </button>
          </div>
        </form>
      </PremiumDrawer>

      {/* GRN Drawer */}
      <PremiumDrawer
        isOpen={showGrnModal}
        onClose={() => setShowGrnModal(false)}
        title="Goods Receipt Note (GRN)"
        subtitle={`Processing receipt for PO: ${selectedPo?.poNumber}`}
        width="3xl"
      >
        <form onSubmit={handleProcessGrn} className="flex flex-col space-y-6 h-full p-6">
          <div className="grid grid-cols-4 gap-6 shrink-0 bg-black/[0.02] p-6 rounded-2xl border border-black/5">
            <Input
              label="GRN Number"
              value={grnData.grnNumber}
              onChange={(e) => setGrnData({...grnData, grnNumber: e.target.value})}
              required
            />
            <Input
              label="Supplier Challan"
              value={grnData.supplierChallan}
              onChange={(e) => setGrnData({...grnData, supplierChallan: e.target.value})}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target Warehouse</label>
              <select 
                className="w-full bg-[#FBFBFC] border border-black/10 rounded-lg p-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none" 
                value={grnData.warehouseId}
                onChange={e => setGrnData({...grnData, warehouseId: e.target.value})}
                required
              >
                {warehouses?.map((w: any) => (
                  <option key={w.id} value={w.id} className="bg-[#F4F4F6] text-zinc-900">
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Remarks (Optional)"
              value={grnData.remarks}
              onChange={(e) => setGrnData({...grnData, remarks: e.target.value})}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar bg-black/5 p-6 rounded-2xl border border-black/5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Received Items</h4>
              <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-bold text-xs transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import RM Slip</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportGRN} />
              </label>
            </div>
            <div className="space-y-6">
              {grnData.items.map((item, index) => {
                const poItem = selectedPo?.items.find((i: any) => i.id === item.poItemId);
                return (
                  <div key={index} className="grid grid-cols-6 gap-6 items-end bg-black/[0.02] p-6 rounded-xl border border-black/5">
                    <div className="col-span-12 border-b border-black/5 pb-3 mb-1 flex justify-between items-center w-full">
                      <div>
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs mr-3">ITEM {index + 1}</span>
                        <span className="font-bold text-zinc-900 text-lg">{poItem?.material?.materialCode} - {poItem?.material?.materialGrade}</span>
                      </div>
                      <div className="text-sm text-zinc-500 bg-black/5 px-3 py-1.5 rounded-lg">
                        Ordered: <strong className="text-zinc-900">{poItem?.orderedQty}</strong> <span className="mx-2 opacity-50">|</span> Rate: <strong className="text-zinc-900">&#8377;{poItem?.agreedRate}</strong>
                      </div>
                    </div>
                    
                    <div className="col-span-12 grid grid-cols-12 gap-2 mt-2 w-full">
                       <div className="col-span-12 md:col-span-2">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 text-red-400">Heat/Batch No *</label>
                         <input type="text" required className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.heatNumber} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].heatNumber = e.target.value; setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-6 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Tool No</label>
                         <input type="text" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.toolNo || ''} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].toolNo = e.target.value; setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-6 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Det No</label>
                         <input type="text" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.detNo || ''} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].detNo = e.target.value; setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-4 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">L</label>
                         <input type="number" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.length || 0} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].length = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-4 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">W</label>
                         <input type="number" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.width || 0} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].width = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-4 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">H</label>
                         <input type="number" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.height || 0} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].height = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-6 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">AP WT.</label>
                         <input type="number" step="0.01" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.apWeight || 0} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].apWeight = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-6 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1 text-emerald-400">Acc. Qty</label>
                         <input type="number" step="0.01" required className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5 text-xs text-emerald-100 outline-none" value={item.acceptedQty} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].acceptedQty = Number(e.target.value); newItems[index].receivedQty = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-6 md:col-span-1">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Wt</label>
                         <input type="number" step="0.01" className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.totalWeight || 0} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].totalWeight = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                       <div className="col-span-6 md:col-span-2">
                         <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Rate</label>
                         <input type="number" step="0.01" required className="w-full bg-black/[0.02] border border-black/10/[0.05] rounded-lg px-2 py-1.5 text-xs text-zinc-900 outline-none" value={item.actualRate} onChange={(e) => { const newItems = [...grnData.items]; newItems[index].actualRate = Number(e.target.value); setGrnData({ ...grnData, items: newItems }); }} />
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-4 pt-4 shrink-0 border-t border-black/10 mt-auto">
            <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 px-6 py-4 rounded-xl bg-black/5 hover:bg-black/10 font-bold text-zinc-900 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 font-bold text-white shadow-elevation transition-all">Complete Goods Receipt</button>
          </div>
        </form>
      </PremiumDrawer>
      {/* View PO Details Modal */}
      {viewingPoDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-4xl p-6 animate-slide-up border border-black/10 relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Ambient decorative glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[90px] -ml-32 -mb-32 pointer-events-none" />

            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-black/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 tracking-tight flex items-center space-x-2">
                    <span>Purchase Order Details</span>
                    <span className="text-xs text-slate-500 font-mono">({viewingPoDetails.poNumber})</span>
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Detailed fulfillment ledger & audit logs</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {(viewingPoDetails.status === 'DRAFT' || viewingPoDetails.status === 'ON_HOLD') && (
                  <button 
                    onClick={() => openEditPoModal(viewingPoDetails)}
                    className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 font-bold text-xs transition-colors"
                  >
                    <span>Edit PO</span>
                  </button>
                )}
                {viewingPoDetails.status === 'ON_HOLD' && (
                  <button 
                    onClick={() => handleIssuePO(viewingPoDetails.id)}
                    className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-bold text-xs transition-colors"
                  >
                    <span>Issue PO</span>
                  </button>
                )}
                <button 
                  onClick={() => handleExportPO(viewingPoDetails)}
                  className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PO Export</span>
                </button>
                <button 
                  onClick={() => handleExportGRN(viewingPoDetails)}
                  className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>RM Slip Export</span>
                </button>
                <button 
                  onClick={() => setViewingPoDetails(null)} 
                  className="w-8 h-8 rounded-lg bg-black/5 hover:bg-black/10 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 py-4 pr-1 relative z-10 hide-scrollbar">
              
              {/* Metadata Grid (RM Slip Header) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Vendor Card */}
                <div className="p-4 rounded-xl bg-white border border-black/5">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center">
                    <Package className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Supplier Information
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Vendor Name:</span>
                      <span className="text-zinc-900 font-bold">{viewingPoDetails.customFields?.vendorName || viewingPoDetails.vendor?.vendorName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Vendor Address:</span>
                      <span className="text-zinc-600">{viewingPoDetails.customFields?.vendorAddress || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Customer Name:</span>
                      <span className="text-zinc-600">{viewingPoDetails.customFields?.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Customer Location:</span>
                      <span className="text-zinc-600">{viewingPoDetails.customFields?.customerLocation || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* PO Stats Card */}
                <div className="p-4 rounded-xl bg-white border border-black/5">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    RM Slip Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${
                        viewingPoDetails.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm'
                      }`}>
                        {viewingPoDetails.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">RM Slip No:</span>
                      <span className="text-amber-700 font-black tracking-widest font-mono">{viewingPoDetails.customFields?.rmSlipNo || viewingPoDetails.poNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Date:</span>
                      <span className="text-zinc-600 font-medium">
                        {viewingPoDetails.customFields?.date ? new Date(viewingPoDetails.customFields.date).toLocaleDateString() : new Date(viewingPoDetails.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Items Table (RM Slip Format) */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  Line Items
                </h4>
                
                <div className="bg-white border border-black/5 rounded-xl overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-black/5 border-b border-black/5 whitespace-nowrap">
                        <th className="px-4 py-3">Sr. No</th>
                        <th className="px-4 py-3">Tool No</th>
                        <th className="px-4 py-3">Det No</th>
                        <th className="px-4 py-3">L</th>
                        <th className="px-4 py-3">W</th>
                        <th className="px-4 py-3">H</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">AP WT.</th>
                        <th className="px-4 py-3 text-right">Total WT</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Basic Cost</th>
                        <th className="px-4 py-3 text-right">GST</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {viewingPoDetails.items?.map((item: any, i: number) => {
                        const cf = item.customFields || {};
                        return (
                          <tr key={item.id} className="text-xs text-zinc-600 hover:bg-white transition-colors">
                            <td className="px-4 py-3">{cf.srNo || (i + 1)}</td>
                            <td className="px-4 py-3 font-semibold text-zinc-900 whitespace-nowrap">{cf.toolNo || '-'}</td>
                            <td className="px-4 py-3">{cf.detNo || (i + 1)}</td>
                            <td className="px-4 py-3">{cf.L || '-'}</td>
                            <td className="px-4 py-3">{cf.W || '-'}</td>
                            <td className="px-4 py-3">{cf.H || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{cf.material || item.material?.materialGrade || item.material?.materialName || '-'}</td>
                            <td className="px-4 py-3 text-right">{cf.qty || Number(item.orderedQty)}</td>
                            <td className="px-4 py-3 text-right font-mono">{cf.apWt ? Number(cf.apWt).toFixed(2) : '-'}</td>
                            <td className="px-4 py-3 text-right font-mono">{cf.totalWt ? Number(cf.totalWt).toFixed(2) : '-'}</td>
                            <td className="px-4 py-3 text-right font-mono">&#8377;{Number(cf.rate || item.agreedRate).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono">&#8377;{Number(cf.basicCost || item.lineTotal).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono">&#8377;{Number(cf.gst || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-zinc-900">&#8377;{Number(cf.total || item.lineTotal).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    {/* Per Tool Summary Footer */}
                    <tfoot className="bg-amber-500/5 border-t-2 border-amber-500/20">
                      <tr className="text-xs font-bold text-amber-400">
                        <td colSpan={7} className="px-4 py-3 text-right uppercase tracking-wider text-[10px]">Per Tool Summary</td>
                        <td className="px-4 py-3 text-right">{viewingPoDetails.items?.reduce((sum: number, it: any) => sum + Number((it.customFields?.qty) || it.orderedQty || 0), 0)}</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right font-mono">{viewingPoDetails.items?.reduce((sum: number, it: any) => sum + Number((it.customFields?.totalWt) || 0), 0).toFixed(2)}</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right font-mono">&#8377;{viewingPoDetails.items?.reduce((sum: number, it: any) => sum + Number((it.customFields?.basicCost) || it.lineTotal || 0), 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono">&#8377;{viewingPoDetails.items?.reduce((sum: number, it: any) => sum + Number((it.customFields?.gst) || 0), 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-amber-500">&#8377;{viewingPoDetails.items?.reduce((sum: number, it: any) => sum + Number((it.customFields?.total) || it.lineTotal || 0), 0).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Goods Receipts Audit Timeline */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Goods Receipt Notes (GRN) History
                </h4>

                {viewingPoDetails.goodsReceiptHeaders && viewingPoDetails.goodsReceiptHeaders.length > 0 ? (
                  <div className="space-y-3">
                    {viewingPoDetails.goodsReceiptHeaders.map((grn: any) => (
                      <div key={grn.id} className="p-4 rounded-xl bg-black/30 border border-black/5 space-y-3 relative overflow-hidden group/grn">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-emerald-400 font-mono">{grn.grnNumber}</span>
                              <span className="text-[9px] font-bold bg-black/5 border border-black/10 px-2 py-0.5 rounded text-zinc-500 uppercase">Received</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Processed: {new Date(grn.receiptDate).toLocaleDateString()}</p>
                          </div>
                          {grn.remarks && (
                            <div className="text-[10px] bg-black/5 text-zinc-500 px-2 py-1 rounded max-w-xs truncate border border-black/5">
                              {grn.remarks}
                            </div>
                          )}
                        </div>

                        {/* Received items checklist */}
                        <div className="space-y-1.5 pt-2 border-t border-black/10/[0.03]">
                          {grn.items?.map((gItem: any) => (
                            <div key={gItem.id} className="flex justify-between text-xs py-1 px-2 bg-white rounded">
                              <span className="text-zinc-500">{gItem.poItem?.material?.materialName}</span>
                              <div className="space-x-3 font-semibold text-zinc-600">
                                <span>Rcvd: <span className="font-mono text-zinc-900">{Number(gItem.receivedQty)}</span></span>
                                <span className="text-emerald-500">Accpt: <span className="font-mono text-emerald-400">{Number(gItem.acceptedQty)}</span></span>
                                {Number(gItem.rejectedQty) > 0 && (
                                  <span className="text-red-500">Rej: <span className="font-mono text-red-400">{Number(gItem.rejectedQty)}</span></span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-black/5 border-dashed text-xs text-slate-500 italic">
                    No Goods Receipt Notes processed yet. Delivery is pending.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-black/10 shrink-0 flex justify-end relative z-10">
              <button 
                type="button" 
                onClick={() => setViewingPoDetails(null)} 
                className="px-5 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-zinc-900 transition-colors"
              >
                Close details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
