import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.ts';
import path from 'path';

async function runMigrations() {
  console.log('[Drizzle Migration] Running migrations from server/db/migrations...');
  try {
    await migrate(db, { migrationsFolder: path.resolve('server/db/migrations') });
    console.log('[Drizzle Migration] Migrations applied successfully!');
  } catch (error) {
    console.error('[Drizzle Migration Error] Failed to apply migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
