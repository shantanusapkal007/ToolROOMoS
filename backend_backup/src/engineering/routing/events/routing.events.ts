export class RoutingCreated {
  constructor(public readonly routingHeaderId: string, public readonly projectId: string) {}
}

export class RoutingUpdated {
  constructor(public readonly routingHeaderId: string) {}
}

export class RoutingApproved {
  constructor(public readonly routingHeaderId: string, public readonly projectId: string) {}
}

export class RoutingSuperseded {
  constructor(public readonly routingHeaderId: string) {}
}
