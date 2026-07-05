import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { LogisticsFinanceModule } from './logistics-finance/logistics-finance.module';
import { HrModule } from './hr/hr.module';
import { AutomationModule } from './automation/automation.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './modules/logger/logger.module';

/**
 * AppModule
 * 
 * Root module of ToolRoomOS Backend.
 * PrismaModule is @Global — automatically available everywhere.
 * Master Data and Workflow modules are imported here as the system grows.
 */
@Module({
  imports: [
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Layer 5 — Persistence (Global)
    PrismaModule,

    // Layer 0 — Security
    AuthModule,

    // Layer 1 — Master Data
    CustomersModule,
    VendorsModule,
    MaterialsModule,
    MachinesModule,
    EmployeesModule,
    WarehousesModule,
    LocationsModule,
    OperationsModule,

    // Layer 2 — Business Objects
    ProjectsModule,

    // Layer 3 & 4 — Business Documents & Operational Events
    EngineeringModule,
    ProcurementModule,
    ProductionModule,
    SubcontractingModule,
    LogisticsFinanceModule,
    HrModule,
    AutomationModule,
    HealthModule,
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
export class AppModule {}
