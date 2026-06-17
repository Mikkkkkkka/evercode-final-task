import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { migrate } from './schema.js';

export async function openDatabase(filename: string): Promise<Database> {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const db = await open({
    filename,
    driver: sqlite3.Database
  });

  await migrate(db);
  return db;
}
