export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Crypto Tracker API',
    version: '1.0.0'
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerApiKey: {
        type: 'http',
        scheme: 'bearer'
      }
    }
  },
  security: [{ bearerApiKey: [] }],
  paths: {
    '/health': {
      get: {
        security: [],
        responses: { '200': { description: 'Service is healthy' } }
      }
    },
    '/coins': {
      get: { responses: { '200': { description: 'List tracked coins' } } },
      post: { responses: { '201': { description: 'Create tracked coin' } } }
    },
    '/coins/{symbol}': {
      get: { responses: { '200': { description: 'Get tracked coin' }, '404': { description: 'Not found' } } },
      put: { responses: { '200': { description: 'Update tracked coin' } } },
      delete: { responses: { '204': { description: 'Delete tracked coin' } } }
    },
    '/addresses': {
      get: { responses: { '200': { description: 'List tracked addresses' } } },
      post: { responses: { '201': { description: 'Create tracked address' } } }
    },
    '/addresses/{id}': {
      get: { responses: { '200': { description: 'Get tracked address' } } },
      put: { responses: { '200': { description: 'Update tracked address' } } },
      delete: { responses: { '204': { description: 'Delete tracked address' } } }
    },
    '/addresses/{id}/balance': {
      get: { responses: { '200': { description: 'Get latest address balance' } } }
    },
    '/addresses/{id}/balance/refresh': {
      post: { responses: { '200': { description: 'Refresh address balance' } } }
    },
    '/prices/{symbol}/refresh': {
      post: { responses: { '200': { description: 'Refresh coin price from Binance' } } }
    },
    '/prices/{symbol}/latest': {
      get: { responses: { '200': { description: 'Get latest stored coin price' } } }
    },
    '/prices/{symbol}/history': {
      get: { responses: { '200': { description: 'Get stored coin price history' } } }
    },
    '/blockchains/{network}/height': {
      get: { responses: { '200': { description: 'Get latest stored blockchain height' } } }
    },
    '/blockchains/{network}/height/refresh': {
      post: { responses: { '200': { description: 'Refresh blockchain height' } } }
    }
  }
};
