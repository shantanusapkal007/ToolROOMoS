import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule
 * 
 * Registered as @Global so every module in the application
 * can inject PrismaService without importing PrismaModule explicitly.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
