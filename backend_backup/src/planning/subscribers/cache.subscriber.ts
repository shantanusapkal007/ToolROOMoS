// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheEngine } from '../../platform/cache.engine';
import { PlanningRunCompleted } from '../events/planning.events';

@Injectable()
export class PlanningCacheSubscriber {
  constructor(private readonly cache: CacheEngine) {}

  @OnEvent('PlanningRunCompleted')
  async handlePlanningRunCompleted(event: PlanningRunCompleted) {
    // Invalidate project's planning run lists
    await this.cache.invalidatePattern(`planning:runs:project:${event.projectId}*`);
    await this.cache.invalidatePattern(`planning:exceptions:project:${event.projectId}*`);
    await this.cache.invalidatePattern(`planning:recommendations:project:${event.projectId}*`);
  }
}

