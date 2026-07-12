import { Module, Global } from "@nestjs/common";
import { SequenceEngine } from "./sequence.engine";
import { EventBus } from "./event.bus";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [SequenceEngine, EventBus],
  exports: [SequenceEngine, EventBus],
})
export class CommonModule {}