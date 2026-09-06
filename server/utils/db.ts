import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

// IMPORTANT: Only use this from server/ (Nitro routes, middleware, utils).
// NEVER import @neondatabase/serverless from src/ — that bundle ships to the browser.
// Prefer sql`...` tagged queries or Drizzle over string-built SQL.