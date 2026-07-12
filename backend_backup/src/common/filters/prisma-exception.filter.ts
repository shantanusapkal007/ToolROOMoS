import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'UNKNOWN_DATABASE_ERROR';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Unique constraint failed on the field(s): ${exception.meta?.target}`;
          code = exception.code;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record to update or delete not found.';
          code = exception.code;
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed.';
          code = exception.code;
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = exception.message.replace(/\n/g, '');
          code = exception.code;
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error: Invalid data provided to the database.';
      code = 'VALIDATION_ERROR';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: code,
    });
  }
}
