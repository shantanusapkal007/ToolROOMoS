$schemaPath = "e:\projects\enterprise toolroom\ToolRoomOS\backend\prisma\schema.prisma"
$schema = Get-Content $schemaPath -Raw

# Add reverse relations
$schema = $schema -replace '@@map\("projects"\)', "wipLedgers WipLedger[]`n  productionSchedules ProductionSchedule[]`n`n  @@map(`"projects`")"
$schema = $schema -replace '@@map\("materials"\)', "wipLedgers WipLedger[]`n`n  @@map(`"materials`")"
$schema = $schema -replace '@@map\("inventory_batches"\)', "wipLedgers WipLedger[]`n`n  @@map(`"inventory_batches`")"
$schema = $schema -replace '@@map\("routing_operations"\)', "wipLedgers WipLedger[]`n`n  @@map(`"routing_operations`")"
$schema = $schema -replace '@@map\("machines"\)', "wipLedgers WipLedger[]`n  machineCalendars MachineCalendar[]`n  productionSchedules ProductionSchedule[]`n  oeeDailyLogs OeeDailyLog[]`n`n  @@map(`"machines`")"
$schema = $schema -replace '@@map\("job_cards"\)', "productionSchedules ProductionSchedule[]`n`n  @@map(`"job_cards`")"
$schema = $schema -replace '@@map\("shifts"\)', "machineCalendars MachineCalendar[]`n`n  @@map(`"shifts`")"

$newModels = @"

// --- SPRINT 3 ENTERPRISE MODELS ---

model WipLedger {
  id                 String           @id @default(uuid())
  projectId          String
  materialId         String
  batchId            String?
  routingOperationId String?
  machineId          String?
  qtyInWip           Decimal
  accruedMaterialCost Decimal         @default(0)
  accruedMachineCost Decimal          @default(0)
  accruedLabourCost  Decimal          @default(0)
  status             String           @default("IN_PROCESS") // IN_PROCESS, SCRAPPED, FINISHED
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  project            Project          @relation(fields: [projectId], references: [id])
  material           Material         @relation(fields: [materialId], references: [id])
  batch              InventoryBatch?  @relation(fields: [batchId], references: [id])
  routingOperation   RoutingOperation? @relation(fields: [routingOperationId], references: [id])
  machine            Machine?         @relation(fields: [machineId], references: [id])

  @@map("wip_ledger")
}

model WipValuationSnapshot {
  id                 String           @id @default(uuid())
  snapshotDate       DateTime
  totalWipValue      Decimal
  totalMaterialCost  Decimal
  totalMachineCost   Decimal
  totalLabourCost    Decimal
  createdAt          DateTime         @default(now())

  @@map("wip_valuation_snapshots")
}

model MachineCalendar {
  id                 String           @id @default(uuid())
  machineId          String
  date               DateTime
  shiftId            String?
  isAvailable        Boolean          @default(true)
  plannedMaintenance Boolean          @default(false)
  maintenanceNotes   String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  machine            Machine          @relation(fields: [machineId], references: [id])
  shift              Shift?           @relation(fields: [shiftId], references: [id])

  @@map("machine_calendars")
}

model ProductionSchedule {
  id                 String           @id @default(uuid())
  projectId          String
  jobCardId          String
  machineId          String
  scheduledDate      DateTime
  scheduledStartTime DateTime
  scheduledEndTime   DateTime
  estimatedHours     Decimal
  status             String           @default("SCHEDULED")
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  project            Project          @relation(fields: [projectId], references: [id])
  jobCard            JobCard          @relation(fields: [jobCardId], references: [id])
  machine            Machine          @relation(fields: [machineId], references: [id])

  @@map("production_schedules")
}

model OeeDailyLog {
  id                 String           @id @default(uuid())
  machineId          String
  logDate            DateTime
  availabilityScore  Decimal          @default(0)
  performanceScore   Decimal          @default(0)
  qualityScore       Decimal          @default(0)
  oeeScore           Decimal          @default(0)
  plannedTime        Decimal          @default(0)
  operatingTime      Decimal          @default(0)
  totalParts         Decimal          @default(0)
  goodParts          Decimal          @default(0)
  createdAt          DateTime         @default(now())

  machine            Machine          @relation(fields: [machineId], references: [id])

  @@map("oee_daily_logs")
}

"@

$schema = $schema -replace 'enum ProjectStatus \{', "$newModels`nenum ProjectStatus {"
Set-Content -Path $schemaPath -Value $schema -NoNewline
