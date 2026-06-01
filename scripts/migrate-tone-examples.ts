import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  await sql`
    ALTER TABLE creators
    ADD COLUMN IF NOT EXISTS nudge_tone_examples text
  `
  console.log('✓ Added nudge_tone_examples column to creators')
}

main().catch(err => { console.error(err); process.exit(1) })
