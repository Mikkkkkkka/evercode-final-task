import http from 'node:http';
import { RetryHttpClient } from '../dist/clients/retryHttpClient.js';

function startServer(handler) {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}`
      });
    });
  });
}

test('retry http client retries transient failures', async () => {
  let calls = 0;
  const { server, url } = await startServer((_request, response) => {
    calls += 1;
    if (calls === 1) {
      response.writeHead(500).end('fail');
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true }));
  });

  try {
    const client = new RetryHttpClient({ baseURL: url, timeoutMs: 1000, retryAttempts: 1, retryDelayMs: 1 });
    await expect(client.get('/status')).resolves.toEqual({ ok: true });
    expect(calls).toBe(2);
  } finally {
    server.close();
  }
});

test('retry http client converts failed requests to external service error', async () => {
  const { server, url } = await startServer((_request, response) => {
    response.writeHead(503).end('fail');
  });

  try {
    const client = new RetryHttpClient({ baseURL: url, timeoutMs: 1000, retryAttempts: 1, retryDelayMs: 1 });
    await expect(client.get('/status')).rejects.toMatchObject({ statusCode: 502 });
  } finally {
    server.close();
  }
});
