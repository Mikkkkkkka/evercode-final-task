import type { Database } from 'sqlite';
import { NotFoundError } from '../errors.js';

export type PricePoint = {
  id: number;
  coinSymbol: string;
  quoteAsset: string;
  price: number;
  source: string;
  recordedAt: string;
};

export type BlockchainHeight = {
  network: string;
  height: number;
  source: string;
  recordedAt: string;
};

export type AddressBalance = {
  id: number;
  addressId: number;
  balance: number;
  source: string;
  blockHeight: number | null;
  recordedAt: string;
};

type PriceRow = {
  id: number;
  coin_symbol: string;
  quote_asset: string;
  price: number;
  source: string;
  recorded_at: string;
};

type HeightRow = {
  network: string;
  height: number;
  source: string;
  recorded_at: string;
};

type BalanceRow = {
  id: number;
  address_id: number;
  balance: number;
  source: string;
  block_height: number | null;
  recorded_at: string;
};

function mapPrice(row: PriceRow): PricePoint {
  return {
    id: row.id,
    coinSymbol: row.coin_symbol,
    quoteAsset: row.quote_asset,
    price: row.price,
    source: row.source,
    recordedAt: row.recorded_at
  };
}

function mapHeight(row: HeightRow): BlockchainHeight {
  return {
    network: row.network,
    height: row.height,
    source: row.source,
    recordedAt: row.recorded_at
  };
}

function mapBalance(row: BalanceRow): AddressBalance {
  return {
    id: row.id,
    addressId: row.address_id,
    balance: row.balance,
    source: row.source,
    blockHeight: row.block_height,
    recordedAt: row.recorded_at
  };
}

export class MarketRepository {
  constructor(private readonly db: Database) {}

  async savePrice(coinSymbol: string, quoteAsset: string, price: number, source: string): Promise<PricePoint> {
    const result = await this.db.run(
      'INSERT INTO price_history (coin_symbol, quote_asset, price, source) VALUES (?, ?, ?, ?)',
      coinSymbol,
      quoteAsset,
      price,
      source
    );
    const row = await this.db.get<PriceRow>('SELECT * FROM price_history WHERE id = ?', result.lastID);
    return mapPrice(row as PriceRow);
  }

  async latestPrice(coinSymbol: string): Promise<PricePoint> {
    const row = await this.db.get<PriceRow>(
      'SELECT * FROM price_history WHERE coin_symbol = ? ORDER BY recorded_at DESC, id DESC LIMIT 1',
      coinSymbol
    );
    if (!row) {
      throw new NotFoundError(`Price for ${coinSymbol} was not found`);
    }
    return mapPrice(row);
  }

  async priceHistory(coinSymbol: string, limit: number): Promise<PricePoint[]> {
    const rows = await this.db.all<PriceRow[]>(
      'SELECT * FROM price_history WHERE coin_symbol = ? ORDER BY recorded_at DESC, id DESC LIMIT ?',
      coinSymbol,
      limit
    );
    return rows.map(mapPrice);
  }

  async saveHeight(network: string, height: number, source: string): Promise<BlockchainHeight> {
    await this.db.run(
      `INSERT INTO blockchain_heights (network, height, source)
       VALUES (?, ?, ?)
       ON CONFLICT(network) DO UPDATE
       SET height = excluded.height, source = excluded.source, recorded_at = CURRENT_TIMESTAMP`,
      network,
      height,
      source
    );
    return this.getHeight(network);
  }

  async getHeight(network: string): Promise<BlockchainHeight> {
    const row = await this.db.get<HeightRow>('SELECT * FROM blockchain_heights WHERE network = ?', network);
    if (!row) {
      throw new NotFoundError(`Blockchain height for ${network} was not found`);
    }
    return mapHeight(row);
  }

  async saveBalance(addressId: number, balance: number, source: string, blockHeight: number | null): Promise<AddressBalance> {
    const result = await this.db.run(
      'INSERT INTO address_balances (address_id, balance, source, block_height) VALUES (?, ?, ?, ?)',
      addressId,
      balance,
      source,
      blockHeight
    );
    const row = await this.db.get<BalanceRow>('SELECT * FROM address_balances WHERE id = ?', result.lastID);
    return mapBalance(row as BalanceRow);
  }

  async latestBalance(addressId: number): Promise<AddressBalance> {
    const row = await this.db.get<BalanceRow>(
      'SELECT * FROM address_balances WHERE address_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 1',
      addressId
    );
    if (!row) {
      throw new NotFoundError(`Balance for address ${addressId} was not found`);
    }
    return mapBalance(row);
  }
}
