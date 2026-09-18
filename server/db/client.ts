import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import * as schema from './schema/index.ts';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/workstation_dev';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Handle pool errors without crashing the server process
pool.on('error', (err) => {
  console.error('[DB Pool Error] Unexpected error on idle PostgreSQL client:', err);
});

export const db = drizzle(pool, { schema });

/**
 * Health check helper function to test database connectivity
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return { connected: true, latencyMs };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Database connection failed',
    };
  }
}
