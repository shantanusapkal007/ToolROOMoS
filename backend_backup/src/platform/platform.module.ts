import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { SequenceEngine } from './sequence.engine';
import { ApprovalEngine } from './approval.engine';
import { AuditEngine } from './audit.engine';
import { EventBus } from './event.bus';
import { CustomFieldsEngine } from './custom-fields.engine';
import { SearchEngine } from './search.engine';
import { ImportExportService } from './import-export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TimeProvider } from './providers/time.provider';
import { LocalFileProvider } from './providers/local-file.provider';
import { FILE_PROVIDER } from './providers/file.provider.interface';
import { SettingsService } from './settings/settings.service';
import { FeatureFlagsService } from './features/feature-flags.service';

import { DocumentRegistryEngine } from './documents/document-registry.engine';
import { DocumentLinkEngine } from './documents/document-link.engine';
import { StateMachineEngine } from './documents/state-machine.engine';
import { CommentsEngine } from './documents/comments.engine';
import { AttachmentEngine } from './documents/attachment.engine';
import { RevisionEngine } from './documents/revision.engine';

import { NotificationEngine } from './notifications/notification.engine';
import { WorkflowEngine } from './workflows/workflow.engine';
import { CacheEngine } from './cache.engine';

@Global()
@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    CacheModule.register(),
  ],
  providers: [
    SequenceEngine,
    ApprovalEngine,
    AuditEngine,
    EventBus,
    CustomFieldsEngine,
    SearchEngine,
    ImportExportService,
    TimeProvider,
    {
      provide: FILE_PROVIDER,
      useClass: LocalFileProvider,
    },
    SettingsService,
    FeatureFlagsService,
    DocumentRegistryEngine,
    DocumentLinkEngine,
    StateMachineEngine,
    CommentsEngine,
    AttachmentEngine,
    RevisionEngine,
    NotificationEngine,
    WorkflowEngine,
    CacheEngine,
  ],
  exports: [
    SequenceEngine,
    ApprovalEngine,
    AuditEngine,
    EventBus,
    CustomFieldsEngine,
    SearchEngine,
    ImportExportService,
    TimeProvider,
    FILE_PROVIDER,
    SettingsService,
    FeatureFlagsService,
    CacheModule,
    DocumentRegistryEngine,
    DocumentLinkEngine,
    StateMachineEngine,
    CommentsEngine,
    AttachmentEngine,
    RevisionEngine,
    NotificationEngine,
    WorkflowEngine,
    CacheEngine,
  ],
})
export class PlatformModule {}
