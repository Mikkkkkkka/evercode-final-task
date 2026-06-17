import axios, { AxiosError, type AxiosInstance } from 'axios';
import { ExternalServiceError } from '../errors.js';
import createLogger, { type AppLogger } from '../logger/index.js';

export type RetryHttpOptions = {
  baseURL: string;
  timeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof AxiosError)) {
    return false;
  }
  if (!error.response) {
    return true;
  }
  return error.response.status >= 500 || error.response.status === 429;
}

export class RetryHttpClient {
  private readonly client: AxiosInstance;

  constructor(
    private readonly options: RetryHttpOptions,
    private readonly logger: AppLogger = createLogger('retry-http-client')
  ) {
    this.client = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeoutMs
    });
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.retryAttempts; attempt += 1) {
      const startedAt = process.hrtime.bigint();
      try {
        this.logger.debug('External request started', {
          method: 'GET',
          url,
          attempt: attempt + 1
        });
        const response = await this.client.get<T>(url, { params });
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        this.logger.info('External request completed', {
          method: 'GET',
          url,
          attempt: attempt + 1,
          statusCode: response.status,
          durationMs: Math.round(durationMs)
        });
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt === this.options.retryAttempts || !isRetryable(error)) {
          break;
        }
        this.logger.warn('External request failed, retrying', {
          method: 'GET',
          url,
          attempt: attempt + 1,
          error
        });
        await delay(this.options.retryDelayMs * (attempt + 1));
      }
    }

    const detail = lastError instanceof Error ? lastError.message : 'unknown error';
    this.logger.error('External request failed permanently', {
      method: 'GET',
      url,
      error: lastError
    });
    throw new ExternalServiceError(`External request failed: ${detail}`);
  }
}
