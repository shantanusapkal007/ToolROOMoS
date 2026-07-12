export class PlanningRunStarted {
  constructor(public readonly projectId: string) {}
}

export class PlanningRunCompleted {
  constructor(public readonly runId: string, public readonly projectId: string) {}
}

export class PlanningRecommendationsCreated {
  constructor(public readonly recommendationId: string) {}
}

export class PlanningExceptionsGenerated {
  constructor(public readonly runId: string) {}
}
