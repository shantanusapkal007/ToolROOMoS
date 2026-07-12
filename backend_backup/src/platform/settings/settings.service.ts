// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheEngine } from '../cache.engine';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheEngine
  ) {}

  async get(key: string, plantId?: string, defaultValue?: string): Promise<string> {
    const cacheKey = `setting:${plantId || 'global'}:${key}`;
    
    return this.cache.getOrSet(cacheKey, async () => {
      // First try to find plant specific override
      if (plantId) {
        const override = await this.prisma.systemSetting.findUnique({
          where: { plantId_settingKey: { plantId, settingKey: key } }
        });
        if (override) return String(override.settingValue);
      }

      // Fallback to global setting
      const global = await this.prisma.systemSetting.findFirst({
        where: { settingKey: key, plantId: null }
      });

      return global ? String(global.settingValue) : (defaultValue ?? '');
    }, 3600); // 1 hour cache
  }

  async set(key: string, value: string, plantId?: string, updatedBy: string = 'SYSTEM'): Promise<void> {
    if (plantId) {
      await this.prisma.systemSetting.upsert({
        where: { plantId_settingKey: { plantId, settingKey: key } },
        update: { settingValue: value, updatedBy },
        create: { plantId, settingKey: key, settingValue: value, updatedBy }
      });
    } else {
      // Global setting
      const existing = await this.prisma.systemSetting.findFirst({ where: { settingKey: key, plantId: null } });
      if (existing) {
        await this.prisma.systemSetting.update({ where: { id: existing.id }, data: { settingValue: value, updatedBy } });
      } else {
        await this.prisma.systemSetting.create({ data: { settingKey: key, settingValue: value, updatedBy } });
      }
    }

    // Invalidate cache
    const cacheKey = `setting:${plantId || 'global'}:${key}`;
    await this.cache.del(cacheKey);
    this.logger.log(`Setting ${key} updated for ${plantId || 'global'}. Cache invalidated.`);
  }
}

