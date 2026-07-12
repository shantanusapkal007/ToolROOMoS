import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuditIdentityMiddleware implements NestMiddleware {
  constructor(
    private readonly cls: ClsService,
    private readonly jwtService: JwtService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload) {
          this.cls.set('userId', payload.sub);
          this.cls.set('userEmail', payload.email);
          this.cls.set('userRole', payload.role);
          this.cls.set('allowedPlants', payload.allowedPlants || []);
        }
      } catch (e) {
        // Ignore parse errors, JwtGuard will reject invalid tokens.
      }
    }
    next();
  }
}
