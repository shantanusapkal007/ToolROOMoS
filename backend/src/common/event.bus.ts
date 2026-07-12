import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emits a domain event asynchronously.
   * Other modules can listen to this event using `@OnEvent(eventName)`
   *
   * @param eventName - The name of the event (e.g., 'document.approved')
   * @param payload - The data associated with the event
   */
  emit(eventName: string, payload: any) {
    this.logger.log(`Emitting Event: ${eventName}`);
    this.eventEmitter.emit(eventName, payload);
  }

  /**
   * Emits a domain event and waits for all listeners to finish.
   * Useful when event handlers must complete in the same transaction or request scope.
   */
  async emitAsync(eventName: string, payload: any): Promise<any[]> {
    this.logger.log(`Emitting Async Event: ${eventName}`);
    return this.eventEmitter.emitAsync(eventName, payload);
  }
}
