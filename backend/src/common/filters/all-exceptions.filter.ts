import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * AllExceptionsFilter — catches every uncaught exception and returns a
 * unified JSON error shape. This ensures the frontend always receives:
 * { statusCode, message, error, timestamp }
 *
 * Note: PrismaExceptionFilter (registered alongside this) handles DB-specific
 * error codes before this filter runs. For HttpException (400, 401, 403, 404,
 * 409) this filter handles the formatting.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected server error occurred.';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as any;
        // NestJS ValidationPipe returns { message: string[] } — join into readable text
        message = Array.isArray(res.message) ? res.message.join('; ') : res.message || message;
        error = res.error || exception.constructor.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Do not expose stack traces in production
      if (process.env.NODE_ENV !== 'production') {
        this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      } else {
        this.logger.error(`Unhandled exception: ${exception.message}`);
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
