import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [MaterialsController],
  providers: [MaterialsService, InventoryService],
  exports: [MaterialsService, InventoryService],
})
export class MaterialsModule {}
