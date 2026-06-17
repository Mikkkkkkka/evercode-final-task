import { ExternalServiceError } from '../errors.js';
import type { RetryHttpClient } from './retryHttpClient.js';

type TickerResponse = {
  symbol: string;
  price: string;
};

export class BinanceClient {
  constructor(private readonly http: RetryHttpClient) {}

  async getUsdtPrice(baseAsset: string): Promise<number> {
    const ticker = await this.http.get<TickerResponse>('/api/v3/ticker/price', {
      symbol: `${baseAsset}USDT`
    });
    const price = Number(ticker.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new ExternalServiceError(`Binance returned invalid price for ${baseAsset}`);
    }
    return price;
  }
}
