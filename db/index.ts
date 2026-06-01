import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// During Vercel's "Collecting page data" build phase, Turbopack evaluates every
// route module at import time — before runtime env vars are injected.  Passing a
// placeholder URL prevents neon() from throwing so the build completes.  At
// runtime DATABASE_URL is always present (set in Vercel project settings), so
// actual queries always use the real Neon connection.
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://build:time@localhost/placeholder')
export const db = drizzle(sql, { schema })
