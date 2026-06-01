import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  await sql`
    ALTER TABLE nudges
    ADD COLUMN IF NOT EXISTS reactions text NOT NULL DEFAULT '{}'
  `
  console.log('✓ Added reactions column to nudges')
}

main().catch(err => { console.error(err); process.exit(1) })
