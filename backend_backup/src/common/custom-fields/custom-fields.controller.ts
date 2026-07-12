import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CustomFieldsService } from './custom-fields.service';

@Controller('api/v1/custom-fields')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Post('definitions')
  @Roles('ADMIN')
  async defineField(@Body() dto: any, @CurrentUser() user: any) {
    const data = await this.customFieldsService.defineField({
      ...dto,
      createdBy: user?.userId,
    });
    return { status: 'success', message: 'Custom field defined.', data };
  }

  @Get('definitions')
  async getAllDefinitions() {
    const data = await this.customFieldsService.getAllDefinitions();
    return { status: 'success', message: 'All custom field definitions retrieved.', data };
  }

  @Get('definitions/:module')
  async getDefinitions(@Param('module') module: string) {
    const data = await this.customFieldsService.getDefinitions(module);
    return { status: 'success', message: 'Custom field definitions retrieved.', data };
  }

  @Delete('definitions/:id')
  @Roles('ADMIN')
  async deleteField(@Param('id') id: string) {
    const data = await this.customFieldsService.deleteField(id);
    return { status: 'success', message: 'Custom field deleted.', data };
  }
}
