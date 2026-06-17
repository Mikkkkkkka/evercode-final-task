import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import createLogger from '../logger/index.js';

const logger = createLogger('http');

export function requestLogger(request: Request, response: Response, next: NextFunction): void {
  const headerRequestId = request.header('x-request-id');
  const requestId = headerRequestId && headerRequestId.trim().length > 0 ? headerRequestId : randomUUID();
  const startedAt = process.hrtime.bigint();

  response.locals.requestId = requestId;
  response.setHeader('x-request-id', requestId);

  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const context = {
      requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Math.round(durationMs)
    };

    if (response.statusCode >= 500) {
      logger.error('HTTP request completed', context);
      return;
    }

    if (response.statusCode >= 400) {
      logger.warn('HTTP request completed', context);
      return;
    }

    logger.info('HTTP request completed', context);
  });

  next();
}
