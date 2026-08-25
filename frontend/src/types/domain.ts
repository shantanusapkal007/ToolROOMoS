/**
 * ToolRoomOS Centralized Domain Types & API Contracts
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  message?: string;
}

export type ProjectStage =
  | 'CREATED'
  | 'ENGINEERING'
  | 'BOM_ROUTING'
  | 'PROCUREMENT'
  | 'MANUFACTURING'
  | 'ASSEMBLY_TRIAL'
  | 'QUALITY_INSPECTION'
  | 'READY_TO_DISPATCH'
  | 'DISPATCHED'
  | 'CLOSED'
  | 'CANCELLED'
  | string;

export interface Customer {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
}

export interface Plant {
  id: string;
  name: string;
  code: string;
  location?: string;
}

export interface ProjectCostSummary {
  id: string;
  projectId: string;
  estimatedMaterialCost: number;
  actualMaterialCost: number;
  estimatedMachineCost: number;
  actualMachineCost: number;
  estimatedLabourCost: number;
  actualLabourCost: number;
  revenue: number;
  profit: number;
  profitability?: number;
  [key: string]: any;
}

export interface ProjectTimelineEvent {
  id: string;
  projectId: string;
  stage: ProjectStage;
  transitionedAt: string;
  remarks?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  activityType: string;
  description: string;
  performedAt: string;
  performedBy?: string;
}

export interface Project {
  id: string;
  projectNumber: string;
  customerPoNumber?: string;
  partName: string;
  description?: string;
  targetDeliveryDate?: string;
  actualDeliveryDate?: string;
  currentStage: ProjectStage;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string;
  progress: number;
  projectOwner?: string;
  customerId: string;
  plantId: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  customer?: Customer;
  customerName?: string;
  manager?: any;
  plant?: Plant;
  projectCostSummary?: ProjectCostSummary;
  projectTimeline?: ProjectTimelineEvent[];
  projectActivities?: ProjectActivity[];
  billOfMaterialHeaders?: any[];
  purchaseOrderHeaders?: any[];
  goodsReceiptHeaders?: any[];
  materialIssueHeaders?: any[];
  inspectionHeaders?: any[];
  ncrReports?: any[];
  dispatchNotes?: any[];
  invoiceHeaders?: any[];
  inventoryTransactions?: any[];
  projectTasks?: any[];
  [key: string]: any;
}

export interface Material {
  id: string;
  materialCode: string;
  materialGrade: string;
  shape?: string;
  density?: number;
  unitCost?: number;
  uom?: string;
  hsnCode?: string;
}

export interface BillOfMaterialItem {
  id: string;
  bomHeaderId: string;
  materialId: string;
  rawSize?: string;
  dimensions?: string;
  hsnCode?: string;
  calculatedWeight?: number;
  requiredQty: number;
  estimatedCost: number;
  remarks?: string;
  isAssembly?: boolean;
  catalogSize?: string;
  stockSize?: string;
  material?: Material;
}

export interface BillOfMaterialHeader {
  id: string;
  projectId: string;
  documentNumber?: string;
  revision: number;
  status: 'DRAFT' | 'RELEASED' | 'OBSOLETE';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  totalEstimatedCost: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  items?: BillOfMaterialItem[];
}

export interface PurchaseOrderItem {
  id: string;
  poHeaderId: string;
  materialId: string;
  orderedQty: number;
  receivedQty: number;
  agreedRate: number;
  lineTotal: number;
  status: string;
  material?: Material;
  dimensions?: string;
  hsnCode?: string;
  uom?: string;
}

export interface PurchaseOrderHeader {
  id: string;
  projectId: string;
  vendorId: string;
  poNumber: string;
  documentNumber?: string;
  totalAmount: number;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: { id: string; vendorName: string; contactPerson?: string };
  items?: PurchaseOrderItem[];
}

export interface GoodsReceiptItem {
  id: string;
  grnHeaderId: string;
  poItemId: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  actualRate: number;
  actualMaterialCost: number;
  basicCost?: number;
  total?: number;
  batchNumber?: string;
}

export interface GoodsReceiptHeader {
  id: string;
  projectId: string;
  poHeaderId: string;
  grnNumber: string;
  supplierChallan?: string;
  receiptDate: string;
  status: string;
  items?: GoodsReceiptItem[];
}

export interface InventoryBatch {
  id: string;
  materialId: string;
  batchNumber: string;
  heatNumber?: string;
  receivedQty: number;
  currentQty: number;
  availableQty: number;
  unitCost: number;
  status: 'AVAILABLE' | 'CONSUMED' | 'EXPIRED' | 'BLOCKED';
  createdAt: string;
  material?: Material;
}

export interface InvoiceHeader {
  id: string;
  projectId: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  amountPaid: number;
}
