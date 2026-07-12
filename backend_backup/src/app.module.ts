import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './platform/config/env.validation';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { AuditIdentityMiddleware } from './common/middleware/audit-identity.middleware';
import { ClsModule } from './common/cls/cls.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CustomersModule } from './master-data/customers/customers.module';
import { VendorsModule } from './master-data/vendors/vendors.module';
import { MaterialsModule } from './master-data/materials/materials.module';
import { MachinesModule } from './master-data/machines/machines.module';
import { EmployeesModule } from './master-data/employees/employees.module';
import { WarehousesModule } from './master-data/warehouses/warehouses.module';
import { LocationsModule } from './master-data/locations/locations.module';
import { OperationsModule } from './master-data/operations/operations.module';
import { ProjectsModule } from './projects/projects.module';
import { EngineeringModule } from './engineering/engineering.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ProductionModule } from './production/production.module';
import { SubcontractingModule } from './subcontracting/subcontracting.module';
import { QualityModule } from './quality/quality.module';
import { AssemblyModule } from './assembly/assembly.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { FinanceModule } from './finance/finance.module';
import { CostEngineModule } from './cost-engine/cost-engine.module';
import { HrModule } from './hr/hr.module';
import { AutomationModule } from './automation/automation.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './modules/logger/logger.module';
import { SearchModule } from './search/search.module';
import { FormsModule } from './forms/forms.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { InspectionStandardsModule } from './master-data/inspection-standards/inspection-standards.module';
import { LookupsModule } from './master-data/lookups/lookups.module';
import { InventoryModule } from './inventory/inventory.module';
// NEW: Document-Centric Infrastructure Modules
import { AuditModule } from './common/audit/audit.module';
import { AttachmentsModule } from './common/attachments/attachments.module';
import { CustomFieldsModule } from './common/custom-fields/custom-fields.module';
import { ExcelModule } from './common/excel/excel.module';
import { MachineRatesModule } from './master-data/machine-rates/machine-rates.module';
import { PlatformModule } from './platform/platform.module';
import { OrganizationModule } from './master-data/organization/organization.module';
import { ResourcesModule } from './master-data/resources/resources.module';
import { CommercialModule } from './master-data/commercial/commercial.module';
import { PlanningModule } from './planning/planning.module';

/**
 * AppModule
 * 
 * Root module of ToolRoomOS Backend.
 * PrismaModule is @Global — automatically available everywhere.
 * Master Data and Workflow modules are imported here as the system grows.
 */
@Module({
  imports: [
    // Configuration Validation
    ConfigModule.forRoot({
      validate,
      isGlobal: true, // Make env variables accessible globally
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Document-Centric Infrastructure (Global)
    PlatformModule,
    ClsModule,
    AuditModule,
    AttachmentsModule,
    CustomFieldsModule,
    ExcelModule,

    // Maintenance Module
    MaintenanceModule,

    // Layer 5 — Persistence (Global)
    PrismaModule,

    // Layer 0 — Security
    AuthModule,
    UsersModule,

    // Layer 1 — Master Data
    CustomersModule,
    VendorsModule,
    MaterialsModule,
    MachinesModule,
    EmployeesModule,
    WarehousesModule,
    LocationsModule,
    OperationsModule,
    LookupsModule,

    // Layer 2 — Business Objects
    ProjectsModule,

    // Layer 3 & 4 — Business Documents & Operational Events
    EngineeringModule,
    ProcurementModule,
    ProductionModule,
    SubcontractingModule,
    HrModule,
    AutomationModule,
    HealthModule,
    LoggerModule,
    SearchModule,
    FormsModule,
    ReportsModule,
    InspectionStandardsModule,
    MachineRatesModule,
    OrganizationModule,
    ResourcesModule,
    CommercialModule,
    PlanningModule,
    InventoryModule,

    // Layer 5 — Phase 9-15 Domain Modules
    QualityModule,
    AssemblyModule,
    DispatchModule,
    FinanceModule,
    CostEngineModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(AuditIdentityMiddleware).forRoutes('*');
  }
}
