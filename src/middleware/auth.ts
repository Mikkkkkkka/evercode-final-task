import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors.js';

export function auth(apiKey: string) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const header = request.header('authorization');
    if (header !== `Bearer ${apiKey}`) {
      next(new UnauthorizedError());
      return;
    }
    next();
  };
}
