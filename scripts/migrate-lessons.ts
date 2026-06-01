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
    CREATE TABLE IF NOT EXISTS lessons (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      position   INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓  lessons table')

  await sql`
    CREATE TABLE IF NOT EXISTS lesson_completions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      learner_id   UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(lesson_id, learner_id)
    )
  `
  console.log('✓  lesson_completions table')
  console.log('✅  Migration complete.')
}

migrate().catch(err => { console.error(err); process.exit(1) })
