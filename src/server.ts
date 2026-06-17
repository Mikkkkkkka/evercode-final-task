import http from 'node:http';
import { loadConfig } from './config.js';
import { openDatabase } from './database/connection.js';
import { createApp, createMarketService } from './app.js';
import { Scheduler } from './services/scheduler.js';
import createLogger from './logger/index.js';

const logger = createLogger('server');

const config = loadConfig();
const db = await openDatabase(config.dbPath);
const app = createApp(db, config);
const server = http.createServer(app);
const marketService = createMarketService(db, config);
const scheduler = new Scheduler(config.syncIntervalMs, () => marketService.syncTrackedData());

scheduler.start();

server.listen(config.port, () => {
  logger.info('API server started', { port: config.port });
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  logger.info('Shutdown signal received', { signal });
  scheduler.stop();
  server.close(async () => {
    await db.close();
    logger.info('API server stopped');
    process.exit(0);
  });
}

process.on('SIGINT', (signal) => {
  void shutdown(signal);
});

process.on('SIGTERM', (signal) => {
  void shutdown(signal);
});
