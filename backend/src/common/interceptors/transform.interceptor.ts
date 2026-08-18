import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        if (res === null || res === undefined) {
          return {
            success: true,
            data: res as any,
            message: 'Operation completed successfully',
          };
        }

        // If the controller already returned an envelope wrapper
        const isEnvelope = typeof res === 'object' && res !== null && (
          typeof res.success === 'boolean' || 
          res.status === 'success' || 
          res.status === 'error' ||
          (res.data !== undefined && res.message !== undefined && !('id' in res))
        );

        if (isEnvelope) {
          const success = res.success !== undefined ? res.success : (res.status === 'success');
          const data = res.data !== undefined ? res.data : res;
          const meta = res.meta || res.pagination || (res.total !== undefined ? { total: res.total, page: res.page, limit: res.limit, totalPages: res.totalPages } : undefined);
          const message = res.message || 'Operation completed successfully';
          
          return {
            success,
            data,
            ...(meta ? { meta } : {}),
            message,
          };
        }

        return {
          success: true,
          data: res,
          message: 'Operation completed successfully',
        };
      }),
    );
  }
}
