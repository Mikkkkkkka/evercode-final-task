import dotenv from 'dotenv';

dotenv.config();

export type AppConfig = {
  port: number;
  apiKey: string;
  dbPath: string;
  binanceBaseUrl: string;
  mempoolBaseUrl: string;
  requestTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  syncIntervalMs: number;
};

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    apiKey: process.env.API_KEY ?? 'dev-api-key',
    dbPath: process.env.DB_PATH ?? 'data/app.sqlite',
    binanceBaseUrl: process.env.BINANCE_BASE_URL ?? 'https://api.binance.com',
    mempoolBaseUrl: process.env.MEMPOOL_BASE_URL ?? 'https://mempool.space/api',
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS ?? 5000),
    retryAttempts: Number(process.env.RETRY_ATTEMPTS ?? 2),
    retryDelayMs: Number(process.env.RETRY_DELAY_MS ?? 100),
    syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 60000)
  };
}
