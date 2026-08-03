import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllPreferences() {
    const settings = await this.prisma.systemSetting.findMany();
    const map: Record<string, any> = {};
    settings.forEach(s => {
      map[s.settingKey] = s.settingValue;
    });
    return map;
  }

  async getPreference(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });
    return setting ? setting.settingValue : null;
  }

  async setPreference(key: string, value: any) {
    return this.prisma.systemSetting.upsert({
      where: { settingKey: key },
      update: { settingValue: value },
      create: {
        settingKey: key,
        settingValue: value,
      },
    });
  }

  async setMultiplePreferences(preferences: Record<string, any>) {
    const results = [];
    for (const [key, value] of Object.entries(preferences)) {
      const res = await this.setPreference(key, value);
      results.push(res);
    }
    return results;
  }
}
