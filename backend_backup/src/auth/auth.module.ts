import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';

import { PlantScopeGuard } from './guards/plant-scope.guard';
import { ProjectScopeGuard } from './guards/project-scope.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'test_fallback_jwt_secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    RolesGuard,
    PlantScopeGuard,
    ProjectScopeGuard,
    {
      provide: 'JWT_SECRET_VALIDATOR',
      useFactory: () => {
        if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'test') {
          throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
        }
      },
    }
  ],
  exports: [AuthService, JwtModule, RolesGuard, PlantScopeGuard, ProjectScopeGuard],
})
export class AuthModule {}
