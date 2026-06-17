import { loadConfig } from '../config.js';
import { openDatabase } from './connection.js';

const db = await openDatabase(loadConfig().dbPath);
await db.close();
