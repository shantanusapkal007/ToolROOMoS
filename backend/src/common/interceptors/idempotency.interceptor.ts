import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = (request.method || '').toUpperCase();

    // Only apply to mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'];
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return next.handle();
    }

    try {
      // Check if key already processed
      const existing = await this.prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });

      if (existing && new Date() < existing.expiresAt) {
        const response = context.switchToHttp().getResponse();
        response.status(existing.responseStatus);
        return of(existing.responseBody);
      }
    } catch (e) {
      // If table not ready yet, continue gracefully
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          const response = context.switchToHttp().getResponse();
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours retention
          await this.prisma.idempotencyRecord.upsert({
            where: { key: idempotencyKey },
            update: {
              responseStatus: response.statusCode || 200,
              responseBody: responseBody || {},
              expiresAt,
            },
            create: {
              key: idempotencyKey,
              path: request.url || '',
              method,
              responseStatus: response.statusCode || 200,
              responseBody: responseBody || {},
              expiresAt,
            },
          });
        } catch (err) {
          // Idempotency persistence error is non-blocking to the main transaction
        }
      }),
    );
  }
}
