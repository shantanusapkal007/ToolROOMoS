export class PlanningRunSummaryProjection {
  id: string;
  projectId: string;
  runDate: Date;
  status: string;
  runBy: string | null;
  remarks: string | null;
}

export class PlanningExceptionProjection {
  id: string;
  planningRunId: string;
  materialId: string | null;
  exceptionType: string;
  exceptionMessage: string;
  severity: string;
  createdAt: Date;
}

export class PlanningRecommendationItemProjection {
  id: string;
  materialId: string;
  requiredQuantity: number;
  requiredDate: Date | null;
  source: string;
  status: string;
}

export class PlanningRecommendationProjection {
  id: string;
  planningRunId: string;
  projectId: string;
  recommendationNo: string | null;
  status: string;
  items: PlanningRecommendationItemProjection[];
}

export class InventoryProjection {
  materialId: string;
  availableStock: number;
  reservedStock: number;
  incomingStock: number;
}
