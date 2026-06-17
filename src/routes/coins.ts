import { Router } from 'express';
import type { CoinRepository } from '../repositories/coinRepository.js';
import { normalizeSymbol, readString, requireBodyObject } from '../validation.js';

export function coinsRouter(repository: CoinRepository): Router {
  const router = Router();

  router.get('/', async (_request, response, next) => {
    try {
      response.json({ data: await repository.list() });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const body = requireBodyObject(request.body);
      const symbol = normalizeSymbol(body.symbol);
      const name = readString(body.name, 'name', 2, 80);
      const coin = await repository.create(symbol, name);
      response.status(201).json({ data: coin });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:symbol', async (request, response, next) => {
    try {
      response.json({ data: await repository.getBySymbol(normalizeSymbol(request.params.symbol)) });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:symbol', async (request, response, next) => {
    try {
      const body = requireBodyObject(request.body);
      const name = readString(body.name, 'name', 2, 80);
      const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
      const coin = await repository.update(normalizeSymbol(request.params.symbol), { name, isActive });
      response.json({ data: coin });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:symbol', async (request, response, next) => {
    try {
      await repository.delete(normalizeSymbol(request.params.symbol));
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
