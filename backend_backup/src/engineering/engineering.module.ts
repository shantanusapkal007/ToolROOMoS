import { Module } from '@nestjs/common';
import { GlobalEngineeringController } from './global-engineering.controller';
import { EngineeringController } from './engineering.controller';
import { EngineeringService } from './engineering.service';
import { BomsService } from './boms.service';
import { RoutingService } from './routing.service';
import { CostBaselineService } from './cost-baseline.service';

// New Architecture Imports
import { BomRepository } from './bom/repositories/bom.repository';
import { BomQueryService } from './bom/queries/bom-query.service';
import { BomCommandService } from './bom/commands/bom-command.service';
import { BomValidationService } from './bom/validators/bom-validation.service';
import { BomRevisionService } from './bom/revision/bom-revision.service';
import { BomTreeService } from './bom/tree/bom-tree.service';

import { RoutingRepository } from './routing/repositories/routing.repository';
import { RoutingQueryService } from './routing/queries/routing-query.service';
import { RoutingCommandService } from './routing/commands/routing-command.service';
import { RoutingValidationService } from './routing/validators/routing-validation.service';

import { CostRollupEngine } from './costing/engine/cost-rollup.engine';
import { EngineeringLifecycleService } from './workflow/engine/engineering-lifecycle.service';

const legacyProviders = [EngineeringService, BomsService, RoutingService, CostBaselineService];

const newProviders = [
  BomRepository,
  BomQueryService,
  BomCommandService,
  BomValidationService,
  BomRevisionService,
  BomTreeService,

  RoutingRepository,
  RoutingQueryService,
  RoutingCommandService,
  RoutingValidationService,

  CostRollupEngine,
  EngineeringLifecycleService,
];

@Module({
  controllers: [GlobalEngineeringController, EngineeringController],
  providers: [...legacyProviders, ...newProviders],
  exports: [...legacyProviders, ...newProviders],
})
export class EngineeringModule {}
