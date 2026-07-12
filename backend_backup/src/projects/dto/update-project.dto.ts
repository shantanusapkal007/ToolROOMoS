import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

// currentStage is intentionally EXCLUDED from UpdateProjectDto.
// Stage transitions must only happen through the WorkflowOrchestrator or dedicated
// stage-management endpoints (advance-stage, reopen-engineering, close, etc.).
// Allowing currentStage in a generic update endpoint bypasses all stage-gate business rules.
export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, ['plantId'] as const)
) {}
