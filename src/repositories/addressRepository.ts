import type { Database } from 'sqlite';
import { ConflictError, NotFoundError } from '../errors.js';

export type TrackedAddress = {
  id: number;
  label: string;
  network: string;
  address: string;
  coinSymbol: string | null;
  createdAt: string;
  updatedAt: string;
};

type AddressRow = {
  id: number;
  label: string;
  network: string;
  address: string;
  coin_symbol: string | null;
  created_at: string;
  updated_at: string;
};

function mapAddress(row: AddressRow): TrackedAddress {
  return {
    id: row.id,
    label: row.label,
    network: row.network,
    address: row.address,
    coinSymbol: row.coin_symbol,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class AddressRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<TrackedAddress[]> {
    const rows = await this.db.all<AddressRow[]>('SELECT * FROM addresses ORDER BY id');
    return rows.map(mapAddress);
  }

  async create(input: Omit<TrackedAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrackedAddress> {
    try {
      const result = await this.db.run(
        'INSERT INTO addresses (label, network, address, coin_symbol) VALUES (?, ?, ?, ?)',
        input.label,
        input.network,
        input.address,
        input.coinSymbol
      );
      return this.getById(result.lastID as number);
    } catch (error) {
      if (String(error).includes('SQLITE_CONSTRAINT')) {
        throw new ConflictError('Address already exists or references an unknown coin');
      }
      throw error;
    }
  }

  async getById(id: number): Promise<TrackedAddress> {
    const row = await this.db.get<AddressRow>('SELECT * FROM addresses WHERE id = ?', id);
    if (!row) {
      throw new NotFoundError(`Address ${id} was not found`);
    }
    return mapAddress(row);
  }

  async update(id: number, input: Omit<TrackedAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrackedAddress> {
    try {
      const result = await this.db.run(
        `UPDATE addresses
         SET label = ?, network = ?, address = ?, coin_symbol = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        input.label,
        input.network,
        input.address,
        input.coinSymbol,
        id
      );
      if (result.changes === 0) {
        throw new NotFoundError(`Address ${id} was not found`);
      }
      return this.getById(id);
    } catch (error) {
      if (String(error).includes('SQLITE_CONSTRAINT')) {
        throw new ConflictError('Address already exists or references an unknown coin');
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    const result = await this.db.run('DELETE FROM addresses WHERE id = ?', id);
    if (result.changes === 0) {
      throw new NotFoundError(`Address ${id} was not found`);
    }
  }
}
