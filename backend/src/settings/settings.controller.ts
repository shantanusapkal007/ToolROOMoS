import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Controller('api/v1/settings/preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAllPreferences() {
    const data = await this.settingsService.getAllPreferences();
    return {
      status: 'success',
      data,
    };
  }

  @Get(':key')
  async getPreference(@Param('key') key: string) {
    const data = await this.settingsService.getPreference(key);
    return {
      status: 'success',
      data,
    };
  }

  @Post()
  @Roles(SystemRole.ADMIN)
  async setPreferences(@Body() body: UpdatePreferencesDto) {
    if (body.preferences) {
      const data = await this.settingsService.setMultiplePreferences(body.preferences);
      return { status: 'success', data };
    } else if (body.key) {
      const data = await this.settingsService.setPreference(body.key, body.value);
      return { status: 'success', data };
    }
    return { status: 'error', message: 'Invalid payload' };
  }
}
