import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

export interface StandardResponse<T> {
  success: boolean;
  version: string;
  data: T;
  metadata: {
    correlationId: string;
    timestamp: string;
    path: string;
  };
  legacy: {
    status: string;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const correlationId = request.headers[CORRELATION_ID_HEADER] as string || '';

    return next.handle().pipe(
      map(data => {
        // If the controller already returned a wrapped response (e.g., legacy code), don't double wrap it.
        if (data && typeof data === 'object' && 'success' in data && 'version' in data) {
            return data as StandardResponse<T>;
        }

        return {
          success: true,
          version: 'v1',
          data,
          metadata: {
            correlationId,
            timestamp: new Date().toISOString(),
            path: request.url,
          },
          legacy: {
            status: 'success',
          },
        };
      }),
    );
  }
}
