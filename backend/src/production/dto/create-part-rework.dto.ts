import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePartReworkDto {
  @IsString()
  @IsNotEmpty()
  partName: string;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsString()
  bomItemId?: string;

  @IsOptional()
  @IsString()
  sourceStage?: string; // ENGINEERING, MACHINING, FITTING, ASSEMBLY, TRIAL, QUALITY_INSPECTION, CUSTOMER_BUYOFF

  @IsOptional()
  @IsString()
  reworkType?: string; // CORRECTIVE_MACHINING, WELD_AND_REMILL, EDM_EROSION, WIRE_CUT, GRINDING_POLISHING, HEAT_TREATMENT_STRESS_RELIEF, FITTING_DEBURR, REBORE_ALIGN, SHIM_ADJUSTMENT, OTHER

  @IsOptional()
  @IsString()
  defectReason?: string; // DIMENSION_OVERSIZE, DIMENSION_UNDERSIZE, SURFACE_DEFECT, CLEARANCE_TIGHT, WARPAGE_DISTORTION, HOLE_MISALIGNMENT, BURR_IN_TRIAL, TOOL_MARK, HARDENING_DEVIATION, OTHER

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  severity?: string; // NORMAL, URGENT, CRITICAL

  @IsOptional()
  @IsString()
  targetDepartment?: string; // MACHINE_SHOP, TOOL_ROOM_FITTING, EDM_SECTION, GRINDING_SECTION, WELDING_SECTION, SUBCONTRACTOR

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  trialId?: string;

  @IsOptional()
  @IsString()
  ncrId?: string;

  @IsOptional()
  @IsString()
  requestedBy?: string;
}
