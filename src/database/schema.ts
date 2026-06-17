import type { Database } from 'sqlite';

export async function migrate(db: Database): Promise<void> {
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS coins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      network TEXT NOT NULL,
      address TEXT NOT NULL,
      coin_symbol TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(network, address),
      FOREIGN KEY (coin_symbol) REFERENCES coins(symbol) ON UPDATE CASCADE ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coin_symbol TEXT NOT NULL,
      quote_asset TEXT NOT NULL,
      price REAL NOT NULL,
      source TEXT NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coin_symbol) REFERENCES coins(symbol) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blockchain_heights (
      network TEXT PRIMARY KEY,
      height INTEGER NOT NULL,
      source TEXT NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS address_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address_id INTEGER NOT NULL,
      balance REAL NOT NULL,
      source TEXT NOT NULL,
      block_height INTEGER,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_price_history_coin_time
      ON price_history(coin_symbol, recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_address_balances_address_time
      ON address_balances(address_id, recorded_at DESC);
  `);
}
