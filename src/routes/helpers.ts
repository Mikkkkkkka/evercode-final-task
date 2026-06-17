import { ValidationError } from '../errors.js';

export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError('id must be a positive integer');
  }
  return id;
}
