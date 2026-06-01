import { readFileSync } from 'fs'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

const envPath = resolve(process.cwd(), '.env.local')
const envVars: Record<string, string> = {}
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^=\s#][^=]*)=(.*)$/)
  if (m) envVars[m[1].trim()] = m[2].trim()
}
const sql = neon(envVars['DATABASE_URL']!)

async function migrate() {
  await sql`ALTER TABLE creators ADD COLUMN IF NOT EXISTS sprints_enabled BOOLEAN NOT NULL DEFAULT true`
  console.log('✓ creators.sprints_enabled')

  await sql`
    CREATE TABLE IF NOT EXISTS learning_sprints (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_id    UUID        NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
      course_id     UUID        REFERENCES courses(id) ON DELETE SET NULL,
      title         TEXT        NOT NULL,
      description   TEXT,
      skill_focus   TEXT,
      start_date    DATE        NOT NULL,
      end_date      DATE        NOT NULL,
      join_deadline DATE        NOT NULL,
      max_members   INTEGER     DEFAULT 20,
      status        TEXT        NOT NULL DEFAULT 'open',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ learning_sprints')

  await sql`
    CREATE TABLE IF NOT EXISTS sprint_members (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      sprint_id    UUID        NOT NULL REFERENCES learning_sprints(id) ON DELETE CASCADE,
      student_id   UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      progress_pct INTEGER     NOT NULL DEFAULT 0,
      joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(sprint_id, student_id)
    )
  `
  console.log('✓ sprint_members')

  await sql`
    CREATE TABLE IF NOT EXISTS sprint_posts (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      sprint_id       UUID        NOT NULL REFERENCES learning_sprints(id) ON DELETE CASCADE,
      author_name     TEXT        NOT NULL,
      author_initials TEXT        NOT NULL,
      content         TEXT        NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ sprint_posts')

  await sql`
    CREATE TABLE IF NOT EXISTS sprint_replies (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id         UUID        NOT NULL REFERENCES sprint_posts(id) ON DELETE CASCADE,
      author_name     TEXT        NOT NULL,
      author_initials TEXT        NOT NULL,
      content         TEXT        NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  console.log('✓ sprint_replies')
  console.log('\n✅ All migrations applied.')
}

migrate().catch(e => { console.error(e); process.exit(1) })
