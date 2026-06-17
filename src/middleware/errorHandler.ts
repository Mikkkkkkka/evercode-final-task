import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors.js';
import createLogger from '../logger/index.js';

const logger = createLogger('error-handler');

export function notFound(request: Request, response: Response): void {
  logger.warn('Route was not found', {
    requestId: response.locals.requestId,
    method: request.method,
    path: request.originalUrl
  });
  response.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route was not found'
    }
  });
}

export function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    logger.warn('Request failed with application error', {
      requestId: response.locals.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: error.statusCode,
      code: error.code,
      error
    });
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  logger.error('Request failed with unexpected error', {
    requestId: response.locals.requestId,
    method: request.method,
    path: request.originalUrl,
    error
  });
  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
}
