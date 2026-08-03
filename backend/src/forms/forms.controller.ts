import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';

@Controller('api/v1/settings/forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @Roles(SystemRole.ADMIN, SystemRole.ENGINEERING)
  async saveForm(@Body() body: { formId: string, name: string, schema: any }) {
    const data = await this.formsService.saveForm(body.formId, body.name, body.schema);
    return {
      status: 'success',
      data,
    };
  }

  @Get()
  async getForms() {
    const data = await this.formsService.getForms();
    return {
      status: 'success',
      data,
    };
  }

  @Get(':formId')
  async getForm(@Param('formId') formId: string) {
    const data = await this.formsService.getForm(formId);
    return {
      status: 'success',
      data,
    };
  }
}
