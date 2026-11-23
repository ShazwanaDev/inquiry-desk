import pg from 'pg';
import 'dotenv/config';

// A "pool" keeps a few database connections open and reuses them,
// instead of opening a new connection for every request (slow).
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});