import { readFileSync } from 'fs'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

const envVars: Record<string, string> = {}
for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([^=\s#][^=]*)=(.*)$/)
  if (m) envVars[m[1].trim()] = m[2].trim()
}
const sql = neon(envVars['DATABASE_URL'])

async function migrate() {
  await sql`
    ALTER TABLE creators
      ADD COLUMN IF NOT EXISTS nudge_trigger_type TEXT NOT NULL DEFAULT 'inactivity',
      ADD COLUMN IF NOT EXISTS nudge_milestones   TEXT NOT NULL DEFAULT '25,50,75,90'
  `
  console.log('✓  nudge_trigger_type + nudge_milestones added to creators')
  console.log('✅  Migration complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
