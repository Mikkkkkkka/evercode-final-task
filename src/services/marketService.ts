import type { AddressRepository } from '../repositories/addressRepository.js';
import type { CoinRepository } from '../repositories/coinRepository.js';
import type { MarketRepository, AddressBalance, BlockchainHeight, PricePoint } from '../repositories/marketRepository.js';
import type { BinanceClient } from '../clients/binanceClient.js';
import type { BlockchainClient } from '../clients/blockchainClient.js';
import createLogger, { type AppLogger } from '../logger/index.js';

export class MarketService {
  constructor(
    private readonly coins: CoinRepository,
    private readonly addresses: AddressRepository,
    private readonly market: MarketRepository,
    private readonly binance: BinanceClient,
    private readonly blockchain: BlockchainClient,
    private readonly logger: AppLogger = createLogger('market-service')
  ) {}

  async refreshPrice(symbol: string): Promise<PricePoint> {
    this.logger.info('Price refresh started', { symbol });
    await this.coins.getBySymbol(symbol);
    const price = await this.binance.getUsdtPrice(symbol);
    const point = await this.market.savePrice(symbol, 'USDT', price, 'binance');
    this.logger.info('Price refresh completed', { symbol, price });
    return point;
  }

  async latestPrice(symbol: string): Promise<PricePoint> {
    return this.market.latestPrice(symbol);
  }

  async history(symbol: string, limit: number): Promise<PricePoint[]> {
    await this.coins.getBySymbol(symbol);
    return this.market.priceHistory(symbol, limit);
  }

  async refreshHeight(network: string): Promise<BlockchainHeight> {
    this.logger.info('Blockchain height refresh started', { network });
    const height = await this.blockchain.getHeight(network);
    const result = await this.market.saveHeight(network, height, 'mempool');
    this.logger.info('Blockchain height refresh completed', { network, height });
    return result;
  }

  async latestHeight(network: string): Promise<BlockchainHeight> {
    return this.market.getHeight(network);
  }

  async refreshBalance(addressId: number): Promise<AddressBalance> {
    this.logger.info('Address balance refresh started', { addressId });
    const address = await this.addresses.getById(addressId);
    const [balance, height] = await Promise.all([
      this.blockchain.getBalance(address.network, address.address),
      this.blockchain.getHeight(address.network)
    ]);
    await this.market.saveHeight(address.network, height, 'mempool');
    const result = await this.market.saveBalance(address.id, balance, 'mempool', height);
    this.logger.info('Address balance refresh completed', {
      addressId,
      network: address.network,
      balance,
      height
    });
    return result;
  }

  async latestBalance(addressId: number): Promise<AddressBalance> {
    await this.addresses.getById(addressId);
    return this.market.latestBalance(addressId);
  }

  async syncTrackedData(): Promise<void> {
    this.logger.info('Tracked data sync started');
    const coins = await this.coins.list();
    const activeCoins = coins.filter((item) => item.isActive);
    for (const coin of activeCoins) {
      await this.refreshPrice(coin.symbol);
    }

    const addresses = await this.addresses.list();
    const networks = new Set(addresses.map((address) => address.network));
    for (const network of networks) {
      await this.refreshHeight(network);
    }
    for (const address of addresses) {
      await this.refreshBalance(address.id);
    }
    this.logger.info('Tracked data sync completed', {
      activeCoins: activeCoins.length,
      networks: networks.size,
      addresses: addresses.length
    });
  }
}
