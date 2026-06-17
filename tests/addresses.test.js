import request from 'supertest';
import { createTestContext, auth } from './helpers.js';

let context;

beforeEach(async () => {
  context = await createTestContext();
  await auth(request(context.app).post('/coins')).send({ symbol: 'BTC', name: 'Bitcoin' }).expect(201);
});

afterEach(async () => {
  await context.db.close();
});

test('addresses CRUD works', async () => {
  const created = await auth(request(context.app).post('/addresses'))
    .send({ label: 'Treasury', network: 'bitcoin', address: 'bc1qtestaddress00001', coinSymbol: 'BTC' })
    .expect(201);
  expect(created.body.data.id).toBe(1);

  await auth(request(context.app).get('/addresses/1')).expect(200);

  const updated = await auth(request(context.app).put('/addresses/1'))
    .send({ label: 'Cold wallet', network: 'bitcoin', address: 'bc1qtestaddress00002', coinSymbol: 'BTC' })
    .expect(200);
  expect(updated.body.data.label).toBe('Cold wallet');

  const list = await auth(request(context.app).get('/addresses')).expect(200);
  expect(list.body.data).toHaveLength(1);

  await auth(request(context.app).delete('/addresses/1')).expect(204);
});

test('address creation validates request body', async () => {
  const response = await auth(request(context.app).post('/addresses'))
    .send({ label: 'x', network: 'Bitcoin Mainnet', address: 'short' })
    .expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

test('address creation rejects unknown coin reference', async () => {
  const response = await auth(request(context.app).post('/addresses'))
    .send({ label: 'Wallet', network: 'bitcoin', address: 'bc1qtestaddress00001', coinSymbol: 'ETH' })
    .expect(409);
  expect(response.body.error.code).toBe('CONFLICT');
});

test('address balance refresh and latest read work', async () => {
  await auth(request(context.app).post('/addresses'))
    .send({ label: 'Treasury', network: 'bitcoin', address: 'bc1qtestaddress00001', coinSymbol: 'BTC' })
    .expect(201);

  const refreshed = await auth(request(context.app).post('/addresses/1/balance/refresh')).expect(200);
  expect(refreshed.body.data.balance).toBe(0.25);

  const latest = await auth(request(context.app).get('/addresses/1/balance')).expect(200);
  expect(latest.body.data.blockHeight).toBe(900001);
});

test('missing address balance returns 404', async () => {
  const response = await auth(request(context.app).get('/addresses/404/balance')).expect(404);
  expect(response.body.error.code).toBe('NOT_FOUND');
});
