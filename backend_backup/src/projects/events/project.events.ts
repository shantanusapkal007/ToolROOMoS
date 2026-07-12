export class ProjectCreated {
  constructor(public readonly projectId: string, public readonly projectNumber: string) {}
}

export class ProjectUpdated {
  constructor(public readonly projectId: string) {}
}

export class ProjectStageChanged {
  constructor(
    public readonly projectId: string,
    public readonly fromStage: string,
    public readonly toStage: string,
    public readonly remarks?: string
  ) {}
}

export class ProjectClosed {
  constructor(public readonly projectId: string) {}
}

export class ProjectArchived {
  constructor(public readonly projectId: string) {}
}

export class MilestoneCompleted {
  constructor(public readonly projectId: string, public readonly milestoneId: string) {}
}

export class ProjectBudgetUpdated {
  constructor(public readonly projectId: string, public readonly newTotalCost: number) {}
}

export class ProjectOwnerAssigned {
  constructor(public readonly projectId: string, public readonly ownerId: string) {}
}
