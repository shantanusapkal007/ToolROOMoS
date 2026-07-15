import { Module, Global } from "@nestjs/common";
import { SequenceEngine } from "./sequence.engine";
import { EventBus } from "./event.bus";
import { AuditEngine } from "./audit.engine";
import { AuditLogsController } from "./audit-logs.controller";
import { EventEmitterModule } from "@nestjs/event-emitter";

@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [AuditLogsController],
  providers: [SequenceEngine, EventBus, AuditEngine],
  exports: [SequenceEngine, EventBus, AuditEngine],
})
export class CommonModule {}