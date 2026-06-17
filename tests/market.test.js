import request from 'supertest';
import { ExternalServiceError } from '../dist/errors.js';
import { createTestContext, auth } from './helpers.js';

let context;

beforeEach(async () => {
  context = await createTestContext();
  await auth(request(context.app).post('/coins')).send({ symbol: 'BTC', name: 'Bitcoin' }).expect(201);
});

afterEach(async () => {
  await context.db.close();
});

test('price refresh, latest and history work', async () => {
  const refreshed = await auth(request(context.app).post('/prices/BTC/refresh')).expect(200);
  expect(refreshed.body.data.price).toBe(42123.45);

  const latest = await auth(request(context.app).get('/prices/BTC/latest')).expect(200);
  expect(latest.body.data.source).toBe('binance');

  const history = await auth(request(context.app).get('/prices/BTC/history?limit=5')).expect(200);
  expect(history.body.data).toHaveLength(1);
});

test('price history validates limit', async () => {
  const response = await auth(request(context.app).get('/prices/BTC/history?limit=bad')).expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

test('latest price returns 404 before first refresh', async () => {
  const response = await auth(request(context.app).get('/prices/BTC/latest')).expect(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
});

test('external price errors return 502', async () => {
  context.binanceClient.error = new ExternalServiceError('Binance is unavailable');
  const response = await auth(request(context.app).post('/prices/BTC/refresh')).expect(502);
  expect(response.body.error.code).toBe('EXTERNAL_SERVICE_ERROR');
});

test('blockchain height refresh and latest read work', async () => {
  const refreshed = await auth(request(context.app).post('/blockchains/bitcoin/height/refresh')).expect(200);
  expect(refreshed.body.data.height).toBe(900001);

  const latest = await auth(request(context.app).get('/blockchains/bitcoin/height')).expect(200);
  expect(latest.body.data.source).toBe('mempool');
});

test('unsupported network height refresh is rejected by service', async () => {
  const response = await auth(request(context.app).post('/blockchains/litecoin/height/refresh')).expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});
