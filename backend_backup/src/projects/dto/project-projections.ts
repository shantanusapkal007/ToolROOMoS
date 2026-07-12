export class ProjectSummaryProjection {
  id: string;
  projectNumber: string;
  partName: string;
  customerPoNumber: string | null;
  customerId: string;
  customerName?: string;
  currentStage: string;
  targetDeliveryDate: Date | null;
  priority: string;
  createdAt: Date;
}

export class ProjectDetailsProjection extends ProjectSummaryProjection {
  description: string | null;
  remarks: string | null;
  projectOwner: string | null;
  plantId: string;
  plantName?: string;
  progress: number;
  closedAt: Date | null;
  
  // High-level aggregates (not full objects)
  totalCost?: number;
  revenue?: number;
  profitability?: number;
  
  recentTimeline?: any[];
  recentActivities?: any[];
}

export class ProjectTimelineProjection {
  id: string;
  fromStage: string;
  toStage: string;
  transitionedAt: Date;
  transitionedBy: string;
  remarks: string | null;
}
