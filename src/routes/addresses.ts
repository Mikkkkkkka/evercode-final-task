import { Router } from 'express';
import type { AddressRepository } from '../repositories/addressRepository.js';
import type { MarketService } from '../services/marketService.js';
import { parseId } from './helpers.js';
import {
  normalizeNetwork,
  normalizeSymbol,
  readOptionalString,
  readString,
  requireBodyObject
} from '../validation.js';

function readAddressPayload(body: Record<string, unknown>) {
  return {
    label: readString(body.label, 'label', 2, 80),
    network: normalizeNetwork(body.network),
    address: readString(body.address, 'address', 8, 160),
    coinSymbol: body.coinSymbol === undefined || body.coinSymbol === null ? null : normalizeSymbol(body.coinSymbol, 'coinSymbol')
  };
}

export function addressesRouter(repository: AddressRepository, market: MarketService): Router {
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
      const address = await repository.create(readAddressPayload(body));
      response.status(201).json({ data: address });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (request, response, next) => {
    try {
      response.json({ data: await repository.getById(parseId(request.params.id)) });
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (request, response, next) => {
    try {
      const body = requireBodyObject(request.body);
      const payload = readAddressPayload({
        ...body,
        label: readOptionalString(body.label, 'label', 80) ?? body.label
      });
      response.json({ data: await repository.update(parseId(request.params.id), payload) });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      await repository.delete(parseId(request.params.id));
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/balance/refresh', async (request, response, next) => {
    try {
      response.json({ data: await market.refreshBalance(parseId(request.params.id)) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id/balance', async (request, response, next) => {
    try {
      response.json({ data: await market.latestBalance(parseId(request.params.id)) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
