import request from 'supertest';
import { createTestContext, auth } from './helpers.js';

let context;

beforeEach(async () => {
  context = await createTestContext();
});

afterEach(async () => {
  await context.db.close();
});

test('GET /health returns service status', async () => {
  await request(context.app).get('/health').expect(200, { status: 'ok' });
});

test('protected routes reject missing bearer token', async () => {
  const response = await request(context.app).get('/coins').expect(401);
  expect(response.body.error.code).toBe('UNAUTHORIZED');
});

test('protected routes accept valid bearer token', async () => {
  const response = await auth(request(context.app).get('/coins')).expect(200);
  expect(response.body.data).toEqual([]);
});

test('GET /openapi.json exposes OpenAPI document', async () => {
  const response = await request(context.app).get('/openapi.json').expect(200);
  expect(response.body.openapi).toBe('3.0.3');
});
