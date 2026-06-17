import request from 'supertest';
import { createTestContext, auth } from './helpers.js';

let context;

beforeEach(async () => {
  context = await createTestContext();
});

afterEach(async () => {
  await context.db.close();
});

test('coins CRUD works', async () => {
  const created = await auth(request(context.app).post('/coins'))
    .send({ symbol: 'btc', name: 'Bitcoin' })
    .expect(201);
  expect(created.body.data.symbol).toBe('BTC');

  await auth(request(context.app).get('/coins/BTC')).expect(200);

  const updated = await auth(request(context.app).put('/coins/BTC'))
    .send({ name: 'Bitcoin Network', isActive: false })
    .expect(200);
  expect(updated.body.data.isActive).toBe(false);

  const list = await auth(request(context.app).get('/coins')).expect(200);
  expect(list.body.data).toHaveLength(1);

  await auth(request(context.app).delete('/coins/BTC')).expect(204);
});

test('coin creation validates request body', async () => {
  const response = await auth(request(context.app).post('/coins'))
    .send({ symbol: '!', name: 'x' })
    .expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

test('coin creation rejects duplicates', async () => {
  await auth(request(context.app).post('/coins')).send({ symbol: 'ETH', name: 'Ethereum' }).expect(201);
  const response = await auth(request(context.app).post('/coins')).send({ symbol: 'ETH', name: 'Ethereum' }).expect(409);
  expect(response.body.error.code).toBe('CONFLICT');
});

test('missing coin returns 404', async () => {
  const response = await auth(request(context.app).get('/coins/DOGE')).expect(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
});
