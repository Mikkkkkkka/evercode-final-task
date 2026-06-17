import { Router } from 'express';
import type { MarketService } from '../services/marketService.js';
import { normalizeNetwork, normalizeSymbol, readPositiveInt } from '../validation.js';

export function marketRouter(service: MarketService): Router {
  const router = Router();

  router.post('/prices/:symbol/refresh', async (request, response, next) => {
    try {
      response.json({ data: await service.refreshPrice(normalizeSymbol(request.params.symbol)) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/prices/:symbol/latest', async (request, response, next) => {
    try {
      response.json({ data: await service.latestPrice(normalizeSymbol(request.params.symbol)) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/prices/:symbol/history', async (request, response, next) => {
    try {
      const limit = readPositiveInt(request.query.limit, 'limit', 50, 500);
      response.json({ data: await service.history(normalizeSymbol(request.params.symbol), limit) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/blockchains/:network/height/refresh', async (request, response, next) => {
    try {
      response.json({ data: await service.refreshHeight(normalizeNetwork(request.params.network)) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/blockchains/:network/height', async (request, response, next) => {
    try {
      response.json({ data: await service.latestHeight(normalizeNetwork(request.params.network)) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
