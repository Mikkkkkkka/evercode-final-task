import { openDatabase } from '../dist/database/connection.js';
import { createApp } from '../dist/app.js';
import { ValidationError } from '../dist/errors.js';

export const testConfig = {
  port: 0,
  apiKey: 'test-key',
  dbPath: ':memory:',
  binanceBaseUrl: 'https://example.invalid',
  mempoolBaseUrl: 'https://example.invalid',
  requestTimeoutMs: 50,
  retryAttempts: 1,
  retryDelayMs: 1,
  syncIntervalMs: 1000
};

export async function createTestContext(overrides = {}) {
  const db = await openDatabase(':memory:');
  const binanceClient = {
    price: 42123.45,
    error: null,
    async getUsdtPrice() {
      if (this.error) throw this.error;
      return this.price;
    }
  };
  const blockchainClient = {
    height: 900001,
    balance: 0.25,
    error: null,
    async getHeight(network) {
      if (network !== 'bitcoin') throw new ValidationError('Only bitcoin network is supported for blockchain data');
      if (this.error) throw this.error;
      return this.height;
    },
    async getBalance(network) {
      if (network !== 'bitcoin') throw new ValidationError('Only bitcoin network is supported for blockchain data');
      if (this.error) throw this.error;
      return this.balance;
    }
  };
  const app = createApp(db, testConfig, {
    binanceClient,
    blockchainClient,
    ...overrides
  });

  return { app, db, binanceClient, blockchainClient };
}

export function auth(request) {
  return request.set('Authorization', `Bearer ${testConfig.apiKey}`);
}
