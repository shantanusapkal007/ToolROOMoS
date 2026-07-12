export class RoutingSummaryProjection {
  id: string;
  projectId: string;
  routingNo: string | null;
  documentNumber: string | null;
  revision: number;
  status: string;
  approvalStatus: string;
  updatedAt: Date;
}

export class RoutingOperationProjection {
  id: string;
  sequenceOrder: number;
  operationId: string;
  operationName: string | null;
  machineType: string | null;
  estimatedHours: number;
  cycleTime: number | null;
  inspectionRequired: boolean;
  outsource: boolean;
  setupNotes: string | null;
  machiningNotes: string | null;
}

export class RoutingDetailsProjection extends RoutingSummaryProjection {
  operations: RoutingOperationProjection[];
}

export class RoutingTimelineProjection extends RoutingSummaryProjection {
  timeline: any; // Complex sequenced timeline based on operations
}
