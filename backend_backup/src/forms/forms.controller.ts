import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/settings/forms')
@UseGuards(JwtAuthGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
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
