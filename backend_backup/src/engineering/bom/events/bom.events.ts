export class BomCreated {
  constructor(public readonly bomHeaderId: string, public readonly projectId: string) {}
}

export class BomUpdated {
  constructor(public readonly bomHeaderId: string) {}
}

export class BomApproved {
  constructor(public readonly bomHeaderId: string, public readonly projectId: string) {}
}

export class BomSuperseded {
  constructor(public readonly bomHeaderId: string) {}
}
