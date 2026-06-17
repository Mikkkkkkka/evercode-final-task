import type { Database } from 'sqlite';
import { ConflictError, NotFoundError } from '../errors.js';

export type Coin = {
  id: number;
  symbol: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CoinRow = {
  id: number;
  symbol: string;
  name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function mapCoin(row: CoinRow): Coin {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class CoinRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<Coin[]> {
    const rows = await this.db.all<CoinRow[]>('SELECT * FROM coins ORDER BY symbol');
    return rows.map(mapCoin);
  }

  async create(symbol: string, name: string): Promise<Coin> {
    try {
      await this.db.run('INSERT INTO coins (symbol, name) VALUES (?, ?)', symbol, name);
    } catch (error) {
      if (String(error).includes('SQLITE_CONSTRAINT')) {
        throw new ConflictError(`Coin ${symbol} already exists`);
      }
      throw error;
    }
    return this.getBySymbol(symbol);
  }

  async getBySymbol(symbol: string): Promise<Coin> {
    const row = await this.db.get<CoinRow>('SELECT * FROM coins WHERE symbol = ?', symbol);
    if (!row) {
      throw new NotFoundError(`Coin ${symbol} was not found`);
    }
    return mapCoin(row);
  }

  async update(symbol: string, data: { name: string; isActive: boolean }): Promise<Coin> {
    const result = await this.db.run(
      'UPDATE coins SET name = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE symbol = ?',
      data.name,
      data.isActive ? 1 : 0,
      symbol
    );
    if (result.changes === 0) {
      throw new NotFoundError(`Coin ${symbol} was not found`);
    }
    return this.getBySymbol(symbol);
  }

  async delete(symbol: string): Promise<void> {
    const result = await this.db.run('DELETE FROM coins WHERE symbol = ?', symbol);
    if (result.changes === 0) {
      throw new NotFoundError(`Coin ${symbol} was not found`);
    }
  }
}
