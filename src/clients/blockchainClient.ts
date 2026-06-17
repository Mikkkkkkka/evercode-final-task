import { ExternalServiceError, ValidationError } from '../errors.js';
import type { RetryHttpClient } from './retryHttpClient.js';

type AddressResponse = {
  chain_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
  mempool_stats: {
    funded_txo_sum: number;
    spent_txo_sum: number;
  };
};

export class BlockchainClient {
  constructor(private readonly http: RetryHttpClient) {}

  async getHeight(network: string): Promise<number> {
    this.assertBitcoin(network);
    const value = await this.http.get<number>('/blocks/tip/height');
    if (!Number.isInteger(value) || value < 0) {
      throw new ExternalServiceError('Mempool returned invalid height');
    }
    return value;
  }

  async getBalance(network: string, address: string): Promise<number> {
    this.assertBitcoin(network);
    const data = await this.http.get<AddressResponse>(`/address/${encodeURIComponent(address)}`);
    const sats =
      data.chain_stats.funded_txo_sum -
      data.chain_stats.spent_txo_sum +
      data.mempool_stats.funded_txo_sum -
      data.mempool_stats.spent_txo_sum;
    if (!Number.isFinite(sats) || sats < 0) {
      throw new ExternalServiceError('Mempool returned invalid balance');
    }
    return sats / 100_000_000;
  }

  private assertBitcoin(network: string): void {
    if (network !== 'bitcoin') {
      throw new ValidationError('Only bitcoin network is supported for blockchain data');
    }
  }
}
