import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './master-data/customers/customers.module';
import { VendorsModule } from './master-data/vendors/vendors.module';
import { MaterialsModule } from './master-data/materials/materials.module';
import { MachinesModule } from './master-data/machines/machines.module';
import { EmployeesModule } from './master-data/employees/employees.module';
import { ProjectsModule } from './projects/projects.module';
import { EngineeringModule } from './engineering/engineering.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ProductionModule } from './production/production.module';
import { LogisticsFinanceModule } from './logistics-finance/logistics-finance.module';

/**
 * AppModule
 * 
 * Root module of ToolRoomOS Backend.
 * PrismaModule is @Global — automatically available everywhere.
 * Master Data and Workflow modules are imported here as the system grows.
 */
@Module({
  imports: [
    // Layer 5 — Persistence (Global)
    PrismaModule,

    // Layer 1 — Master Data
    CustomersModule,
    VendorsModule,
    MaterialsModule,
    MachinesModule,
    EmployeesModule,

    // Layer 2 — Business Objects
    ProjectsModule,

    // Layer 3 & 4 — Business Documents & Operational Events
    EngineeringModule,
    ProcurementModule,
    ProductionModule,
    LogisticsFinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
