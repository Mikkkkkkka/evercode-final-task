import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Database } from 'sqlite';
import type { AppConfig } from './config.js';
import { RetryHttpClient } from './clients/retryHttpClient.js';
import { BinanceClient } from './clients/binanceClient.js';
import { BlockchainClient } from './clients/blockchainClient.js';
import { CoinRepository } from './repositories/coinRepository.js';
import { AddressRepository } from './repositories/addressRepository.js';
import { MarketRepository } from './repositories/marketRepository.js';
import { MarketService } from './services/marketService.js';
import { auth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { coinsRouter } from './routes/coins.js';
import { addressesRouter } from './routes/addresses.js';
import { marketRouter } from './routes/market.js';
import { openApiDocument } from './docs/openapi.js';
import createLogger from './logger/index.js';

export type AppDependencies = {
  binanceClient?: BinanceClient;
  blockchainClient?: BlockchainClient;
};

export function createApp(db: Database, config: AppConfig, dependencies: AppDependencies = {}): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);

  const coinRepository = new CoinRepository(db);
  const addressRepository = new AddressRepository(db);
  const marketRepository = new MarketRepository(db);
  const binanceLogger = createLogger('binance-client');
  const blockchainLogger = createLogger('blockchain-client');
  const marketLogger = createLogger('market-service');

  const binanceClient =
    dependencies.binanceClient ??
    new BinanceClient(
      new RetryHttpClient({
        baseURL: config.binanceBaseUrl,
        timeoutMs: config.requestTimeoutMs,
        retryAttempts: config.retryAttempts,
        retryDelayMs: config.retryDelayMs
      }, binanceLogger)
    );
  const blockchainClient =
    dependencies.blockchainClient ??
    new BlockchainClient(
      new RetryHttpClient({
        baseURL: config.mempoolBaseUrl,
        timeoutMs: config.requestTimeoutMs,
        retryAttempts: config.retryAttempts,
        retryDelayMs: config.retryDelayMs
      }, blockchainLogger)
    );
  const marketService = new MarketService(
    coinRepository,
    addressRepository,
    marketRepository,
    binanceClient,
    blockchainClient,
    marketLogger
  );

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get('/openapi.json', (_request, response) => {
    response.json(openApiDocument);
  });

  app.use(auth(config.apiKey));
  app.use('/coins', coinsRouter(coinRepository));
  app.use('/addresses', addressesRouter(addressRepository, marketService));
  app.use(marketRouter(marketService));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export function createMarketService(db: Database, config: AppConfig): MarketService {
  const binanceLogger = createLogger('binance-client');
  const blockchainLogger = createLogger('blockchain-client');
  const marketLogger = createLogger('market-service');

  return new MarketService(
    new CoinRepository(db),
    new AddressRepository(db),
    new MarketRepository(db),
    new BinanceClient(
      new RetryHttpClient({
        baseURL: config.binanceBaseUrl,
        timeoutMs: config.requestTimeoutMs,
        retryAttempts: config.retryAttempts,
        retryDelayMs: config.retryDelayMs
      }, binanceLogger)
    ),
    new BlockchainClient(
      new RetryHttpClient({
        baseURL: config.mempoolBaseUrl,
        timeoutMs: config.requestTimeoutMs,
        retryAttempts: config.retryAttempts,
        retryDelayMs: config.retryDelayMs
      }, blockchainLogger)
    ),
    marketLogger
  );
}
