import { ValidationError } from './errors.js';

const symbolPattern = /^[A-Z0-9]{2,12}$/;
const networkPattern = /^[a-z0-9_-]{2,32}$/;

export function requireBodyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('Request body must be an object');
  }
  return value as Record<string, unknown>;
}

export function readString(value: unknown, field: string, min = 1, max = 128): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ValidationError(`${field} length must be between ${min} and ${max}`);
  }
  return trimmed;
}

export function readOptionalString(value: unknown, field: string, max = 128): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return readString(value, field, 1, max);
}

export function normalizeSymbol(value: unknown, field = 'symbol'): string {
  const symbol = readString(value, field, 2, 12).toUpperCase();
  if (!symbolPattern.test(symbol)) {
    throw new ValidationError(`${field} must contain 2-12 uppercase letters or digits`);
  }
  return symbol;
}

export function normalizeNetwork(value: unknown): string {
  const network = readString(value, 'network', 2, 32).toLowerCase();
  if (!networkPattern.test(network)) {
    throw new ValidationError('network must contain lowercase letters, digits, underscore or dash');
  }
  return network;
}

export function readPositiveInt(value: unknown, field: string, fallback: number, max: number): number {
  if (value === undefined) {
    return fallback;
  }
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > max) {
    throw new ValidationError(`${field} must be an integer between 1 and ${max}`);
  }
  return numberValue;
}
