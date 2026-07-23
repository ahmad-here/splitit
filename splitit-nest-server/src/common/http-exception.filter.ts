import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Normalises every error to `{ error: string }`, the shape the Expo app parses
 * in src/api/http-client.ts. Without this, Nest would emit its default
 * `{ statusCode, message, error }` body and the app would show "Bad Request"
 * instead of the real reason.
 */
@Catch()
export class ErrorShapeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal server error.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        error = body;
      } else {
        const msg = (body as { message?: string | string[] }).message;
        error = Array.isArray(msg) ? msg.join(', ') : (msg ?? exception.message);
      }
    } else if (exception instanceof Error) {
      error = exception.message;
    }

    res.status(status).json({ error });
  }
}
